import mongoose from "mongoose";
import type { ReplyInput } from "./dto/reply.dto.js";
import type { ThreadDocument } from "../threads/thread.model.js";

export interface ReplyDocument extends Omit<ReplyInput, "threadId">, mongoose.Document {
    threadId: mongoose.Types.ObjectId | ThreadDocument;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

const replySchema = new mongoose.Schema({
    message: { type: String, required: true },
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: "Thread", required: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: "replies" });

export const ReplyModel = mongoose.model<ReplyDocument>("Reply", replySchema);