import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import forgotRoutes from "./routes/forgotRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import cvRoutes from "./routes/cvRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js"
import {
    startInterviewReminderScheduler
} from "./services/interview/schedulerService.js";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/forget", forgotRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/cvs", cvRoutes);
app.use("/api/interviews", interviewRoutes);

app.listen(3000, () => {
    console.log("Server chạy tại http://localhost:3000");
    startInterviewReminderScheduler();
});