import { AnalysisError } from "../../services/analysis/analysisService.js";
import { rewriteBulletsWithGemini } from "../../services/analysis/geminiService.js";

const MAX_BULLETS = 5;
const MAX_BULLET_LENGTH = 600;
const MAX_JD_LENGTH = 6000;

// Giới hạn chi phí: mỗi người dùng tối đa 10 lượt / 10 phút (trong bộ nhớ)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;
const history = new Map();

const isRateLimited = (userId) => {
    const now = Date.now();
    const recent = (history.get(userId) || []).filter((t) => now - t < WINDOW_MS);

    if (recent.length >= MAX_REQUESTS) {
        history.set(userId, recent);
        return true;
    }

    recent.push(now);
    history.set(userId, recent);
    return false;
};

// POST /api/analysis/rewrite   (JSON)
//   bullets: [{ id, text, issues: string[] }]   (1..5 mục)
//   jd     : nội dung JD (tuỳ chọn)
export const rewriteBullets = async (req, res) => {
    try {
        const { bullets, jd } = req.body || {};

        if (!Array.isArray(bullets) || bullets.length === 0) {
            throw new AnalysisError("Không có mô tả nào để viết lại.", 400);
        }

        if (bullets.length > MAX_BULLETS) {
            throw new AnalysisError(
                `Chỉ viết lại tối đa ${MAX_BULLETS} mô tả mỗi lần.`,
                400
            );
        }

        const cleaned = bullets.map((item) => {
            const id = String(item?.id ?? "").trim();
            const text = String(item?.text ?? "").trim();

            if (!id || !text) {
                throw new AnalysisError("Dữ liệu mô tả không hợp lệ.", 400);
            }

            if (text.length > MAX_BULLET_LENGTH) {
                throw new AnalysisError(
                    `Mỗi mô tả tối đa ${MAX_BULLET_LENGTH} ký tự.`,
                    400
                );
            }

            return {
                id,
                text,
                problems: (Array.isArray(item.issues) ? item.issues : [])
                    .map((value) => String(value).slice(0, 200))
                    .slice(0, 10)
            };
        });

        const jdText = String(jd ?? "").trim();

        if (jdText.length > MAX_JD_LENGTH) {
            throw new AnalysisError(
                `JD không được vượt quá ${MAX_JD_LENGTH} ký tự.`,
                400
            );
        }

        if (isRateLimited(req.userId)) {
            throw new AnalysisError(
                "Bạn đã dùng AI quá nhiều lần, vui lòng thử lại sau ít phút.",
                429
            );
        }

        const result = await rewriteBulletsWithGemini(cleaned, jdText);

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        const status = error instanceof AnalysisError ? error.statusCode : 500;

        if (status >= 500 && !(error instanceof AnalysisError)) {
            console.error("REWRITE ERROR:", error);
        }

        return res.status(status).json({
            success: false,
            message:
                error instanceof AnalysisError
                    ? error.message
                    : "Có lỗi xảy ra khi viết lại bằng AI"
        });
    }
};
