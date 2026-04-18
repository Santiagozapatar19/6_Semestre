import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();
let mongod: MongoMemoryServer;

export const connectDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();  
  //const uri = process.env.MONGO_URI as string;
  await mongoose.connect(uri);
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
