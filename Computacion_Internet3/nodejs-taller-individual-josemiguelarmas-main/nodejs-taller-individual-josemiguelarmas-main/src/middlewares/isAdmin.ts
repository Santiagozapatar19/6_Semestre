import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado: se requiere rol de administrador' });
    return;
  }

  next();
};

export default isAdmin;
