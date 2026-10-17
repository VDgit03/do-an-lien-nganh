import express from "express";
import multer from "multer";

import { analyzeCV } from "../controllers/analysis/analysisController.js";
import { sampleJd } from "../controllers/analysis/sampleJdController.js";
import { fixCV } from "../controllers/analysis/fixController.js";
import { rewriteBullets } from "../controllers/analysis/rewriteController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB, khớp với frontend

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

// JD mẫu theo ngành (dữ liệu công khai, không cần đăng nhập)
router.get("/sample-jd", sampleJd);

// phân tích cv
router.post("/", authMiddleware, uploadCV, analyzeCV);

// viết lại mô tả bằng AI (Gemini)
router.post("/rewrite", authMiddleware, rewriteBullets);

// agent: tự sửa thẳng vào PDF
router.post("/fix", authMiddleware, uploadCV, fixCV);

export default router;