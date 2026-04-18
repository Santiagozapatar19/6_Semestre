import mongoose, { Types } from 'mongoose';
import { UserDocument } from './user.model';

export type EmployeePosition = 'agent' | 'supervisor' | 'manager' | 'admin_staff';

export interface EmployeeInput {
  user: Types.ObjectId | UserDocument['_id'];
  position: EmployeePosition;
  department: string;
  hireDate: Date;
  commissionRate: number; // Ojo: Esto este en porcentaje, no en valor absoluto
  salary: number;
  isActive: boolean;
  notes?: string;
}

export interface EmployeeDocument extends EmployeeInput, mongoose.Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new mongoose.Schema<EmployeeDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    position: {
      type: String,
      enum: ['agent', 'supervisor', 'manager', 'admin_staff'],
      required: true,
      default: 'agent',
    },
    department: { type: String, required: true, trim: true },
    hireDate: { type: Date, required: true, default: Date.now },
    commissionRate: { type: Number, required: true, min: 0, max: 100, default: 5 },
    salary: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true, collection: 'employees' }
);

const Employee = mongoose.model<EmployeeDocument>('Employee', employeeSchema);

export default Employee;
