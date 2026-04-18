import mongoose from "mongoose";
import type { ThreadInput } from "./dto/thread.dto.js";
import type { BoardDocument } from "../boards/board.model.js";
import type { ReplyDocument } from "../replies/reply.model.js";

export interface ThreadDocument extends Omit<ThreadInput, "replies">, mongoose.Document {
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    board: BoardDocument; // reference to the board the thread belongs to
    replies: ReplyDocument[];
}

const threadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    replies: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }],
        default: [],
    },
    deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: "threads" });

export const ThreadModel = mongoose.model<ThreadDocument>("Thread", threadSchema);