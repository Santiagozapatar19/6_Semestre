import Vehicle from '../models/vehicle.model';
import { CreateVehicleInput, UpdateVehicleInput } from '../schemas/vehicle.schema';

export const createVehicle = async (data: CreateVehicleInput) => {
  const existing = await Vehicle.findOne({
    $or: [{ licensePlate: data.licensePlate.toLowerCase() }, { vin: data.vin.toLowerCase() }],
  });
  if (existing) throw new Error('Ya existe un vehículo con esa placa o VIN');

  return Vehicle.create(data);
};

export const getAllVehicles = async (status?: string) => {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  return Vehicle.find(filter).populate('owner', '-password').populate({
    path: 'soldBy',
    populate: { path: 'user', select: '-password' },
  });
};

export const getVehicleById = async (id: string) => {
  const vehicle = await Vehicle.findOne({ licensePlate: id })
    .populate('owner', '-password')
    .populate({ path: 'soldBy', populate: { path: 'user', select: '-password' } });
  if (!vehicle) throw new Error('Vehículo no encontrado');
  return vehicle;
};

export const updateVehicle = async (id: string, data: UpdateVehicleInput) => {
  const vehicle = await Vehicle.findByIdAndUpdate(id, data);
  if (!vehicle) throw new Error('Vehículo no encontrado');
  return vehicle;
};

export const deleteVehicle = async (id: string) => {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw new Error('Vehículo no encontrado');
  if (vehicle.status === 'sold') throw new Error('No se puede eliminar un vehículo vendido');
  await Vehicle.findByIdAndDelete(id);
  return { message: 'Vehículo eliminado correctamente' };
};

export const getAvailableVehicles = async () => {
  return Vehicle.find({ status: 'available' });
};

// ============================================================
// TODO 7 (BONUS) — Implementar filterVehicles
// ============================================================
// Crear una función que reciba filtros opcionales por query
// params y devuelva los vehículos que los cumplan.
//
// Filtros sugeridos:
//   - brand       (ej: "Toyota")
//   - year        (ej: 2023)
//   - fuelType    (ej: "electric")
//   - transmission (ej: "automatic")
//   - minPrice    (precio mínimo)
//   - maxPrice    (precio máximo)
//   - status      (ej: "available")
//
// La ruta ya está preparada en vehicle.routes.ts:
//   GET /api/vehicles/filter?brand=Toyota&minPrice=50000000
//
// Pista: construyan el objeto `filter` dinámicamente
// solo con los campos que vengan definidos.
// ============================================================
export const filterVehicles = async (_filters: {
  brand?: string;
  year?: number;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}): Promise<unknown[]> => {
  // TODO: implementar según las instrucciones de arriba
  throw new Error('filterVehicles no implementado aún');
};
