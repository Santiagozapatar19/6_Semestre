import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import routes from './routes';
import { notFound, errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req: Request, res: Response) => {
  res.send('Aseguradora API corriendo 🚀');
});

routes(app);

app.use(notFound);
app.use(errorHandler);

export default app;
