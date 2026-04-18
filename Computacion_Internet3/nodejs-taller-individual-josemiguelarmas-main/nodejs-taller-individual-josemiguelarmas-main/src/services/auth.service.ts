import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { RegisterUserInput, LoginInput } from '../schemas/user.schema';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const register = async (data: RegisterUserInput) => {
  const existingUser = await User.findOne({
    $or: [{ email: data.email }, { documentId: data.documentId }],
  });

  if (existingUser) {
    throw new Error('Ya existe un usuario con ese email o documento');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await User.create({ ...data, password: hashedPassword });

  return user.toObject();
};

export const login = async (data: LoginInput) => {
  const user = await User.findOne({ email: data.email, isActive: true });

  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Credenciales inválidas');
  }

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const { password: _pw, ...userWithoutPassword } = user.toObject();
  return { user: userWithoutPassword, token };
};
