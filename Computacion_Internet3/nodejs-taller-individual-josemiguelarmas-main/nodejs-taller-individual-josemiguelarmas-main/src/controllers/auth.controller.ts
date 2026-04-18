import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { registerUserSchema, loginSchema } from '../schemas/user.schema';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const user = await authService.register(parsed.data);
    res.status(201).json({ message: 'Usuario registrado exitosamente', user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al registrar usuario';
    res.status(400).json({ error: message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const result = await authService.login(parsed.data);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
    res.status(401).json({ error: message });
  }
};
