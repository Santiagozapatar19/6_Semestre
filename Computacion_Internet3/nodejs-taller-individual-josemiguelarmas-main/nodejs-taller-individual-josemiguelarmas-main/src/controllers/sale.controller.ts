import { Request, Response } from 'express';
import * as saleService from '../services/sale.service';
import { createSaleSchema, updateSaleStatusSchema } from '../schemas/sale.schema';
import { SaleDocument, SaleInput } from '../models/sale.model';
import isEmployee from '../middlewares/isEmployee';

interface AuthRequest extends Request {
  user?: { id: string; role: string };
  employee?: { id: string };
}

// ============================================================
// TODO 4 — Implementar el controlador createSale
// ============================================================
// 1. Validar el body con `createSaleSchema.safeParse`.
//    Si falla, responder 400 con los errores.
//
// 2. Extraer el employeeId desde `req.employee?.id`
//    (lo inyecta el middleware isEmployee automáticamente).
//    Si no existe, responder 400.
//
// 3. Llamar a `saleService.createSale(employeeId, parsed.data)`.
//
// 4. Responder 201 con la venta creada.
//    En el catch, responder 400 con el mensaje de error.
// ============================================================
export const createSale = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    createSaleSchema.safeParse;
  } catch (error: any) {
    console.error("Error creating expense:", error);
    res.status(400).json({ error: error.message });
  }

  try {
    const employeeId = _req.employee?.id;
    if (employeeId == null) {
      res.status(400);
    }
    saleService.createSale(employeeId, parsed.data);
    res.status(201);
  } catch (error: any) {
    console.error("Error creating expense:", error);
    res.status(400).json({ error: error.message });
  }

};

export const getAllSales = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sales = await saleService.getAllSales();
    res.status(200).json(sales);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener ventas';
    res.status(500).json({ error: message });
  }
};

export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    res.status(200).json(sale);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Venta no encontrada';
    res.status(404).json({ error: message });
  }
};

// ============================================================
// TODO 5 — Implementar el controlador updateSaleStatus
// ============================================================
// 1. Validar el body con `updateSaleStatusSchema.safeParse`.
//    Si falla, responder 400.
//
// 2. Llamar a `saleService.updateSaleStatus(req.params.id, parsed.data)`.
//
// 3. Responder 200 con la venta actualizada.
//    En el catch, responder 400 con el mensaje de error.
// ============================================================
export const updateSaleStatus = async (req: Request, res: Response): Promise<void> => {
  // TODO: implementar según las instrucciones de arriba
  res.status(501).json({ error: 'updateSaleStatus no implementado aún' });
};

export const getSalesByEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await saleService.getSalesByEmployee(req.params.employeeId);
    res.status(200).json(sales);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener ventas del empleado';
    res.status(500).json({ error: message });
  }
};

export const getSalesByBuyer = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await saleService.getSalesByBuyer(req.params.buyerId);
    res.status(200).json(sales);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener compras del usuario';
    res.status(500).json({ error: message });
  }
};

// ============================================================
// TODO 6 (BONUS) — Controlador getCommissionReport
// ============================================================
// Llamar a `saleService.getCommissionReport(req.params.employeeId)`
// y responder 200 con el reporte.
// La ruta ya está definida en employee.routes.ts:
//   GET /api/employees/:id/commissions/report
// ============================================================
export const getCommissionReport = async (_req: Request, res: Response): Promise<void> => {
  // TODO: implementar según las instrucciones de arriba
  res.status(501).json({ error: 'getCommissionReport no implementado aún' });
};
