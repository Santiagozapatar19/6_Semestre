import { Router } from "express";
import { studentController } from "../controllers/student.controller";

export const studentRouter = Router();
studentRouter.get("/", studentController.getAll);
// New
studentRouter.get("/:id", studentController.getOne);
studentRouter.post("/", studentController.create);
studentRouter.put("/:id", studentController.update);
studentRouter.delete("/:id", studentController.delete);