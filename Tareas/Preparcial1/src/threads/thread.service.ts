import { BoardModel } from "../boards/board.model.js";
import type { ThreadInput, ThreadInputUpdate } from "./dto/thread.dto.js";
import { ThreadModel, type ThreadDocument } from "./thread.model.js";

class ThreadService {
    public async create(threadInput: ThreadInput): Promise<ThreadDocument> {
        const boardExists = await BoardModel.findById(threadInput.boardId).exec();
        if (!boardExists) {
            throw new ReferenceError(`Board with id ${threadInput.boardId} not found`);
        }
        return ThreadModel.create({
            ...threadInput,
            replies: threadInput.replies ?? [],
        });
    }

    public async update(id: string, threadInput: ThreadInputUpdate): Promise<ThreadDocument | null> {
        try {
            const thread: ThreadDocument | null = await ThreadModel.findOneAndUpdate(
                { _id: id},
                threadInput,
                { returnOriginal: true }
            );
            return thread;
        } catch (error) {
            throw new Error(`Error updating thread with id ${id}: ${error}`);

        }
    }

    public async getAll(): Promise<ThreadDocument[]> {
        return ThreadModel.find().populate("boardId").populate("replies").exec();
    }

    public async getById(id: string): Promise<ThreadDocument | null> {
        return ThreadModel.findById(id).populate("boardId").populate("replies").exec();
    }

    public async delete(id: string): Promise<boolean> {
        try {
            const result = await ThreadModel.findOneAndUpdate(
                { _id: id, deletedAt: null },
                { deletedAt: new Date() }
            );
            return result !== null;
        } catch (error) {
            throw new Error(`Error deleting thread with id ${id}: ${error}`);
        }
    }

    public async getByBoardId(boardId: string): Promise<ThreadDocument[]> {
        return ThreadModel.find({ boardId, deletedAt: null }).populate("boardId").populate("replies").exec();
    }
}

export const threadService = new ThreadService();