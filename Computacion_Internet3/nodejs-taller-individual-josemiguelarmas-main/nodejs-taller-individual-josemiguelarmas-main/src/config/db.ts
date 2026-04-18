import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();

let mongod: MongoMemoryServer;

export const db = (async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log('MongoDB en memoria conectado correctamente');
})().catch((error) => {
  console.error('❌ Error al conectar con MongoDB en memoria:', error);
  process.exit(1);
});
