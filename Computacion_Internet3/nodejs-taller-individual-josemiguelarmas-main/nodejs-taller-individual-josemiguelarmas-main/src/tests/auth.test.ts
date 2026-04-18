import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { connectDB, disconnectDB } from './helpers/db';
import User from '../models/user.model';

const testEmail = `test.auth.${Date.now()}@aseguradora.com`;
const testDoc = `TEST${Date.now()}`;

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {

  await User.deleteOne({ email: testEmail });
  await disconnectDB();
});

describe('POST /api/auth/register', () => {
  it('debe registrar un usuario correctamente', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      lastName: 'User',
      email: testEmail,
      password: 'test1234',
      role: 'client',
      documentId: testDoc,
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.password).toBeUndefined();
  });

  it('debe fallar si el email ya existe', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      lastName: 'User',
      email: testEmail,
      password: 'test1234',
      role: 'client',
      documentId: `${testDoc}_2`,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('debe fallar con datos inválidos (sin email)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      password: 'test1234',
      role: 'client',
      documentId: '999',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('debe iniciar sesión correctamente', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'test1234',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
  });

  it('debe fallar con contraseña incorrecta', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('debe fallar con email inexistente', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.com',
      password: 'test1234',
    });

    expect(res.status).toBe(401);
  });
});
