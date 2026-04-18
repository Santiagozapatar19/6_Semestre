# Guía de Tareas — Aseguradora API

> Lean el `README.md` principal primero para entender cómo correr el proyecto, la estructura general y los endpoints disponibles.

---

## Objetivo

El proyecto tiene implementadas las funcionalidades de autenticación, usuarios, empleados y vehículos. Su tarea tiene **dos partes**:

1. **Encontrar y corregir errores** en el código ya existente (el código funciona parcialmente, pero tiene bugs que hacen fallar los tests).
2. **Implementar el módulo de ventas y comisiones**, que es el corazón del negocio.

Al finalizar, corran `npm test`. Si **todas las pruebas pasan (31/31)**, la entrega es correcta.

---

## Parte 1 — Corrección de bugs

El código existente contiene **8 bugs** distribuidos en los servicios ya implementados. Estos errores hacen que algunos tests fallen desde el inicio, antes de que escriban una sola línea de código nuevo.

Su primera tarea es identificar y corregir esos bugs leyendo el código y analizando qué espera cada test.

**Pistas generales (sin revelar los bugs):**

- Revisen que las funciones que actualizan documentos en MongoDB retornen el estado correcto.
- Revisen que las consultas busquen documentos por el campo correcto.
- Revisen que los datos sensibles de los usuarios no queden expuestos en las respuestas.
- Revisen que los filtros opcionales en las consultas se apliquen correctamente.
- Revisen que las comparaciones de strings sean consistentes en mayúsculas/minúsculas.

> Los tests son su guía: ejecuten `npm test`, lean los mensajes de error y tracen el flujo desde el test hasta el servicio.

---

## Parte 2 — Implementación de TODOs

### Archivos que deben modificar

| Archivo | TODOs obligatorios | BONUS |
|---------|-------------------|-------|
| `src/services/sale.service.ts` | TODO 1, TODO 2 | *(TODO 3)* |
| `src/controllers/sale.controller.ts` | TODO 4, TODO 5 | *(TODO 6)* |
| `src/services/vehicle.service.ts` | TODO 7 | |
| `src/controllers/vehicle.controller.ts` | TODO 7 | |

---

### TODO 1 — `sale.service.ts` → función `createSale`

Esta función registra una nueva venta. Deben:

1. Buscar el vehículo por `data.vehicleId`. Si no existe → error `"Vehículo no encontrado"`.
2. El vehículo debe tener `status === 'available'`. Si no → error `"El vehículo no está disponible"`.
3. Buscar el comprador por `data.buyerId`. Si no existe o `isActive === false` → error `"Comprador no encontrado o inactivo"`.
4. Buscar el empleado vendedor por `sellerId` (viene del JWT, no del body). Si no existe o `isActive === false` → error `"Empleado no encontrado o inactivo"`.
5. **Calcular la comisión:**
   ```
   commissionAmount = salePrice × commissionRate / 100
   ```
   Donde `commissionRate` se **toma del empleado** y se congela en la venta.
6. **Flujo según método de pago:**

   | `paymentMethod` | Estado de la venta | Estado del vehículo |
   |-----------------|-------------------|-------------------|
   | `cash` | `completed` | `sold` |
   | `financing` / `credit_card` / `transfer` | `pending` | `reserved` |

7. Si el pago es `cash`, además deben asignar `vehicle.owner = buyer._id` y `vehicle.soldBy = seller._id`.
8. Guardar la venta y actualizar el vehículo. Devolver la venta con populate de `vehicle`, `buyer` y `seller`.

---

### TODO 2 — `sale.service.ts` → función `updateSaleStatus`

Esta función la llama el admin para confirmar o cancelar una venta pendiente.

1. Buscar la venta por `id`. Si no existe → error `"Venta no encontrada"`.
2. Si el nuevo estado es `completed`:
   - Cambiar el estado del vehículo a `sold`.
   - Asignar `vehicle.owner = sale.buyer` y `vehicle.soldBy = sale.seller`.
3. Si el nuevo estado es `cancelled`:
   - Cambiar el estado del vehículo de vuelta a `available`.
   - Limpiar `vehicle.owner` y `vehicle.soldBy` (asignar `undefined`).
4. Guardar ambos documentos (venta y vehículo) y devolver la venta actualizada.

---

### TODO 4 — `sale.controller.ts` → función `createSale`

1. Parsear el body con `createSaleSchema.safeParse`. Si falla → `res.status(400).json({ error: ... })`.
2. Extraer el ID del empleado desde `req.employee?.id` (lo pone el middleware `isEmployee`). Si no existe → `400`.
3. Llamar a `saleService.createSale(employeeId, parsed.data)`.
4. Responder con `201` y la venta creada. En el `catch`, responder `400` con el mensaje de error.

---

### TODO 5 — `sale.controller.ts` → función `updateSaleStatus`

1. Parsear el body con `updateSaleStatusSchema`. Si falla → `400`.
2. Tomar `req.params.id` como el ID de la venta.
3. Llamar a `saleService.updateSaleStatus(id, parsed.data)`.
4. Responder con `200` y la venta actualizada. En el `catch`, responder `400`.

---

### TODO 7 — `vehicle.service.ts` + `vehicle.controller.ts` → `filterVehicles`

Implementar un filtro dinámico de vehículos por múltiples criterios opcionales.

**En el servicio** (`filterVehicles`): construir un objeto `filter` dinámicamente, agregando solo los campos que vengan definidos. Para `minPrice`/`maxPrice` usar `$gte` y `$lte` sobre el campo `basePrice`.

**En el controlador** (`filterVehicles`): leer los query params de `req.query`, construir el objeto de filtros y pasarlo al servicio. Responder `200` con los resultados.

**Parámetros de query soportados:**

| Param | Tipo | Ejemplo |
|-------|------|---------|
| `brand` | string | `Toyota` |
| `year` | number | `2022` |
| `fuelType` | string | `electric` |
| `transmission` | string | `automatic` |
| `minPrice` | number | `50000000` |
| `maxPrice` | number | `120000000` |
| `status` | string | `available` |

**Ruta:** `GET /api/vehicles/filter?brand=Toyota&minPrice=50000000`

---

### TODO 3 + 6 *(BONUS)* — Reporte de comisiones

**TODO 3 — `sale.service.ts` → función `getCommissionReport`**

Generar un reporte de comisiones de un empleado agrupado por mes. Solo deben contarse las ventas que no estén canceladas.

La función recibe un `employeeId` y debe devolver un arreglo:

```json
[
  { "year": 2025, "month": 3, "totalSales": 2, "totalCommission": 4800000 },
  { "year": 2025, "month": 4, "totalSales": 5, "totalCommission": 11200000 }
]
```

Pista: usen MongoDB aggregation pipeline (`.aggregate()`). Necesitan los stages `$match`, `$group`, `$sort` y `$project`.

**TODO 6 — `sale.controller.ts` → función `getCommissionReport`**

1. Tomar `req.params.employeeId` como el ID del empleado.
2. Llamar a `saleService.getCommissionReport(employeeId)`.
3. Responder `200` con el reporte. En el `catch`, responder `400`.

---

## Conceptos clave

### ¿Dónde vive `commissionRate`?

El porcentaje de comisión está en el modelo `Employee`. Cuando se registra una venta, se **congela una copia** de ese valor en `Sale.commissionRate`. Así, si la comisión del empleado cambia en el futuro, las ventas históricas no se ven afectadas.

### ¿Cómo sé quién es el empleado que vende?

El empleado viene del JWT, no del body. El middleware `isEmployee` verifica el token, consulta la colección `Employee` y adjunta el perfil en `req.employee`. En el controlador se accede con:

```typescript
const sellerId = req.employee?.id; // _id del documento Employee
```

### Esquemas de validación disponibles

```typescript
import { createSaleSchema, updateSaleStatusSchema } from '../schemas/sale.schema';
```

- `createSaleSchema`: valida `vehicleId`, `buyerId`, `salePrice`, `paymentMethod` (y opcionalmente `notes`).
- `updateSaleStatusSchema`: valida `status` (`completed` | `cancelled`).

---

## Diagrama de estados

```
           Pago cash
createSale ──────────→ completed ──────────────── (fin)

           Otros pagos
createSale ──────────→ pending ──→ completed ──── (fin)
                                └→ cancelled ──── (fin)
```

Efecto en el vehículo:

```
available → reserved  (venta pending)
available → sold       (venta cash)
reserved  → sold       (venta completed)
reserved  → available  (venta cancelled)
```

---

## Pistas de implementación

<details>
<summary>Estructura base de createSale</summary>

```typescript
export const createSale = async (sellerId: string, data: CreateSaleInput) => {
  const vehicle = await Vehicle.findById(data.vehicleId);
  // validar que vehicle exista y sea 'available' ...

  const buyer = await User.findById(data.buyerId);
  // validar buyer activo ...

  const seller = await Employee.findById(sellerId);
  // validar seller activo ...

  const commissionAmount = data.salePrice * seller.commissionRate / 100;

  const saleStatus = data.paymentMethod === 'cash' ? 'completed' : 'pending';
  const vehicleStatus = data.paymentMethod === 'cash' ? 'sold' : 'reserved';

  const sale = await Sale.create({ ... });

  vehicle.status = vehicleStatus;
  // si cash: asignar vehicle.owner y vehicle.soldBy ...
  await vehicle.save();

  return sale.populate(['vehicle', 'buyer', 'seller']);
};
```
</details>

<details>
<summary>Pipeline de agregación para getCommissionReport</summary>

```typescript
const report = await Sale.aggregate([
  {
    $match: {
      seller: new mongoose.Types.ObjectId(employeeId),
      status: { $ne: 'cancelled' },
    },
  },
  {
    $group: {
      _id: { year: { $year: '$saleDate' }, month: { $month: '$saleDate' } },
      totalSales: { $sum: 1 },
      totalCommission: { $sum: '$commissionAmount' },
    },
  },
  { $sort: { '_id.year': 1, '_id.month': 1 } },
  {
    $project: {
      _id: 0,
      year: '$_id.year',
      month: '$_id.month',
      totalSales: 1,
      totalCommission: 1,
    },
  },
]);
```
</details>

---

## Rúbrica de evaluación

La nota final es sobre **5.0**. Cada criterio se evalúa automáticamente por los tests (`npm test`).

| Criterio | Puntos |
|----------|--------|
| **Parte 1 — Corrección de bugs** | **2.0** |
| Cada bug correctamente corregido (8 en total) | 0.25 c/u |
| **Parte 2 — Implementación obligatoria** | **2.5** |
| TODO 1 — `createSale` service (lógica completa) | 0.75 |
| TODO 2 — `updateSaleStatus` service | 0.5 |
| TODO 4 — `createSale` controller | 0.5 |
| TODO 5 — `updateSaleStatus` controller | 0.25 |
| TODO 7 — `filterVehicles` service + controller | 0.5 |
| **Calidad de código** | **0.5** |
| Código limpio, sin redundancias, errores bien manejados | 0.5 |
| **TOTAL** | **5.0** |
| **BONUS — Reporte de comisiones** (TODO 3 + TODO 6) | **+0.5** |

> La calidad de código se evalúa manualmente: manejo correcto de errores, no copiar código innecesario, no dejar `console.log` ni código muerto.

---

## Lista de entrega

- [ ] **Parte 1:** Los 8 bugs encontrados y corregidos
- [ ] TODO 1 implementado — `createSale` service
- [ ] TODO 2 implementado — `updateSaleStatus` service
- [ ] TODO 4 implementado — `createSale` controller
- [ ] TODO 5 implementado — `updateSaleStatus` controller
- [ ] TODO 7 implementado — `filterVehicles` service + controller
- [ ] `npm test` → **31/31 pruebas pasan** ✅
- [ ] *(Bonus)* TODO 3 + TODO 6 — `getCommissionReport` service y controller
