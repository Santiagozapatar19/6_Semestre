import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import Employee from '../models/employee.model';


const isEmployee = async (req: AuthRequest & { employee?: { id: string } }, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (user.role !== 'employee' && user.role !== 'admin') {
      res.status(403).json({ error: 'Acceso denegado: se requiere rol de empleado' });
      return;
    }

    const employee = await Employee.findOne({ user: user.id, isActive: true });
    if (!employee) {
      res.status(403).json({ error: 'Perfil de empleado no encontrado o inactivo' });
      return;
    }

    (req as AuthRequest & { employee: { id: string } }).employee = { id: String(employee._id) };
    next();
  } catch {
    res.status(500).json({ error: 'Error al verificar rol de empleado' });
  }
};

export default isEmployee;
