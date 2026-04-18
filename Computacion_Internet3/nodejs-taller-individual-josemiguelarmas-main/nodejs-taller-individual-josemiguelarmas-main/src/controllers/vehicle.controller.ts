import { Request, Response } from 'express';
import * as vehicleService from '../services/vehicle.service';
import { createVehicleSchema, updateVehicleSchema } from '../schemas/vehicle.schema';

export const createVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createVehicleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const vehicle = await vehicleService.createVehicle(parsed.data);
    res.status(201).json(vehicle);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear vehículo';
    res.status(400).json({ error: message });
  }
};

export const getAllVehicles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query as { status?: string };
    const vehicles = await vehicleService.getAllVehicles(status);
    res.status(200).json(vehicles);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener vehículos';
    res.status(500).json({ error: message });
  }
};

export const getAvailableVehicles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await vehicleService.getAvailableVehicles();
    res.status(200).json(vehicles);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener vehículos disponibles';
    res.status(500).json({ error: message });
  }
};

export const getVehicleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    res.status(200).json(vehicle);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Vehículo no encontrado';
    res.status(404).json({ error: message });
  }
};

export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateVehicleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const vehicle = await vehicleService.updateVehicle(req.params.id, parsed.data);
    res.status(200).json(vehicle);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar vehículo';
    res.status(400).json({ error: message });
  }
};

export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await vehicleService.deleteVehicle(req.params.id);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar vehículo';
    res.status(400).json({ error: message });
  }
};

// ============================================================
// TODO 7 (BONUS) — Controlador filterVehicles
// ============================================================
// Leer los query params del request (brand, year, fuelType,
// transmission, minPrice, maxPrice, status) y pasarlos
// como objeto a `vehicleService.filterVehicles(filters)`.
// Responder 200 con los resultados.
// Ruta: GET /api/vehicles/filter
// ============================================================
export const filterVehicles = async (_req: Request, res: Response): Promise<void> => {
  // TODO: implementar según las instrucciones de arriba
  res.status(501).json({ error: 'filterVehicles no implementado aún' });
};
