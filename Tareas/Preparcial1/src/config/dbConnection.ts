import mongoose from "mongoose";

process.loadEnvFile();

const connectionString = process.env.MONGO_URI || "";
const dbName = process.env.MONGO_INITDB_DATABASE || "test";

export const db = mongoose.connect(connectionString, { dbName: dbName })
    .then(() =>
        console.log("Connected to MongoDB")
    ).catch(
        (error) => console.error(error)
    )