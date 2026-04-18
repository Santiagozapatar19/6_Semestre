import Employee from '../models/employee.model';
import User from '../models/user.model';
import { CreateEmployeeInput, UpdateEmployeeInput } from '../schemas/employee.schema';

export const createEmployee = async (data: CreateEmployeeInput) => {
  const user = await User.findById(data.userId);
  if (!user) throw new Error('Usuario no encontrado');
  if (user.role === 'client') {
    await User.findByIdAndUpdate(data.userId, { role: 'employee' });
  }

  const existing = await Employee.findOne({ user: data.userId });
  if (existing) throw new Error('Este usuario ya tiene un perfil de empleado');

  return Employee.create({
    user: data.userId,
    position: data.position,
    department: data.department,
    hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
    commissionRate: data.commissionRate,
    salary: data.salary,
    notes: data.notes,
  });
};

export const getAllEmployees = async () => {
  return Employee.find({ isActive: true }).populate('user', '-password');
};

export const getEmployeeById = async (id: string) => {
  const employee = await Employee.findById(id).populate('user');
  if (!employee) throw new Error('Empleado no encontrado');
  return employee;
};

export const updateEmployee = async (id: string, data: UpdateEmployeeInput) => {
  const employee = await Employee.findByIdAndUpdate(id, data).populate(
    'user',
    '-password'
  );
  if (!employee) throw new Error('Empleado no encontrado');
  return employee;
};

export const getEmployeeCommissions = async (employeeId: string) => {
  const Sale = (await import('../models/sale.model')).default;
  const sales = await Sale.find({ seller: employeeId, status: 'completed' }).populate('vehicle');
  const totalCommission = sales.reduce((acc, s) => acc + s.commissionAmount, 0);
  return { sales, totalCommission, salesCount: sales.length };
};
