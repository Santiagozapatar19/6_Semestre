import { Router } from 'express';
import * as vehicleController from '../controllers/vehicle.controller';
import auth from '../middlewares/auth';
import isAdmin from '../middlewares/isAdmin';
import isEmployee from '../middlewares/isEmployee';

const router = Router();

// GET /api/vehicles/available
router.get('/available', auth, vehicleController.getAvailableVehicles);

// GET /api/vehicles/filter  — TODO 7: ruta para filtros avanzados
router.get('/filter', auth, vehicleController.filterVehicles);

// GET /api/vehicles
router.get('/', auth, isEmployee, vehicleController.getAllVehicles);

// GET /api/vehicles/:id
router.get('/:id', auth, isEmployee, vehicleController.getVehicleById);

// POST /api/vehicles
router.post('/', auth, isAdmin, vehicleController.createVehicle);

// PUT /api/vehicles/:id
router.put('/:id', auth, isEmployee, vehicleController.updateVehicle);

// DELETE /api/vehicles/:id
router.delete('/:id', auth, isAdmin, vehicleController.deleteVehicle);

export default router;
