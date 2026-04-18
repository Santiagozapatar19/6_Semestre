import type { Request, Response } from "express";
import type { ReplyDocument } from "./reply.model.js";
import type { ReplyInput } from "./dto/reply.dto.js";
import { replyService } from "./reply.service.js";
class RepliesController {
    // Implementar los métodos del controlador de respuestas aquí
    public async create(req: Request, res: Response) {
        try {
            // Lógica para crear una nueva respuesta
            const newReply: ReplyDocument = await replyService.create(req.body as ReplyInput);
            res.status(201).json({ message: "Respuesta creada exitosamente" });
        } catch (error) {
            if (error instanceof ReferenceError) {
                res.status(400).json({ message: "Thread not found" });
                return;
            }
            res.status(500).json(error);
        }

    }

    public async getAll(req: Request, res: Response) {
        try {
            // Lógica para obtener todas las respuestas
            const replies: ReplyDocument[] = await replyService.getAll();
            res.json(replies);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async getOne(req: Request, res: Response) {  
        try {
            // Lógica para obtener una respuesta por su ID
            const id: string = req.params.id as string || "";
            const reply: ReplyDocument | null = await replyService.getById(id);
            if (reply === null) {
                res.status(404).json({ message: `Reply with id ${id} not found` });
                return;
            }
            res.json(reply);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            // Lógica para actualizar una respuesta por su ID
            const id: string = req.params.id as string || "";
            const updatedReply: ReplyDocument | null = await replyService.update(id, req.body as ReplyInput);
            if (updatedReply === null) {
                res.status(404).json({ message: `Reply with id ${id} not found` });
                return;
            }   
            res.json(updatedReply);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async delete(req: Request, res: Response) {  
        try {
            // Lógica para eliminar una respuesta por su ID
            const id: string = req.params.id as string || "";
            const deleted: boolean = await replyService.delete(id);
            if (!deleted) {
                res.status(404).json({ message: `Reply with id ${id} not found` });
                return;
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json(error);
        }   
    }
}

export const repliesController = new RepliesController();