import mongoose from "mongoose";

export interface StudentInput{
    name:string;
    age:number;
    email:string;
}

export interface StudentDocument extends StudentInput, mongoose.Document{}

const studentSchema = new mongoose.Schema({
    name:   { type: String, required: true },
    email:  { type: String, required: true },
    age:    { type: Number, required: true },
    isActive: { type: Boolean, default: true }
    
}, { collection: "Students" });
export const StudentModel = mongoose.model<StudentDocument>("Student", studentSchema);