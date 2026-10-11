import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
    runCVAnalysis,
    AnalysisError,
    VALID_LEVELS,
    VALID_ROLES
} from "../../services/analysis/analysisService.js";
import {
    extractTextFromPdf,
    isGeminiConfigured
} from "../../services/analysis/geminiService.js";
import { isAiRateLimited } from "../../services/analysis/aiRateLimit.js";

const MAX_JD_LENGTH = 10000;

const isPdf = (file) => {
    const buffer = file?.buffer;

    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        return false;
    }

    // "%PDF-" có thể nằm trong 1024 byte đầu, hoặc trình duyệt khai báo là PDF
    return (
        buffer.subarray(0, 1024).includes("%PDF-") ||
        file.mimetype === "application/pdf"
    );
};

// POST /api/analysis   (multipart/form-data)
//   cv   : file PDF (bắt buộc)
//   jd   : nội dung JD (tuỳ chọn; bỏ trống -> so với career framework)
//   role : giá trị trong VALID_ROLES
//   level: giá trị trong VALID_LEVELS
//   ocr  : "1" = người dùng đồng ý gửi PDF tới Gemini để đọc chữ khi PDF là ảnh
export const analyzeCV = async (req, res) => {
    let workDir = null;

    try {
        const file = req.file;
        const jd = String(req.body.jd ?? "").trim();
        const role = String(req.body.role ?? "").trim().toLowerCase();
        const level = String(req.body.level ?? "").trim().toLowerCase();
        const allowOcr = String(req.body.ocr ?? "") === "1";

        if (!file) {
            throw new AnalysisError("Vui lòng tải CV dạng PDF.", 400);
        }

        if (!isPdf(file)) {
            throw new AnalysisError("File tải lên không phải PDF hợp lệ.", 400);
        }

        if (!VALID_ROLES.includes(role)) {
            throw new AnalysisError("Ngành CNTT không hợp lệ.", 400);
        }

        if (!VALID_LEVELS.includes(level)) {
            throw new AnalysisError("Cấp bậc không hợp lệ.", 400);
        }

        if (jd.length > MAX_JD_LENGTH) {
            throw new AnalysisError(
                `JD không được vượt quá ${MAX_JD_LENGTH} ký tự.`,
                400
            );
        }

        // File tạm riêng cho mỗi request, luôn dọn trong finally
        workDir = await fs.mkdtemp(path.join(os.tmpdir(), "cv-analysis-"));

        const pdfPath = path.join(workDir, "cv.pdf");
        await fs.writeFile(pdfPath, file.buffer);

        let jdPath = null;

        if (jd) {
            jdPath = path.join(workDir, "jd.txt");
            await fs.writeFile(jdPath, jd, "utf8");
        }

        let output;
        let ocrText = null;

        try {
            output = await runCVAnalysis({ pdfPath, jdPath, role, level });
        } catch (error) {
            // Chỉ xử lý riêng PDF dạng ảnh (không có lớp chữ)
            if (!(error instanceof AnalysisError) || error.code !== "NO_TEXT") {
                throw error;
            }

            const canOcr = isGeminiConfigured();

            // Gửi CV cho bên thứ ba cần người dùng đồng ý rõ ràng (ocr=1)
            if (!canOcr || !allowOcr) {
                throw new AnalysisError(
                    canOcr
                        ? "PDF này là ảnh nên không có chữ để phân tích. Có thể dùng AI (Gemini) để đọc chữ từ ảnh."
                        : "PDF này là ảnh nên không có chữ để phân tích. Hãy xuất lại CV thành PDF có chữ (Export/Download as PDF).",
                    422,
                    { code: "NO_TEXT", canOcr }
                );
            }

            if (isAiRateLimited(req.userId)) {
                throw new AnalysisError(
                    "Bạn đã dùng AI quá nhiều lần, vui lòng thử lại sau ít phút.",
                    429
                );
            }

            const { text } = await extractTextFromPdf(file.buffer);
            ocrText = text;

            const textPath = path.join(workDir, "cv.txt");
            await fs.writeFile(textPath, text, "utf8");

            output = await runCVAnalysis({ textPath, jdPath, role, level });
        }

        return res.status(200).json({
            success: true,
            data: {
                mode: output.mode,
                input: output.input,
                result: output.result,
                advice: output.advice,
                ocr: Boolean(output.ocr),
                // để người dùng tự kiểm tra AI đọc chữ có đúng không
                ocrText
            }
        });
    } catch (error) {
        let status = error instanceof AnalysisError ? error.statusCode : 500;

        // PDF dạng ảnh là trạng thái bình thường (frontend sẽ hỏi dùng OCR),
        // không phải lỗi -> trả 200 để console không báo đỏ 422
        if (error instanceof AnalysisError && error.code === "NO_TEXT") {
            status = 200;
        }

        if (status >= 500) {
            console.error("ANALYZE CV ERROR:", error);
        }

        return res.status(status).json({
            success: false,
            message:
                status >= 500 && !(error instanceof AnalysisError)
                    ? "Có lỗi xảy ra khi phân tích CV"
                    : error.message,
            ...(error instanceof AnalysisError ? error.extra : {})
        });
    } finally {
        if (workDir) {
            await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
        }
    }
};