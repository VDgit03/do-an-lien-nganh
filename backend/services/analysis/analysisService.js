import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AI_CV_DIR = path.resolve(__dirname, "../../ai_cv");
const SCRIPT_PATH = path.join(AI_CV_DIR, "analyze_cv.py");

// Có thể đổi bằng PYTHON_BIN trong .env (vd: py, python3.12, đường dẫn venv)
const PYTHON_BIN =
    process.env.PYTHON_BIN ||
    (process.platform === "win32" ? "python" : "python3");

const TIMEOUT_MS = Number(process.env.AI_CV_TIMEOUT_MS) || 60000;
const MAX_CONCURRENT = Number(process.env.AI_CV_MAX_CONCURRENT) || 2;

// Phải khớp với <option> trong frontend/custom/analysis/analysis.html
export const VALID_LEVELS = [
    "intern",
    "fresher",
    "junior",
    "middle",
    "senior",
    "manager"
];

export const VALID_ROLES = [
    "frontend",
    "backend",
    "mobile",
    "ai-ml",
    "data-scientist",
    "data-engineer",
    "devops",
    "cloud",
    "cybersecurity",
    "qa-qc",
    "system-admin",
    "network",
    "ui-ux",
    "ba",
    "dba"
];

export class AnalysisError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = "AnalysisError";
        this.statusCode = statusCode;
    }
}

let running = 0;

/**
 * Chạy pipeline AI_CV (Python) cho một file PDF.
 *
 * @param {object} options
 * @param {string} options.pdfPath  đường dẫn file PDF tạm
 * @param {string} [options.jdPath] đường dẫn file JD (.txt, UTF-8) - bỏ trống
 *                                  thì so với career framework
 * @param {string} options.role     giá trị trong VALID_ROLES
 * @param {string} options.level    giá trị trong VALID_LEVELS
 */
export const runCVAnalysis = ({ pdfPath, jdPath, role, level }) => {
    if (running >= MAX_CONCURRENT) {
        return Promise.reject(
            new AnalysisError(
                "Hệ thống đang phân tích nhiều CV, vui lòng thử lại sau ít phút.",
                503
            )
        );
    }

    const args = [
        SCRIPT_PATH,
        "--pdf", pdfPath,
        "--role", role,
        "--level", level
    ];

    if (jdPath) {
        args.push("--jd-file", jdPath);
    }

    running += 1;

    return new Promise((resolve, reject) => {
        const child = spawn(PYTHON_BIN, args, {
            cwd: AI_CV_DIR,
            env: {
                ...process.env,
                PYTHONIOENCODING: "utf-8",
                PYTHONUTF8: "1"
            },
            windowsHide: true
        });

        let stdout = "";
        let stderr = "";
        let timedOut = false;
        let finished = false;

        const finish = (fn, value) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            running -= 1;
            fn(value);
        };

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, TIMEOUT_MS);

        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");

        child.stdout.on("data", (chunk) => {
            stdout += chunk;
        });

        child.stderr.on("data", (chunk) => {
            stderr += chunk;
        });

        child.on("error", (error) => {
            const message =
                error.code === "ENOENT"
                    ? `Không tìm thấy Python ("${PYTHON_BIN}"). Hãy cài Python hoặc đặt PYTHON_BIN trong .env.`
                    : `Không chạy được module phân tích: ${error.message}`;

            finish(reject, new AnalysisError(message, 500));
        });

        child.on("close", (code) => {
            if (timedOut) {
                return finish(
                    reject,
                    new AnalysisError(
                        "Phân tích CV mất quá nhiều thời gian. Vui lòng thử lại.",
                        504
                    )
                );
            }

            // Python in đúng 1 dòng JSON ở cuối stdout
            const lastLine = stdout
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .pop();

            let payload = null;

            try {
                payload = lastLine ? JSON.parse(lastLine) : null;
            } catch {
                payload = null;
            }

            if (!payload) {
                console.error("AI_CV stderr:", stderr);
                return finish(
                    reject,
                    new AnalysisError(
                        "Module phân tích không trả về kết quả hợp lệ.",
                        500
                    )
                );
            }

            if (payload.success) {
                return finish(resolve, payload);
            }

            // exit code 2 = lỗi do dữ liệu người dùng (PDF scan, role sai...)
            if (code !== 2) {
                console.error("AI_CV stderr:", stderr);
            }

            finish(
                reject,
                new AnalysisError(
                    payload.error || "Không thể phân tích CV.",
                    code === 2 ? 422 : 500
                )
            );
        });
    });
};
