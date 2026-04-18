import mongoose, { Types } from 'mongoose';
import { UserDocument } from './user.model';
import { EmployeeDocument } from './employee.model';

export type VehicleStatus = 'available' | 'sold' | 'reserved' | 'in_review';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid';
export type TransmissionType = 'manual' | 'automatic' | 'cvt';

export interface VehicleInput {
  licensePlate: string; 
  vin: string;
  brand: string;          
  vehicleModel: string;   
  year: number;
  color: string;
  engineCC: number;       
  fuelType: FuelType;
  transmission: TransmissionType;
  mileage: number;        
  doors: number;
  description?: string;
  basePrice: number;     
  status: VehicleStatus;
  owner?: Types.ObjectId | UserDocument['_id'] | null;    
  soldBy?: Types.ObjectId | EmployeeDocument['_id'] | null; 
  registeredAt: Date;     
  soldAt?: Date | null; 
}

export interface VehicleDocument extends VehicleInput, mongoose.Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new mongoose.Schema<VehicleDocument>(
  {
    licensePlate: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vin: { type: String, required: true, unique: true, uppercase: true, trim: true },
    brand: { type: String, required: true, trim: true },
    vehicleModel: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1900, max: new Date().getFullYear() + 1 },
    color: { type: String, required: true, trim: true },
    engineCC: { type: Number, required: true, min: 0 },
    fuelType: { type: String, enum: ['gasoline', 'diesel', 'electric', 'hybrid'], required: true },
    transmission: { type: String, enum: ['manual', 'automatic', 'cvt'], required: true },
    mileage: { type: Number, required: true, min: 0, default: 0 },
    doors: { type: Number, required: true, min: 1, max: 10, default: 4 },
    description: { type: String, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['available', 'sold', 'reserved', 'in_review'],
      required: true,
      default: 'available',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    registeredAt: { type: Date, default: Date.now },
    soldAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'vehicles' }
);

const Vehicle = mongoose.model<VehicleDocument>('Vehicle', vehicleSchema);

export default Vehicle;
