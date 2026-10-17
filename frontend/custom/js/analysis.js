document.addEventListener(
    "DOMContentLoaded",
    async () => {
        await loadSidebarStats();
        initAnalysis();
    }
);


/* init */
function initAnalysis() {
    emptyResultHtml =
        document.querySelector(".analysis-result").innerHTML;

    const cvFile = document.getElementById("cvFile");

    const uploadBox = document.getElementById("uploadBox");

    const removeFile = document.getElementById("removeFile");

    const jobDescription = document.getElementById("jobDescription");

    const sampleJdBtn = document.getElementById("sampleJdBtn");

    const clearBtn = document.getElementById("clearBtn");

    const analyzeBtn = document.getElementById("analyzeBtn");

    /* chọn file */
    cvFile.addEventListener(
        "change",
        () => {
            if (!cvFile.files.length) {
                return;
            }

            handleFile(cvFile.files[0]);
        }
    );

    /* kéo file */
    uploadBox.addEventListener(
        "dragover",
        (event) => {
            event.preventDefault();

            uploadBox.classList.add(
                "dragging"
            );
        }
    );

    /* rời khỏi khu vực drop */
    uploadBox.addEventListener(
        "dragleave",
        () => {
            uploadBox.classList.remove(
                "dragging"
            );
        }
    );

    /* thả file */
    uploadBox.addEventListener(
        "drop",
        (event) => {
            event.preventDefault();

            uploadBox.classList.remove(
                "dragging"
            );

            const file =
                event.dataTransfer.files[0];

            if (!file) {
                return;
            }

            handleFile(file);
        }
    );

    /* xóa file */
    removeFile.addEventListener(
        "click",
        (event) => {
            event.preventDefault();

            removeSelectedFile();
        }
    );

    /* đếm ký tự jd */

    jobDescription.addEventListener(
        "input",
        updateCharacterCount
    );

    /* jd mẫu */

    sampleJdBtn.addEventListener(
        "click",
        loadSampleJD
    );

    document
        .getElementById("jobField")
        .addEventListener("change", refreshSampleJDIfUntouched);

    document
        .getElementById("level")
        .addEventListener("change", refreshSampleJDIfUntouched);

    /* xóa nội dung */

    clearBtn.addEventListener(
        "click",
        clearAnalysis
    );

    /* phân tích */

    analyzeBtn.addEventListener(
        "click",
        analyzeCV
    );
}


/* xử lý file */
function handleFile(file) {
    const fileInfo = document.getElementById("fileInfo");

    const fileName = document.getElementById("fileName");

    const fileSize = document.getElementById("fileSize");

    const uploadTitle = document.getElementById("uploadTitle");

    const cvFile = document.getElementById("cvFile");

    /* chỉ nhận pdf */
    if (file.type !== "application/pdf") {
        showMessage(
            "Vui lòng chọn file PDF."
        );

        return;
    }

    /* tối đa 10mb */
    if (file.size > 10 * 1024 * 1024) {
        showMessage(
            "File PDF không được vượt quá 10MB."
        );

        return;
    }

    /* gán file vào input */
    const dataTransfer = new DataTransfer();

    dataTransfer.items.add(file);

    cvFile.files = dataTransfer.files;

    /* hiển thị thông tin */
    fileName.textContent = file.name;

    fileSize.textContent = formatFileSize(file.size);

    uploadTitle.textContent = "Đã chọn file CV";

    fileInfo.classList.add(
        "show"
    );
}


/* xóa file */
function removeSelectedFile() {
    const cvFile = document.getElementById("cvFile");

    const fileInfo = document.getElementById("fileInfo");

    const uploadTitle = document.getElementById("uploadTitle");

    cvFile.value = "";

    fileInfo.classList.remove(
        "show"
    );

    uploadTitle.textContent = "Nhấn để chọn tệp CV (PDF)";
}


/* format dung lượng file */
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        bytes /
        1024 /
        1024
    ).toFixed(1)} MB`;
}


/* đếm ký tự */
function updateCharacterCount() {
    const jobDescription = document.getElementById(
        "jobDescription"
    );

    const charCount = document.getElementById(
        "charCount"
    );

    charCount.textContent = `${jobDescription.value.length} ký tự`;
}


/* jd mẫu: backend đọc từ it_15_job_positions.json theo ngành + cấp bậc đang chọn */
let lastSampleJd = "";

async function loadSampleJD() {
    const jobDescription = document.getElementById("jobDescription");
    const jobField = document.getElementById("jobField");
    const level = document.getElementById("level");
    const sampleJdBtn = document.getElementById("sampleJdBtn");

    sampleJdBtn.disabled = true;

    try {
        const query = new URLSearchParams({
            role: jobField.value,
            level: level.value
        });

        const response = await fetch(
            `${ANALYSIS_API_URL}/sample-jd?${query}`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Không lấy được JD mẫu.");
        }

        jobDescription.value = data.data.jd;
        lastSampleJd = data.data.jd;

        updateCharacterCount();
    } catch (error) {
        console.error("SAMPLE JD ERROR:", error);

        showMessage(
            error instanceof TypeError
                ? "Không kết nối được máy chủ. Hãy kiểm tra backend đã chạy chưa."
                : error.message
        );
    } finally {
        sampleJdBtn.disabled = false;
    }
}

/* đổi ngành/cấp bậc: nếu ô JD vẫn là JD mẫu chưa sửa thì tự cập nhật theo lựa chọn mới */
function refreshSampleJDIfUntouched() {
    const jobDescription = document.getElementById("jobDescription");

    if (lastSampleJd && jobDescription.value === lastSampleJd) {
        loadSampleJD();
    }
}


/* xóa toàn bộ nội dung */
function clearAnalysis() {
    const jobDescription = document.getElementById(
        "jobDescription"
    );

    const cvFile = document.getElementById(
        "cvFile"
    );

    const fileInfo = document.getElementById(
        "fileInfo"
    );

    const uploadTitle = document.getElementById(
        "uploadTitle"
    );

    /* xóa file */
    cvFile.value = "";

    fileInfo.classList.remove(
        "show"
    );

    uploadTitle.textContent =
        "Nhấn để chọn tệp CV (PDF)";

    /* xóa jd */
    jobDescription.value = "";

    /* reset số ký tự */
    updateCharacterCount();

    /* reset kết quả */
    resetResultPanel();
}


/* phân tích cv */

const ANALYSIS_API_URL = "http://localhost:3000/api/analysis";

const COMPONENT_LABELS = {
    skill: "Kỹ năng chuyên môn",
    soft_skill: "Kỹ năng mềm",
    tool: "Công cụ",
    language: "Ngoại ngữ / ngôn ngữ",
    education: "Học vấn",
    certification: "Chứng chỉ",
    experience: "Kinh nghiệm",
    responsibility: "Trách nhiệm công việc"
};

const PRIORITY_LABELS = {
    high: "Ưu tiên cao",
    medium: "Trung bình",
    low: "Thấp"
};

const EFFORT_LABELS = {
    low: "sửa nhanh",
    medium: "cần viết thêm",
    high: "cần học/làm thêm"
};

let emptyResultHtml = "";
let lastJobDescription = "";

async function analyzeCV(event, useOcr = false) {
    const cvFile = document.getElementById("cvFile");
    const jobDescription = document.getElementById("jobDescription");
    const level = document.getElementById("level");
    const jobField = document.getElementById("jobField");

    /* kiểm tra cv */
    if (!cvFile.files.length) {
        showMessage("Vui lòng tải CV dạng PDF.");
        return;
    }

    /* kiểm tra đăng nhập */
    const token = localStorage.getItem("token");

    if (!token) {
        showMessage("Vui lòng đăng nhập để phân tích CV.");

        setTimeout(() => {
            window.location.href = "../../auth/index.html";
        }, 1200);

        return;
    }

    /* JD không bắt buộc: bỏ trống thì so với khung năng lực chuẩn */
    const formData = new FormData();

    formData.append("cv", cvFile.files[0]);
    formData.append("jd", jobDescription.value.trim());
    formData.append("level", level.value);
    formData.append("role", jobField.value);
    formData.append("ocr", useOcr ? "1" : "0");

    lastJobDescription = jobDescription.value.trim();

    setAnalyzing(true);

    try {
        const response = await fetch(ANALYSIS_API_URL, {
            method: "POST",
            headers: {
                /* không tự đặt Content-Type: trình duyệt tự thêm boundary */
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            showMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

            setTimeout(() => {
                window.location.href = "../../auth/index.html";
            }, 1200);

            return;
        }

        /* PDF dạng ảnh: hỏi người dùng có đồng ý dùng AI đọc chữ không */
        if (data.code === "NO_TEXT" && data.canOcr && !useOcr) {
            const agree = window.confirm(
                "CV này là PDF dạng ảnh nên không có chữ để phân tích.\n\n" +
                "Dùng AI (Google Gemini) để đọc chữ từ ảnh?\n" +
                "File CV sẽ được gửi tới Google. Với gói miễn phí, Google " +
                "có thể dùng dữ liệu này để cải thiện sản phẩm."
            );

            if (agree) {
                await analyzeCV(null, true);
            } else {
                resetResultPanel();

                showMessage(
                    "Hãy xuất lại CV thành PDF có chữ (Export/Download as PDF) rồi thử lại."
                );
            }

            return;
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Không thể phân tích CV.");
        }

        renderAnalysisResult(data.data);
    } catch (error) {
        console.error("ANALYZE CV ERROR:", error);

        resetResultPanel();

        showMessage(
            error instanceof TypeError
                ? "Không kết nối được máy chủ. Hãy kiểm tra backend đã chạy chưa."
                : error.message
        );
    } finally {
        setAnalyzing(false);
    }
}


/* trạng thái đang phân tích */
function setAnalyzing(isAnalyzing) {
    const analyzeBtn = document.getElementById("analyzeBtn");
    const panel = document.querySelector(".analysis-result");

    analyzeBtn.disabled = isAnalyzing;

    if (isAnalyzing) {
        /* chỉ lưu nội dung gốc lần đầu (gọi lồng nhau khi OCR) */
        if (!analyzeBtn.dataset.html) {
            analyzeBtn.dataset.html = analyzeBtn.innerHTML;
        }

        analyzeBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Đang phân tích...';

        panel.innerHTML = `
            <div class="result-empty">
                <div class="result-icon">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                </div>
                <h2>Đang phân tích CV</h2>
                <p>Quá trình này có thể mất vài giây.</p>
            </div>
        `;
    } else if (analyzeBtn.dataset.html) {
        analyzeBtn.innerHTML = analyzeBtn.dataset.html;
        delete analyzeBtn.dataset.html;
    }
}


/* đưa panel kết quả về trạng thái ban đầu */
function resetResultPanel() {
    const panel = document.querySelector(".analysis-result");

    if (panel && emptyResultHtml) {
        panel.innerHTML = emptyResultHtml;
    }
}


/* escape để chèn text từ server vào HTML an toàn */
function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}


function chips(items) {
    return `<div class="skill-list">${items
        .map((item) => `<span>${esc(item)}</span>`)
        .join("")}</div>`;
}


/* hiển thị kết quả */
function renderAnalysisResult(data) {
    const panel = document.querySelector(".analysis-result");

    const result = data.result || {};
    const advice = data.advice || {};
    const target = result.target || {};
    const scoreInfo = result.score || {};

    const overall = Math.max(
        0,
        Math.min(100, Number(scoreInfo.overall) || 0)
    );

    const modeText =
        data.mode === "jd"
            ? "So khớp với JD"
            : "So với khung năng lực chuẩn";

    const levelText = target.level || data.input?.level || "";
    const roleText = target.role || data.input?.role || "";

    /* điểm từng nhóm */
    const activeKeys = scoreInfo.active_components || [];
    const components = scoreInfo.components || {};

    const componentRows = activeKeys
        .map((key) => {
            const value = Math.round(Number(components[key]) || 0);

            return `
                <div class="component-row">
                    <div class="component-top">
                        <span>${esc(COMPONENT_LABELS[key] || key)}</span>
                        <strong>${value}/100</strong>
                    </div>
                    <div class="progress-track">
                        <div class="progress-bar" style="width:${value}%"></div>
                    </div>
                </div>
            `;
        })
        .join("");

    /* cảnh báo */
    const warnings = (result.warnings || []).concat(advice.notes || []);

    if (data.ocr) {
        warnings.unshift(
            "CV này được AI đọc chữ từ ảnh nên có thể có sai sót nhỏ. " +
            "Dùng PDF có chữ sẽ cho kết quả chính xác hơn."
        );
    }

    /* khoảng thiếu */
    const gaps = result.gaps || [];

    const gapItems = gaps
        .map((gap) => {
            const tag =
                gap.gap === "missing" ? "thiếu" : "chưa đủ bằng chứng";

            return `<li>
                <strong>${esc(gap.item)}</strong>
                <em>${esc(COMPONENT_LABELS[gap.category] || gap.category)} · ${tag}</em>
            </li>`;
        })
        .join("");

    /* gợi ý chỉnh sửa */
    const suggestions = advice.suggestions || [];

    const suggestionItems = suggestions
        .map((item) => {
            const priority = PRIORITY_LABELS[item.priority] ? item.priority : "low";

            return `
                <div class="suggestion priority-${priority}">
                    <div class="suggestion-meta">
                        <span class="badge badge-${priority}">${PRIORITY_LABELS[priority]}</span>
                        <span>${esc(item.section)}</span>
                        <span>${esc(EFFORT_LABELS[item.effort] || "")}</span>
                    </div>
                    <p class="suggestion-issue">${esc(item.issue)}</p>
                    <p class="suggestion-fix">${esc(item.suggestion)}</p>
                    ${
                        item.example
                            ? `<p class="suggestion-example">Mẫu: ${esc(item.example)}</p>`
                            : ""
                    }
                </div>
            `;
        })
        .join("");

    /* từ khóa */
    const keywords = advice.keywords || {};

    const keywordGroups = [
        ["Đã có trong CV", keywords.already_in_cv],
        ["Thêm nếu bạn thật sự có", keywords.add_if_you_really_have_it],
        ["Cần học trước khi ghi vào CV", keywords.learn_first_then_add]
    ]
        .filter(([, list]) => Array.isArray(list) && list.length)
        .map(
            ([title, list]) => `
                <p class="keyword-title">${esc(title)}</p>
                ${chips(list)}
            `
        )
        .join("");

    /* viết lại bullet */
    const rewrites = advice.bullet_rewrites || [];

    const rewriteItems = rewrites
        .map(
            (item, index) => `
                <details class="rewrite" data-index="${index}">
                    <summary>${esc(item.source || item.section)}</summary>
                    <p><strong>Hiện tại:</strong> ${esc(item.original)}</p>
                    ${
                        (item.issues || []).length
                            ? `<ul>${item.issues
                                  .map((issue) => `<li>${esc(issue)}</li>`)
                                  .join("")}</ul>`
                            : ""
                    }
                    <div class="rewrite-draft">
                        <p><strong>Gợi ý:</strong> ${esc(item.draft)}</p>
                    </div>
                </details>
            `
        )
        .join("");

    panel.innerHTML = `
        <div class="result-content">
            <div class="result-header">
                <div>
                    <div class="result-small-title">${esc(modeText.toUpperCase())}</div>
                    <h2>${esc(roleText)}</h2>
                </div>
                <div class="match-score">${Math.round(overall)}/100</div>
            </div>

            <div class="progress-wrapper">
                <div class="progress-track">
                    <div class="progress-bar" id="overallBar" style="width:0%"></div>
                </div>
            </div>

            <div class="result-info">
                <div class="result-info-item">
                    <span>Cấp bậc mục tiêu</span>
                    <strong>${esc(levelText)}</strong>
                </div>
                <div class="result-info-item">
                    <span>Khoảng thiếu</span>
                    <strong>${gaps.length}</strong>
                </div>
            </div>

            ${
                result.analysis
                    ? `<p class="result-summary">${esc(result.analysis)}</p>`
                    : ""
            }

            ${
                warnings.length
                    ? `<div class="result-warning">${warnings
                          .map((text) => `<p>${esc(text)}</p>`)
                          .join("")}</div>`
                    : ""
            }

            ${
                data.ocrText
                    ? `<details class="ocr-preview">
                           <summary>Xem văn bản AI đọc được từ ảnh</summary>
                           <p class="ai-note">
                               Nếu có chỗ đọc sai, điểm có thể lệch. Hãy dùng PDF có chữ để chính xác hơn.
                           </p>
                           <pre>${esc(data.ocrText)}</pre>
                       </details>`
                    : ""
            }

            ${
                componentRows
                    ? `<div class="result-section">
                           <h3>Điểm theo nhóm</h3>
                           ${componentRows}
                       </div>`
                    : ""
            }

            ${
                gapItems
                    ? `<div class="result-section">
                           <h3>Cần bổ sung</h3>
                           <ul class="gap-list">${gapItems}</ul>
                       </div>`
                    : ""
            }

            ${
                suggestionItems
                    ? `<div class="result-section">
                           <h3>Gợi ý chỉnh sửa CV${
                               advice.headline
                                   ? ` <small>${esc(advice.headline)}</small>`
                                   : ""
                           }</h3>
                           ${suggestionItems}
                       </div>`
                    : ""
            }

            ${
                keywordGroups
                    ? `<div class="result-section">
                           <h3>Từ khóa</h3>
                           ${keywordGroups}
                       </div>`
                    : ""
            }

            ${
                rewriteItems
                    ? `<div class="result-section">
                           <h3>Gợi ý viết lại mô tả</h3>
                           <div class="ai-box">
                               <button type="button" class="btn-ai" id="aiRewriteBtn">
                                   <i class="fa-solid fa-wand-magic-sparkles"></i>
                                   Viết lại bằng AI
                               </button>
                               <button type="button" class="btn-ai" id="aiFixPdfBtn">
                                   <i class="fa-solid fa-file-pdf"></i>
                                   AI tự sửa vào PDF
                               </button>
                               <div id="aiFixResult"></div>
                               <p class="ai-note">
                                   Các mô tả (và JD nếu có) sẽ được gửi tới Google Gemini.
                                   Với gói miễn phí, Google có thể dùng dữ liệu này để cải thiện sản phẩm.
                               </p>
                           </div>
                           ${rewriteItems}
                       </div>`
                    : ""
            }
        </div>
    `;

    /* nút viết lại bằng AI */
    const aiButton = document.getElementById("aiRewriteBtn");

    if (aiButton) {
        aiButton.addEventListener("click", () => rewriteWithAI(rewrites));
    }

    const fixButton = document.getElementById("aiFixPdfBtn");

    if (fixButton) {
        fixButton.addEventListener("click", () => fixPdfWithAgent());
    }

    /* chạy hiệu ứng thanh điểm */
    requestAnimationFrame(() => {
        const bar = document.getElementById("overallBar");

        if (bar) {
            bar.style.width = `${overall}%`;
        }
    });

    panel.scrollIntoView({ behavior: "smooth", block: "start" });
}


/* viết lại mô tả bằng AI (Gemini) */
async function rewriteWithAI(rewrites) {
    const aiButton = document.getElementById("aiRewriteBtn");
    const token = localStorage.getItem("token");

    if (!token) {
        showMessage("Vui lòng đăng nhập lại.");
        return;
    }

    /* server chỉ nhận tối đa 5 mô tả, mỗi mô tả tối đa 600 ký tự */
    const items = rewrites
        .map((item, index) => ({
            id: `b${index}`,
            text: String(item.original || "").slice(0, 600),
            issues: item.issues || []
        }))
        .filter((item) => item.text.trim())
        .slice(0, 5);

    if (!items.length) {
        showMessage("Không có mô tả nào để viết lại.");
        return;
    }

    const originalHtml = aiButton.innerHTML;

    aiButton.disabled = true;
    aiButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> AI đang viết lại...';

    try {
        const response = await fetch(`${ANALYSIS_API_URL}/rewrite`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                bullets: items,
                jd: lastJobDescription
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Không thể viết lại bằng AI.");
        }

        const aiRewrites = data.data.rewrites || {};
        const rejected = data.data.rejected || [];

        items.forEach((item) => {
            const index = item.id.slice(1);
            const draftBox = document.querySelector(
                `.rewrite[data-index="${index}"] .rewrite-draft`
            );

            if (!draftBox) return;

            if (aiRewrites[item.id]) {
                draftBox.innerHTML = `
                    <p><strong>Gợi ý (AI):</strong></p>
                    <ul class="ai-bullets">
                        ${aiRewrites[item.id]
                            .map((line) => `<li>${esc(line)}</li>`)
                            .join("")}
                    </ul>
                `;
            } else if (rejected.includes(item.id)) {
                draftBox.insertAdjacentHTML(
                    "beforeend",
                    `<p class="ai-note">AI đề xuất số liệu không có trong CV,
                     nên giữ bản gợi ý theo quy tắc.</p>`
                );
            }
        });

        aiButton.innerHTML =
            '<i class="fa-solid fa-rotate"></i> Viết lại lần nữa';
    } catch (error) {
        console.error("AI REWRITE ERROR:", error);

        aiButton.innerHTML = originalHtml;

        showMessage(
            error instanceof TypeError
                ? "Không kết nối được máy chủ."
                : error.message
        );
    } finally {
        aiButton.disabled = false;
    }
}


/* thông báo */
function showMessage(message) {
    const toastArea = document.getElementById(
        "toastArea"
    );

    if (!toastArea) {
        alert(message);
        return;
    }

    const toast = document.createElement(
        "div"
    );

    toast.className = "analysis-toast";

    toast.textContent = message;

    toastArea.appendChild(
        toast
    );

    setTimeout(
        () => {
            toast.classList.add(
                "hide"
            );

            setTimeout(
                () => {
                    toast.remove();
                },
                300
            );
        },
        2500
    );
}


/* CV Agent: AI tự sửa thẳng vào file PDF */
async function fixPdfWithAgent(useOcr = false) {
    const button = document.getElementById("aiFixPdfBtn");
    const box = document.getElementById("aiFixResult");
    const cvFile = document.getElementById("cvFile");
    const token = localStorage.getItem("token");

    if (!token) {
        showMessage("Vui lòng đăng nhập lại.");
        return;
    }

    if (!cvFile.files.length) {
        showMessage("Không còn file CV, vui lòng tải lại CV.");
        return;
    }

    const formData = new FormData();

    formData.append("cv", cvFile.files[0]);
    formData.append("jd", lastJobDescription);
    formData.append("level", document.getElementById("level").value);
    formData.append("role", document.getElementById("jobField").value);
    formData.append("mode", "auto");
    formData.append("ocr", useOcr === true ? "1" : "0");

    button.disabled = true;
    box.textContent = "Agent đang sửa PDF, có thể mất tới 1 phút...";

    try {
        const response = await fetch(`${ANALYSIS_API_URL}/fix`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const data = await response.json();

        /* PDF dạng ảnh: xin đồng ý dùng AI đọc chữ rồi dựng lại CV sửa được */
        if (data.code === "NO_TEXT" && data.canOcr && useOcr !== true) {
            const agree = window.confirm(
                "CV này là PDF dạng ảnh nên chưa sửa trực tiếp được.\n\n" +
                "Dùng AI (Google Gemini) đọc chữ từ ảnh rồi dựng lại CV thành PDF có chữ (sửa được)?\n" +
                "File CV sẽ được gửi tới Google. Bố cục CV mới sẽ khác bản gốc."
            );

            if (agree) {
                button.disabled = false;
                return fixPdfWithAgent(true);
            }

            box.textContent = "Hãy xuất lại CV thành PDF có chữ (Export/Download as PDF) rồi thử lại.";
            return;
        }

        if (!data.success) {
            box.textContent = data.message || "Không sửa được CV.";
            return;
        }

        const r = data.data;
        const lines = [];

        if (r.pdfBase64) {
            const bytes = Uint8Array.from(atob(r.pdfBase64), (c) => c.charCodeAt(0));
            const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));

            lines.push(
                `<p><a href="${url}" download="${esc(r.fileName)}" target="_blank">` +
                `Tải CV đã sửa (${r.applied.length} đoạn, ` +
                `${r.mode === "inplace" ? "sửa tại chỗ" : "dựng lại bố cục"})</a></p>`
            );
        }

        if (r.applied.length) {
            lines.push(
                "<p><strong>Đã sửa:</strong></p><ul>" +
                r.applied.map((a) =>
                    `<li><s>${esc(a.original)}</s><br>${esc((a.new || []).join(" / "))}</li>`
                ).join("") + "</ul>"
            );
        }

        if (r.failed.length) {
            lines.push(`<p>${r.failed.length} đoạn không sửa được (không tìm thấy hoặc không vừa khung).</p>`);
        }

        if (r.pending.length) {
            lines.push(
                "<p><strong>Cần bạn điền số liệu thật trước khi sửa:</strong></p><ul>" +
                r.pending.map((p) =>
                    `<li>${esc(p.original)}<br>→ ${esc((p.draft || []).join(" / "))}</li>`
                ).join("") + "</ul>"
            );
        }

        (r.notes || []).forEach((note) => lines.push(`<p><em>${esc(note)}</em></p>`));

        box.innerHTML = lines.join("") || "Không có gì để sửa.";
    } catch {
        box.textContent = "Không kết nối được máy chủ.";
    } finally {
        button.disabled = false;
    }
}
