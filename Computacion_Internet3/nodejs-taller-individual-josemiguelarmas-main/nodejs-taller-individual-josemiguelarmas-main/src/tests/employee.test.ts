import request from 'supertest';
import app from '../app';
import { connectDB, disconnectDB } from './helpers/db';
import User from '../models/user.model';
import Employee from '../models/employee.model';

const ADMIN_EMAIL = 'admin@aseguradora.com';
const ADMIN_PASSWORD = 'admin123';

let adminToken: string;
let createdUserId: string;
let createdEmployeeId: string;

const empEmail = `test.emp.${Date.now()}@aseguradora.com`;
const empDoc = `EMP${Date.now()}`;

beforeAll(async () => {
  await connectDB();

  // Login admin
  const login = await request(app).post('/api/auth/login').send({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  adminToken = login.body.token;

  const reg = await request(app).post('/api/auth/register').send({
    name: 'Empleado',
    lastName: 'Test',
    email: empEmail,
    password: 'emp12345',
    role: 'employee',
    documentId: empDoc,
  });
  createdUserId = reg.body.user._id;
});

afterAll(async () => {
  if (createdEmployeeId) await Employee.findByIdAndDelete(createdEmployeeId);
  if (createdUserId) await User.findByIdAndDelete(createdUserId);
  await disconnectDB();
});

describe('POST /api/employees', () => {
  it('debe crear un empleado correctamente', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: createdUserId,
        position: 'agent',
        department: 'Ventas',
        commissionRate: 7,
        salary: 3000000,
        notes: 'Empleado de prueba',
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.commissionRate).toBe(7);
    createdEmployeeId = res.body._id;
  });

  it('debe fallar si el userId no existe', async () => {
    const fakeId = '000000000000000000000000';
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: fakeId,
        position: 'agent',
        department: 'Ventas',
        commissionRate: 5,
        salary: 2000000,
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/employees', () => {
  it('debe devolver la lista de empleados activos', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/employees/:id', () => {
  it('debe obtener un empleado por id con datos del usuario', async () => {
    const res = await request(app)
      .get(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(createdEmployeeId);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('debe devolver 404 con id inexistente', async () => {
    const res = await request(app)
      .get('/api/employees/000000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/employees/:id/commissions', () => {
  it('debe devolver comisiones del empleado', async () => {
    const res = await request(app)
      .get(`/api/employees/${createdEmployeeId}/commissions`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalCommission).toBeDefined();
    expect(res.body.salesCount).toBeDefined();
  });
});

describe('PUT /api/employees/:id', () => {
  it('debe actualizar la comisión del empleado', async () => {
    const res = await request(app)
      .put(`/api/employees/${createdEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ commissionRate: 10 });

    expect(res.status).toBe(200);
    expect(res.body.commissionRate).toBe(10);
  });
});
