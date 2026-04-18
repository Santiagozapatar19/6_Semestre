import mongoose from "mongoose";
import type { BoardInput } from "./dto/board.dto.js";

export interface BoardDocument extends BoardInput, mongoose.Document {
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}

const boardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: "boards" }); 

export const BoardModel = mongoose.model<BoardDocument>("Board", boardSchema);

