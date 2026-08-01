import express from "express";
import cors from "cors";
import "dotenv/config";
import { rateLimit } from "express-rate-limit";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import rankRouter from "./routes/rankRoutes.js";
import analysisRouter from "./routes/analysisRoutes.js";
import { startRankTrackingCron } from "./cron/rankTrackingCron.js";

connectDB().catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
});

const app = express()

app.use(cors())
app.use(express.json())

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false
});

app.use("/api/", generalLimiter)
app.use("/api/analysis/analyze", strictLimiter)
app.use("/api/rank/add", strictLimiter)

app.get("/", (req,res) => {
    res.send("Server is running!")
})
app.use("/api/auth", authRouter);
app.use("/api/rank", rankRouter);
app.use('/api/analysis', analysisRouter);

// Start Cron jobs
startRankTrackingCron();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})