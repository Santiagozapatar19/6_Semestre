import { Request, Response, NextFunction } from 'express';

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor', details: err.message });
};
