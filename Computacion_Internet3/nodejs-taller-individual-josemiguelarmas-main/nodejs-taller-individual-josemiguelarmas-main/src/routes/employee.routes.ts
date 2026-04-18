import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller';
import * as saleController from '../controllers/sale.controller';
import auth from '../middlewares/auth';
import isAdmin from '../middlewares/isAdmin';

const router = Router();

// POST /api/employees
router.post('/', auth, isAdmin, employeeController.createEmployee);

// GET /api/employees
router.get('/', auth, employeeController.getAllEmployees);

// GET /api/employees/:id
router.get('/:id', auth, employeeController.getEmployeeById);

// GET /api/employees/:id/commissions
router.get('/:id/commissions', auth, isAdmin, employeeController.getEmployeeCommissions);

// GET /api/employees/:id/commissions/report  — TODO 6 (BONUS)
router.get('/:id/commissions/report', auth, isAdmin, saleController.getCommissionReport);

// PUT /api/employees/:id
router.put('/:id', auth, isAdmin, employeeController.updateEmployee);

export default router;
