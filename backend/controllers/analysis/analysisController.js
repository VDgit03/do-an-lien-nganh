import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
    runCVAnalysis,
    AnalysisError,
    VALID_LEVELS,
    VALID_ROLES
} from "../../services/analysis/analysisService.js";

const MAX_JD_LENGTH = 10000;

const isPdf = (buffer) =>
    Buffer.isBuffer(buffer) &&
    buffer.subarray(0, 5).toString("latin1") === "%PDF-";

// POST /api/analysis   (multipart/form-data)
//   cv  : file PDF (bắt buộc)
//   jd  : nội dung JD (tuỳ chọn; bỏ trống -> so với career framework)
//   role: giá trị trong VALID_ROLES
//   level: giá trị trong VALID_LEVELS
export const analyzeCV = async (req, res) => {
    let workDir = null;

    try {
        const file = req.file;
        const jd = String(req.body.jd ?? "").trim();
        const role = String(req.body.role ?? "").trim().toLowerCase();
        const level = String(req.body.level ?? "").trim().toLowerCase();

        if (!file) {
            throw new AnalysisError("Vui lòng tải CV dạng PDF.", 400);
        }

        if (!isPdf(file.buffer)) {
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

        const output = await runCVAnalysis({ pdfPath, jdPath, role, level });

        return res.status(200).json({
            success: true,
            data: {
                mode: output.mode,
                input: output.input,
                result: output.result,
                advice: output.advice
            }
        });
    } catch (error) {
        const status = error instanceof AnalysisError ? error.statusCode : 500;

        if (status >= 500) {
            console.error("ANALYZE CV ERROR:", error);
        }

        return res.status(status).json({
            success: false,
            message:
                status >= 500 && !(error instanceof AnalysisError)
                    ? "Có lỗi xảy ra khi phân tích CV"
                    : error.message
        });
    } finally {
        if (workDir) {
            await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
        }
    }
};
