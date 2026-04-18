import { z } from 'zod';

export const createSaleSchema = z.object({
  vehicleId: z.string().min(1, 'El ID del vehículo es requerido'),
  buyerId: z.string().min(1, 'El ID del comprador es requerido'),
  salePrice: z.number().min(0, 'El precio de venta debe ser mayor o igual a 0'),
  paymentMethod: z.enum(['cash', 'financing', 'credit_card', 'transfer']),
  saleDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateSaleStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']),
  notes: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleStatusInput = z.infer<typeof updateSaleStatusSchema>;
