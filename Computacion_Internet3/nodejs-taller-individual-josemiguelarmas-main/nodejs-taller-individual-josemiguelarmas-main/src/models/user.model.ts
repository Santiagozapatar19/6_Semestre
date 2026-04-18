import mongoose, { Types } from 'mongoose';

export type UserRole = 'admin' | 'employee' | 'client';

export interface UserInput {
  name: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  documentId: string;
  address?: string;
  isActive: boolean;
}

export interface UserDocument extends UserInput, mongoose.Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee', 'client'], required: true, default: 'client' },
    phone: { type: String, trim: true },
    documentId: { type: String, required: true, unique: true, trim: true },
    address: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'users' }
);

const User = mongoose.model<UserDocument>('User', userSchema);

export default User;
