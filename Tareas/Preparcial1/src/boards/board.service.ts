import { BoardModel, type BoardDocument } from "./board.model.js";
import type { BoardInput, BoardInputUpdate } from "./dto/board.dto.js";

class BoardService {

    public async create(boardInput: BoardInput): Promise<BoardDocument> {
        const boardExists: BoardDocument | null = await this.findByName(boardInput.name);
        if (boardExists !== null) {
            throw new Error("Board already exists");
        }
        return BoardModel.create(boardInput);
    }

    public async update(id: string, boardInput: BoardInputUpdate): Promise<BoardDocument | null> {
        try {
            const board: BoardDocument | null = await BoardModel.findOneAndUpdate(
                { _id: id, deletedAt: null },
                boardInput,
                { returnDocument: "after" }
            );
            return board;
        } catch (error) {
            throw error;
        }
    }

    public getAll(): Promise<BoardDocument[]> {
        return BoardModel.find({ deletedAt: null }).exec();
    }

    public getById(id: string): Promise<BoardDocument | null> {
        return BoardModel.findOne({ _id: id, deletedAt: null }).exec();
    }

    public async delete(id: string): Promise<boolean> {
        try {
            const result = await BoardModel.findOneAndUpdate(
                { _id: id, deletedAt: null },
                { deletedAt: new Date() }
            );
            return result !== null;
        } catch (error) {
            throw error;
        }
    }

    public async findByName(name: string): Promise<BoardDocument | null> {
        return BoardModel.findOne({ name, deletedAt: null }).exec();
    }
}

export const boardService = new BoardService();