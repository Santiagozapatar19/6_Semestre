import express from 'express';
import { boardController } from './board.controller.js';

const boardRouter = express.Router();

boardRouter.post('/', boardController.create);
boardRouter.get('/', boardController.getAll);
boardRouter.get('/:id', boardController.getOne);
boardRouter.put('/:id', boardController.update);
boardRouter.delete('/:id', boardController.delete);

export { boardRouter };