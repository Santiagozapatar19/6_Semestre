import request from 'supertest';
import app from '../app';
import { connectDB, disconnectDB } from './helpers/db';
import Vehicle from '../models/vehicle.model';

const ADMIN_EMAIL = 'admin@aseguradora.com';
const ADMIN_PASSWORD = 'admin123';

let adminToken: string;
let createdVehicleId: string;

const testPlate = `TST${Date.now().toString().slice(-5)}`;
const testVin = `VIN${Date.now()}`.slice(0, 17);

beforeAll(async () => {
  await connectDB();
  const res = await request(app).post('/api/auth/login').send({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  adminToken = res.body.token;
});

afterAll(async () => {
  if (createdVehicleId) await Vehicle.findByIdAndDelete(createdVehicleId);
  await disconnectDB();
});

describe('POST /api/vehicles', () => {
  it('debe crear un vehículo correctamente', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        licensePlate: testPlate,
        vin: testVin,
        brand: 'Honda',
        vehicleModel: 'Civic',
        year: 2023,
        color: 'Azul',
        engineCC: 1500,
        fuelType: 'gasoline',
        transmission: 'automatic',
        mileage: 0,
        doors: 4,
        basePrice: 75000000,
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.status).toBe('available');
    createdVehicleId = res.body._id;
  });

  it('debe fallar sin token', async () => {
    const res = await request(app).post('/api/vehicles').send({
      licensePlate: 'FAIL01',
      vin: 'FAILVIN0000000001',
      brand: 'Test',
      vehicleModel: 'Test',
      year: 2020,
      color: 'Negro',
      engineCC: 1000,
      fuelType: 'gasoline',
      transmission: 'manual',
      basePrice: 10000,
    });
    expect(res.status).toBe(401);
  });

  it('debe fallar con placa duplicada', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        licensePlate: testPlate,
        vin: `VIN_DUP${Date.now()}`.slice(0, 17),
        brand: 'Honda',
        vehicleModel: 'Civic',
        year: 2023,
        color: 'Rojo',
        engineCC: 1500,
        fuelType: 'gasoline',
        transmission: 'automatic',
        basePrice: 75000000,
      });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/vehicles/available', () => {
  it('debe devolver vehículos disponibles', async () => {
    const res = await request(app)
      .get('/api/vehicles/available')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((v: { status: string }) => {
      expect(v.status).toBe('available');
    });
  });
});

describe('GET /api/vehicles/:id', () => {
  it('debe obtener un vehículo por id', async () => {
    const res = await request(app)
      .get(`/api/vehicles/${createdVehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(createdVehicleId);
    expect(res.body.brand).toBe('Honda');
  });
});

describe('PUT /api/vehicles/:id', () => {
  it('debe actualizar el color del vehículo', async () => {
    const res = await request(app)
      .put(`/api/vehicles/${createdVehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ color: 'Verde' });

    expect(res.status).toBe(200);
    expect(res.body.color).toBe('Verde');
  });
});
