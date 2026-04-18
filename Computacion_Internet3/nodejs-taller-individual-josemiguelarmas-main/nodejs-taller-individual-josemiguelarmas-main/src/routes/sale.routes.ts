import { Router } from 'express';
import * as saleController from '../controllers/sale.controller';
import auth from '../middlewares/auth';
import isAdmin from '../middlewares/isAdmin';
import isEmployee from '../middlewares/isEmployee';

const router = Router();

// POST /api/sales
router.post('/', auth, isEmployee, saleController.createSale);

// GET /api/sales               
router.get('/', auth, isAdmin, saleController.getAllSales);

// GET /api/sales/:id            
router.get('/:id', auth, isEmployee, saleController.getSaleById);

// PATCH /api/sales/:id/status   
router.patch('/:id/status', auth, isAdmin, saleController.updateSaleStatus);

// GET /api/sales/employee/:employeeId 
router.get('/employee/:employeeId', auth, isEmployee, saleController.getSalesByEmployee);

// GET /api/sales/buyer/:buyerId      
router.get('/buyer/:buyerId', auth, saleController.getSalesByBuyer);

export default router;
