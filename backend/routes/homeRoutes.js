import express from "express";
import { getHomeSummaryController } from "../controllers/homeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/summary", authMiddleware, getHomeSummaryController);

export default router;