import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { updateUserSchema } from '../schemas/user.schema';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query as { role?: string };
    const users = await userService.getAllUsers(role);
    res.status(200).json(users);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener usuarios';
    res.status(500).json({ error: message });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener usuario';
    res.status(404).json({ error: message });
  }
};

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.getUserById((req as Request & { user?: { id: string } }).user!.id);
    res.status(200).json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener perfil';
    res.status(500).json({ error: message });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const user = await userService.updateUser(req.params.id, parsed.data);
    res.status(200).json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar usuario';
    res.status(400).json({ error: message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.deleteUser(req.params.id);
    res.status(200).json({ message: 'Usuario desactivado', user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar usuario';
    res.status(400).json({ error: message });
  }
};
