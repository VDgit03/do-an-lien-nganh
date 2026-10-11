import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    AnalysisError,
    VALID_LEVELS,
    VALID_ROLES
} from "./analysisService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATASET_PATH = path.resolve(
    __dirname,
    "../../ai_cv/it_15_job_positions.json"
);

// Giá trị <option> ở frontend -> job_title trong it_15_job_positions.json
const ROLE_TO_JOB_TITLE = {
    frontend: "Frontend Developer",
    backend: "Backend Developer",
    mobile: "Mobile App Developer",
    "ai-ml": "AI/Machine Learning Engineer",
    "data-scientist": "Data Scientist",
    "data-engineer": "Data Engineer",
    devops: "DevOps Engineer",
    cloud: "Cloud Engineer",
    cybersecurity: "Cybersecurity Engineer",
    "qa-qc": "QA/QC Engineer",
    "system-admin": "System Administrator",
    network: "Network Engineer",
    "ui-ux": "UI/UX Designer",
    ba: "Business Analyst",
    dba: "Database Administrator"
};

let jobsByTitle = null;

// Đọc file một lần rồi giữ trong bộ nhớ
const loadJobs = async () => {
    if (jobsByTitle) {
        return jobsByTitle;
    }

    let dataset;

    try {
        dataset = JSON.parse(await fs.readFile(DATASET_PATH, "utf8"));
    } catch (error) {
        console.error("SAMPLE JD DATASET ERROR:", error);
        throw new AnalysisError("Không đọc được dữ liệu JD mẫu.", 500);
    }

    jobsByTitle = new Map(
        (dataset.jobs || []).map((job) => [job.job_title, job])
    );

    return jobsByTitle;
};

const asList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const bullet = (text) => `- ${text}`;

const LEVEL_LABELS = {
    intern: "Intern",
    fresher: "Fresher",
    junior: "Junior",
    middle: "Middle",
    senior: "Senior",
    manager: "Manager"
};

// Mỗi job trong file chỉ có MỘT cấp (thường là Fresher). Để có đủ 6 cấp bậc,
// danh sách kỹ năng/trách nhiệm được co giãn theo "độ rộng" của cấp đích
// so với cấp gốc, rồi bổ sung các yêu cầu đặc trưng của cấp đó.
const LEVEL_SCOPE = {
    intern: 0.4,
    fresher: 0.6,
    junior: 0.8,
    middle: 1,
    senior: 1,
    manager: 1
};

const MIN_ITEMS = 3;

const LEVEL_PROFILES = {
    intern: {
        education: "Sinh viên Cao đẳng / Đại học (năm 3 trở lên) hoặc mới tốt nghiệp",
        experience: () => "Không yêu cầu kinh nghiệm, ưu tiên có đồ án hoặc project cá nhân liên quan.",
        extraResponsibilities: ["Thực hiện các nhiệm vụ được giao dưới sự hướng dẫn của mentor"],
        extraRequirements: ["Ham học hỏi, có khả năng tự học nhanh"],
        extraPreferred: [],
        keepCertifications: false
    },
    fresher: {
        experience: () => "Dưới 1 năm kinh nghiệm hoặc đã có đồ án/thực tập liên quan.",
        extraResponsibilities: [],
        extraRequirements: [],
        extraPreferred: [],
        keepCertifications: true
    },
    junior: {
        experience: (title) => `Có từ 1 đến 2 năm kinh nghiệm ở vị trí ${title} hoặc tương đương.`,
        extraResponsibilities: ["Chủ động hoàn thành các nhiệm vụ được giao đúng tiến độ"],
        extraRequirements: [],
        extraPreferred: [],
        keepCertifications: true
    },
    middle: {
        experience: (title) => `Có từ 3 năm kinh nghiệm ở vị trí ${title} hoặc tương đương.`,
        extraResponsibilities: [
            "Thiết kế giải pháp và xử lý các vấn đề kỹ thuật phức tạp",
            "Review công việc và hỗ trợ các thành viên junior"
        ],
        extraRequirements: ["Có khả năng làm việc độc lập và hướng dẫn thành viên mới"],
        extraPreferred: [],
        keepCertifications: true
    },
    senior: {
        experience: (title) => `Có từ 5 năm kinh nghiệm ở vị trí ${title} hoặc tương đương.`,
        extraResponsibilities: [
            "Chịu trách nhiệm thiết kế và định hướng kỹ thuật cho dự án",
            "Đánh giá rủi ro, tối ưu hệ thống và chất lượng giải pháp",
            "Mentor và phát triển đội ngũ"
        ],
        extraRequirements: [
            "Có kinh nghiệm dẫn dắt kỹ thuật hoặc mentor thành viên khác",
            "Có tư duy thiết kế hệ thống và ra quyết định kỹ thuật"
        ],
        extraPreferred: [],
        keepCertifications: true
    },
    manager: {
        experience: (title) =>
            `Có từ 7 năm kinh nghiệm chuyên môn ${title}, trong đó ít nhất 2 năm quản lý nhóm.`,
        extraResponsibilities: [
            "Quản lý, đánh giá và phát triển đội ngũ",
            "Lập kế hoạch, phân bổ nguồn lực và quản lý tiến độ delivery",
            "Làm việc với các bên liên quan để định hướng chiến lược kỹ thuật"
        ],
        extraRequirements: [
            "Có kinh nghiệm quản lý nhóm và quản lý rủi ro dự án",
            "Kỹ năng lãnh đạo, đàm phán và giải quyết xung đột"
        ],
        extraPreferred: [],
        keepCertifications: true
    }
};

const levelKey = (label) => String(label || "").trim().toLowerCase();

// Giữ lại phần đầu danh sách theo tỷ lệ (tối thiểu MIN_ITEMS phần tử)
const scale = (items, ratio) => {
    const list = asList(items);

    if (ratio >= 1 || list.length <= MIN_ITEMS) {
        return list;
    }

    return list.slice(0, Math.max(MIN_ITEMS, Math.round(list.length * ratio)));
};

// Ghép các trường của một job thành văn bản JD cho cấp bậc `level`, dùng đúng
// các đề mục ("Mô tả công việc", "Yêu cầu", "Ưu tiên") mà jd_processor.py nhận diện.
const formatJd = (job, level) => {
    const profile = LEVEL_PROFILES[level];
    const baseLevel = levelKey(job.job_level);
    const isBaseLevel = baseLevel === level;
    const ratio = Math.min(
        1,
        LEVEL_SCOPE[level] / (LEVEL_SCOPE[baseLevel] || LEVEL_SCOPE.fresher)
    );

    const requirements = job.requirements || {};
    const skills = requirements.skills || {};
    const experience = requirements.experience || {};

    const lines = [`${job.job_title} - ${LEVEL_LABELS[level]}`, ""];

    lines.push("Mô tả công việc:", "");

    if (job.job_description?.summary) {
        lines.push(job.job_description.summary, "");
    }

    [
        ...scale(job.job_description?.responsibilities, ratio),
        ...profile.extraResponsibilities
    ].forEach((item) => lines.push(bullet(item)));

    lines.push("", "Yêu cầu:", "");

    const education = profile.education
        ? [profile.education]
        : asList(requirements.education);

    if (education.length) {
        lines.push(bullet(`Học vấn: ${education.join(" / ")}`));
    }

    // Đúng cấp gốc thì dùng mô tả kinh nghiệm của file dữ liệu
    lines.push(
        bullet(
            isBaseLevel && experience.description
                ? experience.description
                : profile.experience(job.job_title)
        )
    );

    [
        ["Kỹ năng chuyên môn", scale(skills.technical, ratio)],
        ["Công cụ", scale(skills.tools, ratio)],
        ["Ngôn ngữ", asList(skills.languages)],
        ["Kỹ năng mềm", scale(skills.soft, ratio)],
        [
            "Chứng chỉ",
            profile.keepCertifications ? asList(requirements.certifications) : []
        ]
    ].forEach(([label, items]) => {
        if (items.length) {
            lines.push(bullet(`${label}: ${items.join(", ")}`));
        }
    });

    profile.extraRequirements.forEach((item) => lines.push(bullet(item)));

    const preferred = [
        ...scale(job.preferred_qualifications, ratio),
        ...profile.extraPreferred
    ];

    if (preferred.length) {
        lines.push("", "Ưu tiên:", "");
        preferred.forEach((item) => lines.push(bullet(item)));
    }

    return lines.join("\n");
};

/**
 * Trả JD mẫu cho một ngành, lấy từ it_15_job_positions.json.
 * @param {string} role  giá trị trong VALID_ROLES
 * @param {string} level giá trị trong VALID_LEVELS (mặc định fresher)
 * @returns {Promise<{role: string, title: string, level: string, jd: string}>}
 */
export const getSampleJd = async (role, level = "fresher") => {
    if (!VALID_ROLES.includes(role) || !ROLE_TO_JOB_TITLE[role]) {
        throw new AnalysisError("Ngành CNTT không hợp lệ.", 400);
    }

    if (!VALID_LEVELS.includes(level) || !LEVEL_PROFILES[level]) {
        throw new AnalysisError("Cấp bậc không hợp lệ.", 400);
    }

    const jobs = await loadJobs();
    const job = jobs.get(ROLE_TO_JOB_TITLE[role]);

    if (!job) {
        throw new AnalysisError("Chưa có JD mẫu cho ngành này.", 404);
    }

    return {
        role,
        title: job.job_title,
        level,
        jd: formatJd(job, level)
    };
};