import mongoose, { Types } from 'mongoose';
import { VehicleDocument } from './vehicle.model';
import { UserDocument } from './user.model';
import { EmployeeDocument } from './employee.model';

export type PaymentMethod = 'cash' | 'financing' | 'credit_card' | 'transfer';
export type SaleStatus = 'pending' | 'completed' | 'cancelled';

export interface SaleInput {
  vehicle: Types.ObjectId | VehicleDocument['_id'];
  buyer: Types.ObjectId | UserDocument['_id'];
  seller: Types.ObjectId | EmployeeDocument['_id'];
  salePrice: number;
  commissionRate: number;    // % tomado del empleado en el momento de la venta, esto ya debe estar registrado en el documento del empleado
  commissionAmount: number;  // salePrice * commissionRate / 100
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  saleDate: Date;
  notes?: string;
}

export interface SaleDocument extends SaleInput, mongoose.Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new mongoose.Schema<SaleDocument>(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    salePrice: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'financing', 'credit_card', 'transfer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      required: true,
      default: 'pending',
    },
    saleDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true, collection: 'sales' }
);

const Sale = mongoose.model<SaleDocument>('Sale', saleSchema);

export default Sale;
