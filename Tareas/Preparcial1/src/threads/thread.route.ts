import express from 'express';
import { threadController } from './thread.controller.js';

const threadRouter = express.Router();

threadRouter.post('/', threadController.create);
threadRouter.get('/', threadController.getAll);
threadRouter.get('/:id', threadController.getOne);
threadRouter.put('/:id', threadController.update);
threadRouter.delete('/:id', threadController.delete);

export { threadRouter };

