import type { ThreadDocument } from "./thread.model.js";
import type { Request, Response } from "express";
import { threadService } from "./thread.service.js";
import type { ThreadInput, ThreadInputUpdate } from "./dto/thread.dto.js";

class ThreadController {

    public async create(req: Request, res: Response) {
        try {
            const newThread: ThreadDocument = await threadService.create(req.body as ThreadInput);
            res.status(201).json(newThread);
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
            const threads: ThreadDocument[] = await threadService.getAll();
            res.json(threads);
        } catch (error) {
            res.status(500).json(error);

        }
    }

    public async getOne(req: Request, res: Response) {
        try {
            const id: string = req.params.id as string || "";
            const thread: ThreadDocument | null = await threadService.getById(id);
            if (thread === null) {
                res.status(404).json({ message: `Thread with id ${id} not found` });
                return;
            }
            res.json(thread);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const id: string = req.params.id as string || "";
            const thread: ThreadDocument | null = await threadService.update(id, req.body as ThreadInputUpdate);
            if (thread === null) {
                res.status(404).json({ message: `Thread with id ${id} not found` });
                return;
            }
            res.json(thread);
        } catch (error) {
            res.status(500).json(error);
        }
    } 

    public async delete(req: Request, res: Response) {
        try {
            const id: string = req.params.id as string || "";
            const deleted: boolean = await threadService.delete(id);
            if (!deleted) {
                res.status(404).json({ message: `Thread with id ${id} not found` });
                return;
            }
            res.json({ message: `Thread with id ${id} deleted` });
        } catch (error) {
            res.status(500).json(error);

        }
    }

}

export const threadController = new ThreadController();