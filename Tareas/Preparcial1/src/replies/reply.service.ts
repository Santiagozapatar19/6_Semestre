import { ThreadModel } from "../threads/thread.model.js";
import type { ReplyInput, ReplyInputUpdate } from "./dto/reply.dto.js";
import { ReplyModel, type ReplyDocument } from "./reply.model.js";

class ReplyService {

    public async create(replyInput: ReplyInput): Promise<ReplyDocument> {
        const threadExists = await ThreadModel.findOne({ _id: replyInput.threadId, deletedAt: null }).exec();
        if (!threadExists) {
            throw new ReferenceError(`Thread with id ${replyInput.threadId} not found`);
        }

        const newReply = await ReplyModel.create(replyInput);
        await ThreadModel.findByIdAndUpdate(replyInput.threadId, {
            $push: { replies: newReply._id },
        }).exec();

        return newReply;
    }

    public async update(id: string, replyInput: ReplyInputUpdate): Promise<ReplyDocument | null> {
        try {
            const reply: ReplyDocument | null = await ReplyModel.findOneAndUpdate(
                { _id: id, deletedAt: null },
                replyInput,
                { returnOriginal: true }
            );
            return reply;
        } catch (error) {
            throw new Error(`Error updating reply with id ${id}: ${error}`);
        }
    }

    public async getAll(): Promise<ReplyDocument[]> {
        return ReplyModel.find({ deletedAt: null }).populate("threadId").exec();
    }

    public async getById(id: string): Promise<ReplyDocument | null> {
        return ReplyModel.findOne({ _id: id, deletedAt: null }).populate("threadId").exec();
    }

    public async delete(id: string): Promise<boolean> {
        try {
            const result = await ReplyModel.findOneAndUpdate(
                { _id: id, deletedAt: null },
                { deletedAt: new Date() }
            ).exec();

            if (result) {
                await ThreadModel.findByIdAndUpdate(result.threadId, {
                    $pull: { replies: result._id },
                }).exec();
            }

            return result !== null;
        } catch (error) {
            throw new Error(`Error deleting reply with id ${id}: ${error}`);
        }
    }
}

export const replyService = new ReplyService();