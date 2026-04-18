import Sale from '../models/sale.model';
import Vehicle from '../models/vehicle.model';
import Employee from '../models/employee.model';
import User from '../models/user.model';
import { CreateSaleInput, UpdateSaleStatusInput } from '../schemas/sale.schema';
import { number } from 'zod';

// ============================================================
// TODO 1 — Implementar createSale
// ============================================================
// Esta función registra una nueva venta. Deben:
//
// 1. Buscar el vehículo por `data.vehicleId` y validar que:
//    - Exista en la BD
//    - Su `status` sea 'available' (si no, lanzar error)
//
// 2. Buscar el comprador por `data.buyerId` y validar que:
//    - Exista y esté activo (`isActive: true`)
//
// 3. Buscar el empleado vendedor por `sellerId` y validar que:
//    - Exista y esté activo
//    - IMPORTANTE: la comisión (`commissionRate`) vive en el
//      modelo Employee, NO se recibe desde el cliente. Deben
//      leerla del empleado y congelarla en la venta para que
//      cambios futuros no alteren el historial.
//
// 4. Calcular la comisión:
//    commissionAmount = salePrice * commissionRate / 100
//
// 5. Determinar el estado inicial según el método de pago:
//    - 'cash'     → saleStatus = 'completed', vehicleStatus = 'sold'
//    - cualquier otro → saleStatus = 'pending', vehicleStatus = 'reserved'
//
// 6. Crear el documento Sale en la BD con todos los campos.
//
// 7. Actualizar el vehículo: cambiar status, asignar owner,
//    soldBy y soldAt (solo si es cash).
//
// 8. Retornar la venta con populate de vehicle, buyer y seller.
// ============================================================
export const createSale = async (_sellerId: string, _data: CreateSaleInput): Promise<unknown> => {
  const existingVehicle = await Vehicle.findOne({ id: _data.vehicleId});
  const existingVehicleStatus = existingVehicle?.status;
    if (!existingVehicle) throw new ReferenceError("Vehículo no encontrado");
    if (!(existingVehicleStatus=='available')) throw new ReferenceError("El vehículo no está disponible");
  const existingBuyer = await User.findOne({ buyer: _data.buyerId });
  const activeBuyer = existingBuyer?.isActive;
    if(!existingBuyer || !(activeBuyer==false)) throw new ReferenceError("Comprador no encontrado o inactivo"); 
  const existingSeller = await User.findOne({ seller: _sellerId });
  const activeSeller = existingSeller?.isActive;
    if(!existingSeller || !(activeSeller==false)) throw new ReferenceError("Empleado no encontrado o inactivo"); 
  
  const salePrice = existingVehicle.basePrice;
  const seller = await Employee.findOne({_sellerId});
  const commission : Promise<number> = seller?.commissionRate;
  const commissionAmount = salePrice * commission / 100;
};

export const getAllSales = async () => {
  return Sale.find()
    .populate('vehicle')
    .populate('buyer', '-password')
    .populate({ path: 'seller', populate: { path: 'user', select: '-password' } })
    .sort({ saleDate: -1 });
};

export const getSaleById = async (id: string) => {
  const sale = await Sale.findById(id)
    .populate('vehicle')
    .populate('buyer', '-password')
    .populate({ path: 'seller', populate: { path: 'user', select: '-password' } });
  if (!sale) throw new Error('Venta no encontrada');
  return sale;
};

// ============================================================
// TODO 2 — Implementar updateSaleStatus
// ============================================================
// Esta función actualiza el estado de una venta existente.
// Solo el admin puede llamarla (el middleware lo controla).
//
// 1. Buscar la venta por `id` y actualizarla con `data.status`.
//    Si no existe, lanzar error.
//
// 2. Según el nuevo estado, actualizar el vehículo vinculado:
//    - 'completed' → vehículo.status = 'sold', asignar soldAt
//    - 'cancelled' → vehículo.status = 'available',
//                    limpiar owner, soldBy y soldAt (null)
//    - 'pending'   → sin cambios en el vehículo
//
// 3. Retornar la venta actualizada.
// ============================================================
export const updateSaleStatus = async (_id: string, _data: UpdateSaleStatusInput): Promise<unknown> => {
  // TODO: implementar según las instrucciones de arriba
  throw new Error('updateSaleStatus no implementado aún');
};

export const getSalesByEmployee = async (employeeId: string) => {
  return Sale.find({ seller: employeeId })
    .populate('vehicle')
    .populate('buyer', '-password')
    .sort({ saleDate: -1 });
};

export const getSalesByBuyer = async (buyerId: string) => {
  return Sale.find({ buyer: buyerId })
    .populate('vehicle')
    .populate({ path: 'seller', populate: { path: 'user', select: '-password' } })
    .sort({ saleDate: -1 });
};

// ============================================================
// TODO 3 (BONUS) — Implementar getCommissionReport
// ============================================================
// Generar un reporte de comisiones de un empleado agrupado
// por mes. Solo deben contar ventas con status 'completed'.
//
// El resultado esperado es un array como:
// [
//   { month: '2026-01', totalCommission: 950000, salesCount: 3 },
//   { month: '2026-02', totalCommission: 1200000, salesCount: 4 },
// ]
//
// Pista: pueden usar MongoDB aggregation pipeline con $group
// y $dateToString para formatear el mes.
// ============================================================
export const getCommissionReport = async (_employeeId: string): Promise<unknown[]> => {
  // TODO: implementar con aggregation pipeline
  throw new Error('getCommissionReport no implementado aún');
};
