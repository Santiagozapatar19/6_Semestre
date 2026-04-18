[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/cXLkTOwk)
# 🚗 Aseguradora API

API REST para un sistema de gestión de una aseguradora de vehículos. Construida con **Node.js**, **TypeScript**, **Express** y **MongoDB (Mongoose)**.

---

## 📋 Tabla de contenidos

- [Requisitos](#requisitos)
- [Configuración de la base de datos](#configuración-de-la-base-de-datos)
- [Instalación y arranque](#instalación-y-arranque)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Modelos y reglas de negocio](#modelos-y-reglas-de-negocio)
- [Endpoints](#endpoints)
- [Flujo de uso recomendado](#flujo-de-uso-recomendado)
- [Correr las pruebas](#correr-las-pruebas)

---

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm v8 o superior
- Una base de datos MongoDB memoria

---

## Configuración de la base de datos

1. Creen el archivo `.env` en la raíz del proyecto con el contenido que el profesor les comparta. Tendrá este formato:

```env
PORT=3000
JWT_SECRET=supersecretkey_cambiame_en_produccion
JWT_EXPIRES_IN=7d
```

El volumen de datos no persiste entre reinicios, así que sus datos se pierden.

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el .env (ver sección anterior)

# 3. Correr en modo desarrollo (con hot-reload)
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

Para confirmar que está corriendo, visiten `GET http://localhost:3000` y deben ver:
```
Aseguradora API corriendo 🚀
```

---

## Estructura del proyecto

```
src/
├── config/
│   └── db.ts              # Conexión a MongoDB
├── controllers/           # Capa HTTP: reciben req, llaman al servicio, devuelven res
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── employee.controller.ts
│   ├── vehicle.controller.ts
│   └── sale.controller.ts
├── middlewares/           # Funciones que corren antes del controlador
│   ├── auth.ts            # Verifica el JWT
│   ├── isAdmin.ts         # Valida que el usuario sea admin
│   ├── isEmployee.ts      # Valida que el usuario sea empleado activo
│   └── errorHandler.ts    # Manejo global de errores y 404
├── models/                # Esquemas de Mongoose (estructura de la BD)
│   ├── user.model.ts
│   ├── employee.model.ts
│   ├── vehicle.model.ts
│   └── sale.model.ts
├── routes/                # Definición de endpoints y middlewares por ruta
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── employee.routes.ts
│   ├── vehicle.routes.ts
│   ├── sale.routes.ts
│   └── index.ts           # Agrupa todas las rutas bajo /api
├── schemas/               # Validación de entrada con Zod
│   ├── user.schema.ts
│   ├── employee.schema.ts
│   ├── vehicle.schema.ts
│   └── sale.schema.ts
├── services/              # Lógica de negocio (aquí vive el "qué hace" el sistema)
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── employee.service.ts
│   ├── vehicle.service.ts
│   └── sale.service.ts
├── tests/                 # Pruebas automatizadas con Jest + Supertest
│   ├── helpers/
│   │   └── db.ts
│   ├── auth.test.ts
│   ├── user.test.ts
│   ├── employee.test.ts
│   ├── vehicle.test.ts
│   └── sale.test.ts
├── app.ts                 # Configuración de Express (sin iniciar el servidor)
└── index.ts               # Punto de entrada: conecta BD y arranca el servidor
```

---

## Modelos y reglas de negocio

### 👤 User

Representa a cualquier persona en el sistema. Los roles posibles son:

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso total. Puede crear empleados, vehículos, gestionar ventas. |
| `employee` | Puede registrar ventas y ver vehículos. |
| `client` | Comprador de vehículos. |

> Un mismo usuario puede empezar como `client` y luego convertirse en `employee` cuando se le crea un perfil de empleado.

Campos importantes: `name`, `lastName`, `email`, `documentId` (cédula/NIT), `role`, `isActive`, `deletedAt`.

---

### 👷 Employee

Un empleado **siempre está vinculado a un User**. No es una entidad independiente — primero se crea el usuario y luego se crea el perfil de empleado apuntando a ese usuario.

```
Usuario (role: employee) ←── Employee (position, salary, commissionRate...)
```

> **⚠️ Punto importante:** La tasa de comisión (`commissionRate`) vive en el modelo `Employee`, no en `Sale`. Cuando se registra una venta, el sistema automáticamente toma el `commissionRate` del empleado **en ese momento** y lo congela en la venta. Esto es importante porque si la comisión del empleado cambia en el futuro, las ventas históricas conservan la comisión original con la que se pactaron.

Campos importantes: `user` (ref a User), `position`, `department`, `hireDate`, `commissionRate` (porcentaje, ej: `8` = 8%), `salary`.

---

### 🚗 Vehicle

Representa un vehículo disponible para la venta. Los campos del estado (`status`) son:

| Estado | Cuándo ocurre |
|--------|--------------|
| `available` | Recién registrado o venta cancelada |
| `reserved` | Se inició una venta con pago no inmediato (financiamiento, transferencia, tarjeta) |
| `sold` | Venta completada (pago en efectivo o confirmada por admin) |
| `in_review` | Vehículo en revisión técnica (actualización manual) |

> **⚠️ Punto importante:** El campo `vehicleModel` (no `model`) almacena el modelo del vehículo (ej: "Corolla"). El nombre `model` está reservado por Mongoose internamente.

Campos importantes: `licensePlate` (placa), `vin` (chasis), `brand`, `vehicleModel`, `year`, `fuelType`, `transmission`, `basePrice`, `owner` (ref a User tras la venta), `soldBy` (ref a Employee).

---

### 💰 Sale

Registra la transacción de compra de un vehículo. Vincula comprador, vendedor y vehículo.

> **⚠️ Puntos importantes:**
> - El empleado que crea la venta es el vendedor. Se detecta automáticamente desde el JWT (no hay que enviarlo en el body).
> - `commissionAmount` se calcula automáticamente: `salePrice × commissionRate / 100`. No se envía desde el cliente.
> - El flujo de estados depende del método de pago:

| `paymentMethod` | Estado inicial venta | Estado vehículo |
|-----------------|---------------------|----------------|
| `cash` | `completed` | `sold` |
| `financing` / `credit_card` / `transfer` | `pending` | `reserved` |

Una vez creada la venta, el admin puede cambiar el estado con `PATCH /api/sales/:id/status`:

| Nuevo estado | Efecto en vehículo |
|-------------|-------------------|
| `completed` | `sold` |
| `cancelled` | `available` (se libera) |

---

## Endpoints

Todas las rutas llevan el prefijo `/api`. Para las rutas protegidas deben enviar el header:
```
Authorization: Bearer <token_jwt>
```

### Auth
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | Público | Registrar nuevo usuario |
| POST | `/api/auth/login` | Público | Iniciar sesión, devuelve JWT |

### Users
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/users/me` | Autenticado | Ver mi perfil |
| GET | `/api/users` | Admin | Listar todos los usuarios |
| GET | `/api/users?role=client` | Admin | Filtrar por rol |
| GET | `/api/users/:id` | Admin | Ver usuario por ID |
| PUT | `/api/users/:id` | Admin | Actualizar usuario |
| DELETE | `/api/users/:id` | Admin | Desactivar usuario (soft delete) |

### Employees
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/employees` | Admin | Crear perfil de empleado |
| GET | `/api/employees` | Autenticado | Listar empleados activos |
| GET | `/api/employees/:id` | Autenticado | Ver empleado por ID |
| GET | `/api/employees/:id/commissions` | Admin | Ver ventas y comisiones del empleado |
| PUT | `/api/employees/:id` | Admin | Actualizar datos del empleado |

### Vehicles
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/vehicles/available` | Autenticado | Listar vehículos disponibles |
| GET | `/api/vehicles` | Employee/Admin | Listar todos los vehículos |
| GET | `/api/vehicles/:id` | Employee/Admin | Ver vehículo por ID |
| POST | `/api/vehicles` | Admin | Registrar nuevo vehículo |
| PUT | `/api/vehicles/:id` | Employee/Admin | Actualizar vehículo |
| DELETE | `/api/vehicles/:id` | Admin | Eliminar vehículo |

### Sales
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/sales` | Employee | Registrar una venta |
| GET | `/api/sales` | Admin | Listar todas las ventas |
| GET | `/api/sales/:id` | Employee/Admin | Ver venta por ID |
| PATCH | `/api/sales/:id/status` | Admin | Cambiar estado de la venta |
| GET | `/api/sales/employee/:employeeId` | Employee/Admin | Ventas de un empleado |
| GET | `/api/sales/buyer/:buyerId` | Autenticado | Compras de un cliente |

---

## Flujo de uso recomendado

Sigan este orden para probar el sistema desde cero con Postman o Insomnia:

```
1. POST /api/auth/register        → Crear usuario admin
2. POST /api/auth/login           → Obtener token admin

3. POST /api/auth/register        → Crear usuario con role "employee"
4. POST /api/employees            → Crear perfil de empleado (usar _id del paso 3)
   ↳ Asignar commissionRate (ej: 8)

5. POST /api/auth/register        → Crear usuario cliente
6. POST /api/auth/login           → Obtener token del empleado

7. POST /api/vehicles             → Registrar vehículos (con token admin)

8. POST /api/sales                → Registrar venta (con token del EMPLEADO)
   ↳ Si paymentMethod = "cash"    → venta completed, vehículo sold ✅
   ↳ Si paymentMethod = "financing" → venta pending, vehículo reserved ⏳

9. PATCH /api/sales/:id/status    → Admin confirma o cancela la venta (token admin)

10. GET /api/employees/:id/commissions → Ver comisiones acumuladas del empleado
```

---

## Correr las pruebas

Las pruebas usan **Jest** y **Supertest** y se conectan a la base de datos real (la del `.env`).

> **Requisito:** El usuario `admin@aseguradora.com` con contraseña `admin123` debe existir en la base de datos antes de correr las pruebas de `user`, `employee`, `vehicle` y `sale`. Créenlo con `POST /api/auth/register` si no existe.

> Si quieren pueden modificar las pruebas, lease bien donde se necesitan usuarios predefinidamente creados.

```bash
# Correr todas las pruebas una vez
npm test

# Correr en modo watch (re-corre al guardar cambios)
npm run test:watch
```

Las pruebas limpian automáticamente los datos que crean en MongoDB al terminar, así que no ensucian la base de datos.

| Suite | Qué prueba |
|-------|-----------|
| `auth.test.ts` | Registro, login, errores de autenticación |
| `user.test.ts` | CRUD de usuarios, perfil propio, soft delete |
| `vehicle.test.ts` | Crear, listar disponibles, actualizar vehículos |
| `employee.test.ts` | Crear empleado, comisiones, actualizar |
| `sale.test.ts` | Flujo completo: venta cash, financing, cambio de estado |

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo desarrollo con hot-reload |
| `npm run build` | Compilar TypeScript a JavaScript en `/dist` |
| `npm start` | Correr el servidor compilado (producción) |
| `npm test` | Correr todas las pruebas |
| `npm run test:watch` | Pruebas en modo watch |

