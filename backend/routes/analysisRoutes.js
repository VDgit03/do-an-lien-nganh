import express from "express";
import multer from "multer";

import { analyzeCV } from "../controllers/analysis/analysisController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB, khớp với frontend

// Giữ file trong RAM, controller tự ghi ra file tạm rồi xoá
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 1 }
});

const uploadCV = (req, res, next) => {
    upload.single("cv")(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message: "File PDF không được vượt quá 10MB."
            });
        }

        return res.status(400).json({
            success: false,
            message: "Không đọc được file tải lên."
        });
    });
};

// phân tích cv
router.post("/", authMiddleware, uploadCV, analyzeCV);

export default router;
