import type { Request, Response } from "express";
import { boardService } from "./board.service.js";
import type { BoardInput } from "./dto/board.dto.js";
import type { BoardDocument } from "./board.model.js";

class BoardController {

    public async create(req: Request, res: Response){
        try {
            const newBoard: BoardDocument = await boardService.create(req.body as BoardInput);
            res.status(201).json(newBoard);
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: "Board not found"});
                return;
            }
            res.status(500).json(error);
        }
    }

    public async getAll(req: Request, res: Response) {
        try {
            const boards: BoardDocument[] = await boardService.getAll();
            res.json(boards);
        } catch (error) {
            res.status(500).json(error);    
        }
    }

    public async getOne(req: Request, res: Response) {
        try {
            const id: string = req.params.id as string || "";
            const board: BoardDocument | null = await boardService.getById(id);
            if (board === null) {
                res.status(404).json({ message: `Board with id ${id} not found` });
                return;
            }
            res.json(board);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const id: string = req.params.id as string || "";
            const board: BoardDocument | null = await boardService.update(id, req.body as BoardInput);
            if (board === null) {
                res.status(404).json({ message: `Board with id ${id} not found` });
                return;
            }
            res.json(board);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const id: string = req.params.id as string || "";
            const deleted: boolean = await boardService.delete(id);
            if (!deleted) {
                res.status(404).json({ message: `Board with id ${id} not found` });
                return;
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json(error);

        }
    }
}

export const boardController = new BoardController();