import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    AnalysisError,
    VALID_LEVELS,
    VALID_ROLES
} from "./analysisService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 15 ngành x 6 cấp bậc, JD đã soạn sẵn và cố định (sửa trực tiếp trong file này).
const DATASET_PATH = path.resolve(__dirname, "../../ai_cv/sample_jds.json");

const LEVEL_LABELS = {
    intern: "Intern",
    fresher: "Fresher",
    junior: "Junior",
    middle: "Middle",
    senior: "Senior",
    manager: "Manager"
};

let roles = null;

// Đọc file một lần rồi giữ trong bộ nhớ
const loadRoles = async () => {
    if (roles) {
        return roles;
    }

    try {
        const dataset = JSON.parse(await fs.readFile(DATASET_PATH, "utf8"));
        roles = dataset.roles || {};
    } catch (error) {
        console.error("SAMPLE JD DATASET ERROR:", error);
        throw new AnalysisError("Không đọc được dữ liệu JD mẫu.", 500);
    }

    return roles;
};

const asList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const bullet = (text) => `- ${text}`;

// Ghép một JD thành văn bản, dùng đúng các đề mục ("Mô tả công việc", "Yêu cầu",
// "Ưu tiên") mà jd_processor.py nhận diện.
const formatJd = (title, level, jd) => {
    const lines = [`${title} - ${LEVEL_LABELS[level]}`, ""];

    lines.push("Mô tả công việc:", "");

    if (jd.summary) {
        lines.push(jd.summary, "");
    }

    asList(jd.responsibilities).forEach((item) => lines.push(bullet(item)));

    lines.push("", "Yêu cầu:", "");
    asList(jd.requirements).forEach((item) => lines.push(bullet(item)));

    const preferred = asList(jd.preferred);

    if (preferred.length) {
        lines.push("", "Ưu tiên:", "");
        preferred.forEach((item) => lines.push(bullet(item)));
    }

    return lines.join("\n");
};

/**
 * Trả JD mẫu cho một ngành + cấp bậc, lấy từ ai_cv/sample_jds.json.
 * @param {string} role  giá trị trong VALID_ROLES
 * @param {string} level giá trị trong VALID_LEVELS (mặc định fresher)
 * @returns {Promise<{role: string, title: string, level: string, jd: string}>}
 */
export const getSampleJd = async (role, level = "fresher") => {
    if (!VALID_ROLES.includes(role)) {
        throw new AnalysisError("Ngành CNTT không hợp lệ.", 400);
    }

    if (!VALID_LEVELS.includes(level)) {
        throw new AnalysisError("Cấp bậc không hợp lệ.", 400);
    }

    const data = await loadRoles();
    const entry = data[role];
    const jd = entry?.levels?.[level];

    if (!jd) {
        throw new AnalysisError("Chưa có JD mẫu cho ngành và cấp bậc này.", 404);
    }

    return {
        role,
        title: entry.title,
        level,
        jd: formatJd(entry.title, level, jd)
    };
};
