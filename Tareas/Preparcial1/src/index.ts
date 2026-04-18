import express from 'express';
import type { Express, Request, Response } from 'express';
import { boardRouter } from './boards/board.route.js';
import { threadRouter } from './threads/thread.route.js';
import { replyRouter } from './replies/reply.route.js';

import { db } from './config/dbConnection.js'; // Aún no está creado

const app: Express = express(); // Creación de una instancia de express

process.loadEnvFile(); // Process es un módulo de nodejs para manejar el entorno de ejecución, aquí cargamos las variables de entorno desde el archivo .env

const port = process.env.PORT || 3000; // Definimos el puerto en el que escuchará el servidor, si no se especifica en las variables de entorno, usará el puerto 3000 por defecto.

app.use(express.json()); // Módulo de Express para manejar solicitudes JSON
app.use(express.urlencoded({ extended: true })); // Módulo de Express para manejar solicitudes URL codificadas
app.use('/boards', boardRouter);
app.use('/threads', threadRouter);
app.use('/replies', replyRouter); // Agregamos la ruta para las respuestas

app.get("/", (req: Request, res: Response) => { // Definimos una ruta raíz para probar que el servidor está funcionando correctamente.
    res.send('Hola Mundo');
});

// Conectamos a la base de datos y luego iniciamos el servidor
db.then(() =>
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    })
);