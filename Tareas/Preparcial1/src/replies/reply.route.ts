import express from "express";
import { repliesController } from "./reply.controller.js";

export const replyRouter = express.Router();

replyRouter.post("/", repliesController.create);
replyRouter.get("/", repliesController.getAll);
replyRouter.get("/:id", repliesController.getOne);
replyRouter.put("/:id", repliesController.update);
replyRouter.delete("/:id", repliesController.delete);