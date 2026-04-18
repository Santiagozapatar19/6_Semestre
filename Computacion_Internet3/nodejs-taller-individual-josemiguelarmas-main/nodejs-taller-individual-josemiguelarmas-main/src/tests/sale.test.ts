import request from 'supertest';
import app from '../app';
import { connectDB, disconnectDB } from './helpers/db';
import User from '../models/user.model';
import Employee from '../models/employee.model';
import Vehicle from '../models/vehicle.model';
import Sale from '../models/sale.model';

const ADMIN_EMAIL = 'admin@aseguradora.com';
const ADMIN_PASSWORD = 'admin123';

let adminToken: string;
let employeeToken: string;

// IDs a limpiar
let buyerUserId: string;
let empUserId: string;
let empId: string;
let vehicleCashId: string;
let vehicleFinId: string;
let saleCashId: string;
let saleFinId: string;

const ts = Date.now();

beforeAll(async () => {
  await connectDB();

  // Login admin
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  adminToken = login.body.token;

  const buyer = await request(app).post('/api/auth/register').send({
    name: 'Comprador', lastName: 'Test',
    email: `buyer.${ts}@test.com`, password: 'buyer123',
    role: 'client', documentId: `BUYER${ts}`,
  });
  buyerUserId = buyer.body.user._id;

  const empReg = await request(app).post('/api/auth/register').send({
    name: 'Vendedor', lastName: 'Test',
    email: `seller.${ts}@test.com`, password: 'seller123',
    role: 'employee', documentId: `SELLER${ts}`,
  });
  empUserId = empReg.body.user._id;

  const empCreate = await request(app)
    .post('/api/employees')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userId: empUserId, position: 'agent', department: 'Ventas', commissionRate: 8, salary: 2500000 });
  empId = empCreate.body._id;

  // Login empleado
  const empLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: `seller.${ts}@test.com`, password: 'seller123' });
  employeeToken = empLogin.body.token;


  const v1 = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      licensePlate: `SCASH${ts.toString().slice(-4)}`,
      vin: `VCASH${ts}`.slice(0, 17),
      brand: 'Ford', vehicleModel: 'Escape',
      year: 2023, color: 'Negro', engineCC: 2000,
      fuelType: 'gasoline', transmission: 'automatic',
      mileage: 0, doors: 4, basePrice: 90000000,
    });
  vehicleCashId = v1.body._id;

  const v2 = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      licensePlate: `SFIN${ts.toString().slice(-5)}`,
      vin: `VFIN${ts}`.slice(0, 17),
      brand: 'Kia', vehicleModel: 'Sportage',
      year: 2024, color: 'Blanco', engineCC: 2400,
      fuelType: 'gasoline', transmission: 'automatic',
      mileage: 0, doors: 4, basePrice: 110000000,
    });
  vehicleFinId = v2.body._id;
});

afterAll(async () => {
  await Sale.deleteMany({ _id: { $in: [saleCashId, saleFinId].filter(Boolean) } });
  if (vehicleCashId) await Vehicle.findByIdAndDelete(vehicleCashId);
  if (vehicleFinId) await Vehicle.findByIdAndDelete(vehicleFinId);
  if (empId) await Employee.findByIdAndDelete(empId);
  if (empUserId) await User.findByIdAndDelete(empUserId);
  if (buyerUserId) await User.findByIdAndDelete(buyerUserId);
  await disconnectDB();
});

describe('POST /api/sales — pago en efectivo', () => {
  it('debe crear venta con cash: status completed y vehículo sold', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        vehicleId: vehicleCashId,
        buyerId: buyerUserId,
        salePrice: 88000000,
        paymentMethod: 'cash',
        notes: 'Pago de contado',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('completed');
    saleCashId = res.body._id;

    const vRes = await request(app)
      .get(`/api/vehicles/${vehicleCashId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(vRes.body.status).toBe('sold');
  });
});

describe('POST /api/sales — pago con financiamiento', () => {
  it('debe crear venta con financing: status pending y vehículo reserved', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        vehicleId: vehicleFinId,
        buyerId: buyerUserId,
        salePrice: 108000000,
        paymentMethod: 'financing',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    saleFinId = res.body._id;

    const vRes = await request(app)
      .get(`/api/vehicles/${vehicleFinId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(vRes.body.status).toBe('reserved');
  });
});

describe('PATCH /api/sales/:id/status', () => {
  it('completar venta financing -> vehículo pasa a sold', async () => {
    const res = await request(app)
      .patch(`/api/sales/${saleFinId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');

    const vRes = await request(app)
      .get(`/api/vehicles/${vehicleFinId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(vRes.body.status).toBe('sold');
  });
});

describe('GET /api/sales/employee/:employeeId', () => {
  it('debe devolver las ventas del empleado', async () => {
    const res = await request(app)
      .get(`/api/sales/employee/${empId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('GET /api/sales/buyer/:buyerId', () => {
  it('debe devolver las compras del cliente', async () => {
    const res = await request(app)
      .get(`/api/sales/buyer/${buyerUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
