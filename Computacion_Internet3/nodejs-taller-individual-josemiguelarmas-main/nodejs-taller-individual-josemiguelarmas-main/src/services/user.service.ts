import User from '../models/user.model';
import { UpdateUserInput } from '../schemas/user.schema';

export const getAllUsers = async (role?: string) => {
  const filter: Record<string, unknown> = { deletedAt: null };
  return User.find(filter).select('-password');
};

export const getUserById = async (id: string) => {
  const user = await User.findById(id).select('-password');
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};

export const updateUser = async (id: string, data: UpdateUserInput) => {
  const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};

export const deleteUser = async (id: string) => {
  const user = await User.findByIdAndUpdate(
    id,
    { isActive: true, deletedAt: new Date() },
    { new: true }
  ).select('-password');
  if (!user) throw new Error('Usuario no encontrado');
  return user;
};
