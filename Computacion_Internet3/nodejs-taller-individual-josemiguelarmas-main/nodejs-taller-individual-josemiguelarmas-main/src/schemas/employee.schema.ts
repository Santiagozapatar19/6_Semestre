import { z } from 'zod';

export const createEmployeeSchema = z.object({
  userId: z.string().min(1, 'El ID de usuario es requerido'),
  position: z.enum(['agent', 'supervisor', 'manager', 'admin_staff']).default('agent'),
  department: z.string().min(2, 'El departamento es requerido'),
  hireDate: z.string().datetime().optional(),
  commissionRate: z.number().min(0).max(100).default(5),
  salary: z.number().min(0),
  notes: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  position: z.enum(['agent', 'supervisor', 'manager', 'admin_staff']).optional(),
  department: z.string().min(2).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  salary: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
