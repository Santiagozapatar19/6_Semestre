import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const createVehicleSchema = z.object({
  licensePlate: z.string().min(4, 'Placa inválida'),
  vin: z.string().min(10, 'VIN inválido'),
  brand: z.string().min(2, 'La marca es requerida'),
  vehicleModel: z.string().min(1, 'El modelo es requerido'),
  year: z.number().int().min(1900).max(currentYear + 1),
  color: z.string().min(2, 'El color es requerido'),
  engineCC: z.number().min(0),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']),
  transmission: z.enum(['manual', 'automatic', 'cvt']),
  mileage: z.number().min(0).default(0),
  doors: z.number().int().min(1).max(10).default(4),
  description: z.string().optional(),
  basePrice: z.number().min(0),
});

export const updateVehicleSchema = z.object({
  color: z.string().optional(),
  mileage: z.number().min(0).optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0).optional(),
  status: z.enum(['available', 'sold', 'reserved', 'in_review']).optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
