import { Request, Response } from 'express';
import * as employeeService from '../services/employee.service';
import { createEmployeeSchema, updateEmployeeSchema } from '../schemas/employee.schema';

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const employee = await employeeService.createEmployee(parsed.data);
    res.status(201).json(employee);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear empleado';
    res.status(400).json({ error: message });
  }
};

export const getAllEmployees = async (_req: Request, res: Response): Promise<void> => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.status(200).json(employees);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener empleados';
    res.status(500).json({ error: message });
  }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.status(200).json(employee);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Empleado no encontrado';
    res.status(404).json({ error: message });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateEmployeeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const employee = await employeeService.updateEmployee(req.params.id, parsed.data);
    res.status(200).json(employee);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar empleado';
    res.status(400).json({ error: message });
  }
};

export const getEmployeeCommissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await employeeService.getEmployeeCommissions(req.params.id);
    res.status(200).json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener comisiones';
    res.status(500).json({ error: message });
  }
};
