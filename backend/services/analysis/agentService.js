import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AnalysisError } from "./analysisService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_CV_DIR = path.resolve(__dirname, "../../ai_cv");

const PYTHON_BIN =
    process.env.PYTHON_BIN ||
    (process.platform === "win32" ? "python" : "python3");

const TIMEOUT_MS = Number(process.env.AI_CV_TIMEOUT_MS) || 60000;

// "draft" = không ghi PDF, chỉ trả bản nháp CV (JSON) để người dùng chọn mẫu / sửa tay
export const AGENT_MODES = ["auto", "inplace", "rebuild", "draft"];

/**
 * Chạy một script Python trong ai_cv, đọc đúng một dòng JSON cuối stdout.
 * @param {string} scriptName tên file .py
 * @param {string[]} args
 * @param {{name: string, timeoutMessage: string}} labels
 */
const runPython = (scriptName, args, { name, timeoutMessage }) =>
    new Promise((resolve, reject) => {
        const child = spawn(
            PYTHON_BIN,
            [path.join(AI_CV_DIR, scriptName), ...args],
            {
                cwd: AI_CV_DIR,
                env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
                windowsHide: true
            }
        );

        let stdout = "";
        let stderr = "";
        let timedOut = false;
        let finished = false;

        const finish = (fn, value) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            fn(value);
        };

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, TIMEOUT_MS);

        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");
        child.stdout.on("data", (chunk) => { stdout += chunk; });
        child.stderr.on("data", (chunk) => { stderr += chunk; });

        child.on("error", (error) => {
            finish(
                reject,
                new AnalysisError(
                    error.code === "ENOENT"
                        ? `Không tìm thấy Python ("${PYTHON_BIN}"). Hãy cài Python hoặc đặt PYTHON_BIN trong .env.`
                        : `Không chạy được ${name}: ${error.message}`,
                    500
                )
            );
        });

        child.on("close", (code) => {
            if (timedOut) {
                return finish(reject, new AnalysisError(timeoutMessage, 504));
            }

            const lastLine = stdout.split("\n").map((l) => l.trim()).filter(Boolean).pop();
            let payload = null;

            try {
                payload = lastLine ? JSON.parse(lastLine) : null;
            } catch {
                payload = null;
            }

            if (!payload) {
                console.error(`${name} stderr:`, stderr);
                return finish(reject, new AnalysisError(`${name} không trả về kết quả hợp lệ.`, 500));
            }

            if (payload.success) {
                return finish(resolve, payload);
            }

            if (code !== 2) {
                console.error(`${name} stderr:`, stderr);
            }

            finish(reject, new AnalysisError(payload.error || `${name} không xử lý được CV.`, code === 2 ? 422 : 500));
        });
    });

const sourceArgs = ({ pdfPath, textPath }) =>
    textPath ? ["--text-file", textPath] : ["--pdf", pdfPath];

/**
 * Chạy CV Agent (Python): áp dụng `changes` thẳng vào PDF, ghi ra outPath.
 * @param {{pdfPath?: string, textPath?: string, changesPath: string, outPath: string, mode: string}} options
 *   textPath: văn bản CV đã OCR (PDF ảnh) -> chỉ dựng lại, không sửa tại chỗ
 * @returns {Promise<{mode_used: string|null, applied: object[], failed: object[], notes: string[]}>}
 */
export const runCVAgent = ({ pdfPath, textPath, changesPath, outPath, mode }) =>
    runPython(
        "cv_agent.py",
        [...sourceArgs({ pdfPath, textPath }), "--changes", changesPath, "--out", outPath, "--mode", mode],
        { name: "CV Agent", timeoutMessage: "CV Agent chạy quá lâu. Vui lòng thử lại." }
    );

/**
 * Dựng bản nháp CV (structured_cv đã thay bullet) để frontend xem trước / sửa tay.
 * @returns {Promise<{cv: object, applied: object[], failed: object[]}>}
 */
export const runCVDraft = ({ pdfPath, textPath, changesPath }) =>
    runPython(
        "cv_draft.py",
        [...sourceArgs({ pdfPath, textPath }), "--changes", changesPath],
        { name: "CV Draft", timeoutMessage: "Dựng bản nháp CV quá lâu. Vui lòng thử lại." }
    );
