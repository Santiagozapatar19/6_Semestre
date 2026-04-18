import { Express } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import employeeRoutes from './employee.routes';
import vehicleRoutes from './vehicle.routes';
import saleRoutes from './sale.routes';

const routes = (app: Express): void => {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/sales', saleRoutes);
};

export default routes;
