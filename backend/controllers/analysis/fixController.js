import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
    runCVAnalysis,
    AnalysisError,
    VALID_LEVELS,
    VALID_ROLES
} from "../../services/analysis/analysisService.js";
import { runCVAgent, AGENT_MODES } from "../../services/analysis/agentService.js";
import {
    isGeminiConfigured,
    extractTextFromPdf,
    rewriteBulletsWithGemini
} from "../../services/analysis/geminiService.js";
import { isAiRateLimited } from "../../services/analysis/aiRateLimit.js";

const MAX_JD_LENGTH = 6000;
const MAX_REWRITES = 10;      // tối đa số bullet agent sửa mỗi lần
const GEMINI_CHUNK = 5;       // khớp MAX_BULLETS của geminiService
const NO_METRIC_TEXT = "Chưa có số liệu/kết quả đo được.";

// "[X%]", "[N users]"... = chỗ cần người dùng điền số thật -> không ghi vào PDF
const PLACEHOLDER = /\[[^\]\n]{1,40}\]/;
const normalize = (text) => String(text).replace(/\s+/g, " ").trim().toLowerCase();

const isPdf = (file) => {
    const buffer = file?.buffer;
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) return false;
    return buffer.subarray(0, 1024).includes("%PDF-") || file.mimetype === "application/pdf";
};

// POST /api/analysis/fix   (multipart/form-data)
//   cv, role, level, jd : như /api/analysis
//   mode                : auto | inplace | rebuild  (mặc định auto)
// Agent: phân tích -> viết lại bullet (Gemini, dự phòng bản theo luật) -> sửa thẳng vào PDF.
export const fixCV = async (req, res) => {
    let workDir = null;

    try {
        const file = req.file;
        const jd = String(req.body.jd ?? "").trim();
        const role = String(req.body.role ?? "").trim().toLowerCase();
        const level = String(req.body.level ?? "").trim().toLowerCase();
        const mode = String(req.body.mode ?? "auto").trim().toLowerCase();
        const allowOcr = String(req.body.ocr ?? "") === "1";

        if (!file) throw new AnalysisError("Vui lòng tải CV dạng PDF.", 400);
        if (!isPdf(file)) throw new AnalysisError("File tải lên không phải PDF hợp lệ.", 400);
        if (!VALID_ROLES.includes(role)) throw new AnalysisError("Ngành CNTT không hợp lệ.", 400);
        if (!VALID_LEVELS.includes(level)) throw new AnalysisError("Cấp bậc không hợp lệ.", 400);
        if (!AGENT_MODES.includes(mode)) throw new AnalysisError("Chế độ sửa không hợp lệ.", 400);
        if (jd.length > MAX_JD_LENGTH) {
            throw new AnalysisError(`JD không được vượt quá ${MAX_JD_LENGTH} ký tự.`, 400);
        }

        workDir = await fs.mkdtemp(path.join(os.tmpdir(), "cv-agent-"));
        const pdfPath = path.join(workDir, "cv.pdf");
        const jdPath = jd ? path.join(workDir, "jd.txt") : null;
        const changesPath = path.join(workDir, "changes.json");
        const outPath = path.join(workDir, "fixed.pdf");

        await fs.writeFile(pdfPath, file.buffer);
        if (jdPath) await fs.writeFile(jdPath, jd, "utf8");

        // 1. Phân tích. PDF ảnh (NO_TEXT) không có toạ độ chữ để sửa tại chỗ ->
        //    OCR bằng Gemini (cần người dùng đồng ý), rồi dựng lại CV thành PDF có chữ.
        let analysis;
        let textPath = null;
        let agentMode = mode;

        try {
            analysis = await runCVAnalysis({ pdfPath, jdPath, role, level });
        } catch (error) {
            if (!(error instanceof AnalysisError) || error.code !== "NO_TEXT") {
                throw error;
            }

            const canOcr = isGeminiConfigured();

            if (!canOcr || !allowOcr) {
                throw new AnalysisError(
                    canOcr
                        ? "PDF này là ảnh nên chưa có chữ để sửa. Có thể dùng AI (Gemini) đọc chữ từ ảnh rồi dựng lại CV thành PDF sửa được."
                        : "PDF này là ảnh nên không sửa trực tiếp được. Hãy xuất lại CV thành PDF có chữ rồi thử lại.",
                    422,
                    { code: "NO_TEXT", canOcr }
                );
            }

            if (isAiRateLimited(req.userId)) {
                throw new AnalysisError("Bạn đã dùng AI quá nhiều lần, vui lòng thử lại sau ít phút.", 429);
            }

            const { text } = await extractTextFromPdf(file.buffer);
            textPath = path.join(workDir, "cv.txt");
            await fs.writeFile(textPath, text, "utf8");

            analysis = await runCVAnalysis({ textPath, jdPath, role, level });
            agentMode = "rebuild"; // ảnh: không có toạ độ chữ nên không sửa tại chỗ
        }

        const candidates = (analysis.advice?.bullet_rewrites || [])
            .map((item, index) => ({ ...item, id: String(index) }))
            .filter((item) => item.original)
            .slice(0, MAX_REWRITES);

        if (!candidates.length) {
            return res.status(200).json({
                success: true,
                data: { mode: null, applied: [], failed: [], pending: [], pdfBase64: null,
                        notes: ["Không có bullet nào cần sửa."] }
            });
        }

        // 2. Viết lại bằng Gemini (nếu có), lỗi thì dùng bản nháp theo luật
        const notes = [];
        let aiRewrites = {};
        let aiRejected = [];
        let aiModel = null;

        if (isGeminiConfigured()) {
            if (isAiRateLimited(req.userId)) {
                notes.push("Đã dùng AI quá nhiều lần gần đây, agent dùng bản viết lại theo luật.");
            } else {
                try {
                    for (let i = 0; i < candidates.length; i += GEMINI_CHUNK) {
                        const chunk = candidates.slice(i, i + GEMINI_CHUNK).map((item) => ({
                            id: item.id,
                            text: item.original,
                            // không đòi số liệu: agent không được bịa/điền placeholder vào PDF
                            problems: (item.issues || []).filter((x) => x !== NO_METRIC_TEXT)
                        }));
                        const out = await rewriteBulletsWithGemini(chunk, jd);
                        Object.assign(aiRewrites, out.rewrites);
                        aiRejected = aiRejected.concat(out.rejected);
                        aiModel = out.model;
                    }
                } catch (error) {
                    console.error("FIX: Gemini lỗi, dùng bản theo luật:", error.message);
                    notes.push("Không gọi được Gemini, agent dùng bản viết lại theo luật.");
                }
            }
        } else {
            notes.push("Chưa cấu hình Gemini, agent dùng bản viết lại theo luật.");
        }

        // 3. Chốt danh sách thay đổi
        const changes = [];
        const pending = [];
        const label = {};

        for (const item of candidates) {
            const next = aiRewrites[item.id] || (item.draft ? [item.draft] : null);
            label[item.id] = item.source || item.section || "";

            if (!next || normalize(next.join(" ")) === normalize(item.original)) continue;

            if (next.some((text) => PLACEHOLDER.test(text))) {
                pending.push({ id: item.id, source: label[item.id], original: item.original,
                               draft: next, reason: "needs_user_input" });
                continue;
            }

            changes.push({ id: item.id, original: item.original, new: next });
        }

        if (!changes.length) {
            return res.status(200).json({
                success: true,
                data: { mode: null, applied: [], failed: [], pending, pdfBase64: null,
                        notes: [...notes, "Không có thay đổi nào an toàn để tự áp dụng."] }
            });
        }

        await fs.writeFile(changesPath, JSON.stringify(changes), "utf8");

        // 4. Sửa vào PDF
        const report = await runCVAgent({ pdfPath, textPath, changesPath, outPath, mode: agentMode });

        let pdfBase64 = null;
        if (report.applied.length) {
            pdfBase64 = (await fs.readFile(outPath)).toString("base64");
        }

        const byId = new Map(changes.map((c) => [c.id, c]));
        const decorate = (entry) => ({
            ...entry,
            source: label[entry.id],
            original: byId.get(entry.id)?.original,
            new: byId.get(entry.id)?.new
        });

        return res.status(200).json({
            success: true,
            data: {
                mode: report.mode_used,
                applied: report.applied.map(decorate),
                failed: report.failed.map(decorate),
                pending,
                notes: [...notes, ...report.notes],
                aiModel,
                aiRejected,
                fileName: "cv-da-sua.pdf",
                pdfBase64
            }
        });
    } catch (error) {
        const status = error instanceof AnalysisError ? error.statusCode : 500;

        if (status >= 500 && !(error instanceof AnalysisError)) {
            console.error("FIX CV ERROR:", error);
        }

        // PDF ảnh là trạng thái bình thường (frontend hỏi dùng OCR) -> 200 như /analysis
        const isNoText = error instanceof AnalysisError && error.code === "NO_TEXT";

        return res.status(isNoText ? 200 : status).json({
            success: false,
            message: error instanceof AnalysisError ? error.message : "Có lỗi xảy ra khi sửa CV",
            ...(error instanceof AnalysisError ? error.extra : {})
        });
    } finally {
        if (workDir) {
            await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
        }
    }
};
