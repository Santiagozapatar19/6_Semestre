import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import auth from '../middlewares/auth';
import isAdmin from '../middlewares/isAdmin';

const router = Router();

// GET /api/users/me
router.get('/me', auth, userController.getMyProfile);

// GET /api/users
router.get('/', auth, isAdmin, userController.getAllUsers);

// GET /api/users/:id
router.get('/:id', auth, isAdmin, userController.getUserById);

// PUT /api/users/:id
router.put('/:id', auth, isAdmin, userController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', auth, isAdmin, userController.deleteUser);

export default router;
