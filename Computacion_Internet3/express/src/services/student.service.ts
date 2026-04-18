import { StudentDocument, StudentModel, StudentInput } from "../models/student.model";
import mongoose from "mongoose";

class StudentService {

    async findAll(): Promise<StudentDocument[]> {
        return await StudentModel.find();
    }

    async findOne(id: string): Promise<StudentDocument | null> {
        if (!mongoose.isValidObjectId(id)) return null;
        return await StudentModel.findById(id);
    }

    async create(data: StudentInput): Promise<StudentDocument> {
        const student = new StudentModel(data);
        return await student.save();
    }

    async update(id: string, data: Partial<StudentInput>): Promise<StudentDocument | null> {
        if (!mongoose.isValidObjectId(id)) return null;
        return await StudentModel.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string): Promise<StudentDocument | null> {
        if (!mongoose.isValidObjectId(id)) return null;
        return await StudentModel.findByIdAndDelete(id);
    }

    async softDelete(id: string): Promise<StudentDocument | null> {
        if (!mongoose.isValidObjectId(id)) return null;
        return await StudentModel.findByIdAndUpdate(id, { deleted: true }, { new: true });
    }

}

export const studentService = new StudentService();