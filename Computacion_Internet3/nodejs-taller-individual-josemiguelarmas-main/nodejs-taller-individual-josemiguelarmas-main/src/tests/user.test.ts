import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { connectDB, disconnectDB } from './helpers/db';
import User from '../models/user.model';

// Credenciales del admin creado previamente
const ADMIN_EMAIL = 'admin@aseguradora.com';
const ADMIN_PASSWORD = 'admin123';

let adminToken: string;
let createdUserId: string;
const testEmail = `test.user.${Date.now()}@aseguradora.com`;
const testDoc = `USR${Date.now()}`;

beforeAll(async () => {
  await connectDB();
  const res = await request(app).post('/api/auth/login').send({
    adminName: 'Cliente',
    adminLastName: 'Prueba',
    ADMIN_EMAIL: testEmail,
    ADMIN_PASSWORD: 'pass1234',
    role: 'admin',
    documentId: testDoc,
  });
  adminToken = res.body.token;
});

afterAll(async () => {
  if (createdUserId) await User.findByIdAndDelete(createdUserId);
  await disconnectDB();
});

describe('GET /api/users/me', () => {
  it('debe devolver el perfil del admin', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(ADMIN_EMAIL);
    expect(res.body.password).toBeUndefined();
  });

  it('debe fallar sin token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users', () => {
  it('debe devolver lista de usuarios (admin)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('debe filtrar por rol', async () => {
    const res = await request(app)
      .get('/api/users?role=client')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.forEach((u: { role: string }) => {
      expect(u.role).toBe('client');
    });
  });
});

describe('POST /api/auth/register + GET /api/users/:id', () => {
  it('debe crear y luego obtener un usuario por id', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Cliente',
      lastName: 'Prueba',
      email: testEmail,
      password: 'pass1234',
      role: 'client',
      documentId: testDoc,
    });
    createdUserId = reg.body.user._id;

    const res = await request(app)
      .get(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(createdUserId);
  });
});

describe('PUT /api/users/:id', () => {
  it('debe actualizar el teléfono del usuario', async () => {
    const res = await request(app)
      .put(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ phone: '3009998877' });

    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('3009998877');
  });
});

describe('DELETE /api/users/:id', () => {
  it('debe desactivar el usuario (soft delete)', async () => {
    const res = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.isActive).toBe(false);
  });
});
