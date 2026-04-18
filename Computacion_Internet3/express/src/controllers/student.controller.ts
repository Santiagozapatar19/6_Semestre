import { Request, Response } from "express";
import { studentService } from "../services/student.service";

class StudentController {

    private extractId(req: Request, res: Response): string | null {
        const { id } = req.params;

        if (!id || Array.isArray(id)) {
            res.status(400).json({ error: "Invalid ID format" });
            return null;
        }

        return id;
    }

    public getAll = async (req: Request, res: Response) => {
        try {
            const students = await studentService.findAll();
            res.status(200).json(students);
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    };

    public getOne = async (req: Request, res: Response) => {
        const id = this.extractId(req, res);
        if (!id) return;

        try {
            const student = await studentService.findOne(id);
            if (!student) return res.status(404).json({ error: "Student not found" });

            res.status(200).json(student);
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    };

    public create = async (req: Request, res: Response) => {
        try {
            const student = await studentService.create(req.body);
            res.status(201).json(student);
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    };

    public update = async (req: Request, res: Response) => {
        const id = this.extractId(req, res);
        if (!id) return;

        try {
            const student = await studentService.update(id, req.body);
            if (!student) return res.status(404).json({ error: "Student not found" });

            res.status(200).json(student);
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    };

    public delete = async (req: Request, res: Response) => {
        const id = this.extractId(req, res);
        if (!id) return;

        try {
            const student = await studentService.delete(id);
            if (!student) return res.status(404).json({ error: "Student not found" });

            res.status(200).json({ message: "Student deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    };
}

export const studentController = new StudentController();