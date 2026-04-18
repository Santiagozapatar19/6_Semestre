import app from './app';
import { db } from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;

db.then(() => {
  app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  });
});
