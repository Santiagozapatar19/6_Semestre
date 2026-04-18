import express, {Express} from "express";
import { db } from "./lib/connectionDb";
import { studentRouter } from "./routes/student.route";

const app: Express = express();

const port:number = 3000;

app.use(express.urlencoded({extended: false}))
app.use(express.json());
//routes
app.use("/students", studentRouter)

db.then(()=>{
    app.listen(port, ()=>{
        console.log(`Server running on ${port} port`)
    })
})
