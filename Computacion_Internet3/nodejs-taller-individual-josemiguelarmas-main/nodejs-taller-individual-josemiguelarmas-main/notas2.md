# Análisis de Errores - Aseguradora API

## Resumen
Se encontraron **8 errores críticos** en el código que hacen fallar los tests. A continuación se detalla qué está mal y cómo corregirlo.

---

## ERROR 1: `user.service.ts` - `getAllUsers()` - No aplica filtro por rol

### ¿Qué está mal?
La función recibe un parámetro `role?: string` pero no lo utiliza en el filtro de búsqueda.

**Código actual:**
```typescript
export const getAllUsers = async (role?: string) => {
  const filter: Record<string, unknown> = { deletedAt: null };
  return User.find(filter).select('-password');
};
```

El parámetro `role` se ignora completamente.

### ¿Cómo se ve en los tests?
El test intenta filtrar por rol:
```typescript
it('debe filtrar por rol', async () => {
  const res = await request(app)
    .get('/api/users?role=client')
    .set('Authorization', `Bearer ${adminToken}`);

  expect(res.status).toBe(200);
  res.body.forEach((u: { role: string }) => {
    expect(u.role).toBe('client');
  });
});
```

### ¿Cómo se corrige?
Agregar el filtro de rol al objeto filter:
```typescript
export const getAllUsers = async (role?: string) => {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (role) {
    filter.role = role;
  }
  return User.find(filter).select('-password');
};
```

---

## ERROR 2: `user.service.ts` - `deleteUser()` - Activa usuario en lugar de desactivarlo

### ¿Qué está mal?
Cuando se "elimina" un usuario (soft delete), la función coloca `isActive: true` en lugar de `isActive: false`.

**Código actual:**
```typescript
export const deleteUser = async (id: string) => {
  const user = await User.findByIdAndUpdate(
    id,
    { isActive: true, deletedAt: new Date() },  // ❌ isActive: true está mal
    { new: true }
  ).select('-password');
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};
```

### El problema
Un usuario inactivo debería tener `isActive: false`, no `true`. Al dejar `true`, el usuario sigue siendo accesible en las búsquedas.

### ¿Cómo se corrige?
```typescript
export const deleteUser = async (id: string) => {
  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false, deletedAt: new Date() },  // ✅ Correcto
    { new: true }
  ).select('-password');
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};
```

---

## ERROR 3: `vehicle.service.ts` - `getVehicleById()` - Busca por campo incorrecto

### ¿Qué está mal?
La función busca vehículos por `licensePlate` en lugar de buscar por el ObjectId `_id`.

**Código actual:**
```typescript
export const getVehicleById = async (id: string) => {
  const vehicle = await Vehicle.findOne({ licensePlate: id })  // ❌ Busca por placa
    .populate('owner', '-password')
    .populate({ path: 'soldBy', populate: { path: 'user', select: '-password' } });
  if (!vehicle) throw new Error('Vehículo no encontrado');
  return vehicle;
};
```

### El problema
El parámetro `id` es el ObjectId `_id` del vehículo (ej: `64f3b2a1e4c5d2f1a8g9h0i1`), no la placa (ej: `ABC123`). El método `Vehicle.findOne({ licensePlate: id })` intenta buscar un vehículo con esa placa, que no existe.

### ¿Cómo se corrige?
```typescript
export const getVehicleById = async (id: string) => {
  const vehicle = await Vehicle.findById(id)  // ✅ Usa findById o _id
    .populate('owner', '-password')
    .populate({ path: 'soldBy', populate: { path: 'user', select: '-password' } });
  if (!vehicle) throw new Error('Vehículo no encontrado');
  return vehicle;
};
```

O alternativa:
```typescript
const vehicle = await Vehicle.findOne({ _id: id })
```

---

## ERROR 4: `employee.service.ts` - `updateEmployee()` - Retorna documento sin actualizar

### ¿Qué está mal?
El método `findByIdAndUpdate` falta la opción `{ new: true }`, lo que causa que retorne el documento **antiguo** en lugar del actualizado.

**Código actual:**
```typescript
export const updateEmployee = async (id: string, data: UpdateEmployeeInput) => {
  const employee = await Employee.findByIdAndUpdate(id, data).populate(  // ❌ Falta { new: true }
    'user',
    '-password'
  );
  if (!employee) throw new Error('Empleado no encontrado');
  return employee;
};
```

### El problema
Sin `{ new: true }`, MongoDB devuelve la versión previa del documento. Los tests que verifican los cambios fallarán.

### ¿Cómo se corrige?
```typescript
export const updateEmployee = async (id: string, data: UpdateEmployeeInput) => {
  const employee = await Employee.findByIdAndUpdate(id, data, { new: true }).populate(  // ✅ Ahora retorna el actualizado
    'user',
    '-password'
  );
  if (!employee) throw new Error('Empleado no encontrado');
  return employee;
};
```

---

## ERROR 5: `vehicle.service.ts` - `createVehicle()` - Inconsistencia mayúsculas/minúsculas

### ¿Qué está mal?
Busca vehículos con placa y VIN en minúsculas (`.toLowerCase()`) pero el esquema los guarda en mayúsculas (`.uppercase()`).

**Código actual:**
```typescript
export const createVehicle = async (data: CreateVehicleInput) => {
  const existing = await Vehicle.findOne({
    $or: [
      { licensePlate: data.licensePlate.toLowerCase() },  // ❌ Busca minúscula
      { vin: data.vin.toLowerCase() }                     // ❌ Busca minúscula
    ],
  });
  if (existing) throw new Error('Ya existe un vehículo con esa placa o VIN');

  return Vehicle.create(data);
};
```

**Esquema:**
```typescript
licensePlate: { type: String, required: true, unique: true, uppercase: true, trim: true },
vin: { type: String, required: true, unique: true, uppercase: true, trim: true },
```

### El problema
La búsqueda usa minúsculas pero MongoDB guarda mayúsculas. Por ejemplo:
- Intentas guardar placa `"ABC123"` → se guarda como `"ABC123"` (uppercase)
- Intentas guardar de nuevo `"abc123"` → busca `{ licensePlate: "abc123" }`
- No encuentra coincidencia → permite duplicado ❌

### ¿Cómo se corrige?
```typescript
export const createVehicle = async (data: CreateVehicleInput) => {
  const existing = await Vehicle.findOne({
    $or: [
      { licensePlate: data.licensePlate.toUpperCase() },  // ✅ Busca mayúscula
      { vin: data.vin.toUpperCase() }                     // ✅ Busca mayúscula
    ],
  });
  if (existing) throw new Error('Ya existe un vehículo con esa placa o VIN');

  return Vehicle.create(data);
};
```

---

## ERROR 6: `auth.service.ts` - `register()` - Respuesta expone contraseña

### ¿Qué está mal?
La función `register()` retorna `user.toObject()` que incluye la contraseña, aunque sea hasheada.

**Código actual:**
```typescript
export const register = async (data: RegisterUserInput) => {
  // ... validaciones ...
  
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await User.create({ ...data, password: hashedPassword });

  return user.toObject();  // ❌ Incluye la contraseña
};
```

### El problema
El test espera que la contraseña NO aparezca en la respuesta:
```typescript
it('debe registrar un usuario correctamente', async () => {
  const res = await request(app).post('/api/auth/register').send({...});

  expect(res.status).toBe(201);
  expect(res.body.user.email).toBe(testEmail);
  expect(res.body.user.password).toBeUndefined();  // ❌ Falla si hay password
});
```

### ¿Cómo se corrige?
```typescript
export const register = async (data: RegisterUserInput) => {
  // ... validaciones ...
  
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await User.create({ ...data, password: hashedPassword });

  const { password: _pw, ...userWithoutPassword } = user.toObject();  // ✅ Excluye password
  return userWithoutPassword;
};
```

---

## ERROR 7: `employee.service.ts` - `getEmployeeById()` - No excluye datos sensibles

### ¿Qué está mal?
Al poblar el usuario, no excluye la contraseña del usuario vinculado.

**Código actual:**
```typescript
export const getEmployeeById = async (id: string) => {
  const employee = await Employee.findById(id).populate('user');  // ❌ No excluye password
  if (!employee) throw new Error('Empleado no encontrado');
  return employee;
};
```

### El problema
Aunque el endpoint principal tiene seguridad, exponer la contraseña es un riesgo de seguridad.

### ¿Cómo se corrige?
```typescript
export const getEmployeeById = async (id: string) => {
  const employee = await Employee.findById(id).populate('user', '-password');  // ✅ Excluye password
  if (!employee) throw new Error('Empleado no encontrado');
  return employee;
};
```

---

## ERROR 8: `vehicle.service.ts` - `getAllVehicles()` - No retorna populate en updateVehicle

### ¿Qué está mal?
La función `updateVehicle()` actualiza el vehículo pero no lo devuelve con populate, mientras que `getAllVehicles()` sí lo hace.

**Código actual:**
```typescript
export const updateVehicle = async (id: string, data: UpdateVehicleInput) => {
  const vehicle = await Vehicle.findByIdAndUpdate(id, data);  // ❌ Sin populate
  if (!vehicle) throw new Error('Vehículo no encontrado');
  return vehicle;
};

export const getAllVehicles = async (status?: string) => {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  return Vehicle.find(filter).populate('owner', '-password').populate({  // ✅ Con populate
    path: 'soldBy',
    populate: { path: 'user', select: '-password' },
  });
};
```

### El problema
Inconsistencia: al actualizar un vehículo, el cliente no recibe los datos del propietario y vendedor populados.

### ¿Cómo se corrige?
```typescript
export const updateVehicle = async (id: string, data: UpdateVehicleInput) => {
  const vehicle = await Vehicle.findByIdAndUpdate(id, data, { new: true })  // ✅ Con { new: true }
    .populate('owner', '-password')
    .populate({
      path: 'soldBy',
      populate: { path: 'user', select: '-password' },
    });
  if (!vehicle) throw new Error('Vehículo no encontrado');
  return vehicle;
};
```

---

## Tabla Resumen de Errores

| # | Archivo | Función | Error | Solución |
|---|---------|---------|-------|----------|
| 1 | `user.service.ts` | `getAllUsers()` | Ignora filtro `role` | Agregar `if (role) filter.role = role;` |
| 2 | `user.service.ts` | `deleteUser()` | Activa en lugar de desactivar | Cambiar `isActive: true` a `isActive: false` |
| 3 | `vehicle.service.ts` | `getVehicleById()` | Busca por `licensePlate` | Cambiar a `findById(id)` |
| 4 | `employee.service.ts` | `updateEmployee()` | Retorna doc antiguo | Agregar `{ new: true }` |
| 5 | `vehicle.service.ts` | `createVehicle()` | Busca minúsculas | Cambiar a `.toUpperCase()` |
| 6 | `auth.service.ts` | `register()` | Expone contraseña | Excluir password del objeto de retorno |
| 7 | `employee.service.ts` | `getEmployeeById()` | Sin populate password | Agregar `'-password'` al populate |
| 8 | `vehicle.service.ts` | `updateVehicle()` | Sin populate ni { new: true } | Agregar populate y `{ new: true }` |

---

## Instrucciones para Corregir

1. **Abre** cada archivo mencionado
2. **Busca** la función indicada
3. **Reemplaza** el código actual con el código corregido
4. **Guarda** los cambios
5. **Ejecuta** `npm test` para validar que los tests pasen

Todos estos cambios son correcciones de bugs, no nuevas funcionalidades.
