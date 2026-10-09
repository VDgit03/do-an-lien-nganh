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
        useSampleJD
    );

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


/* jd mẫu */
function useSampleJD() {
    const jobDescription = document.getElementById(
        "jobDescription"
    );

    const sampleJD = `
        Frontend Developer - Junior

        Mô tả công việc:

        - Phát triển và bảo trì giao diện website.
        - Xây dựng giao diện bằng HTML, CSS và JavaScript.
        - Làm việc với React.js.
        - Kết nối và sử dụng REST API.
        - Tối ưu giao diện trên nhiều thiết bị.
        - Phối hợp với Backend Developer và UI/UX Designer.

        Yêu cầu:

        - Có kiến thức về HTML, CSS, JavaScript.
        - Có kiến thức về React.js.
        - Hiểu cơ bản về REST API.
        - Biết sử dụng Git/GitHub.
        - Có khả năng làm việc nhóm.
        - Có tư duy logic và giải quyết vấn đề.
    `.trim();

    jobDescription.value = sampleJD;

    updateCharacterCount();
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
    language: "Ngôn ngữ lập trình",
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

async function analyzeCV() {
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
        analyzeBtn.dataset.html = analyzeBtn.innerHTML;

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
            (item) => `
                <details class="rewrite">
                    <summary>${esc(item.source || item.section)}</summary>
                    <p><strong>Hiện tại:</strong> ${esc(item.original)}</p>
                    ${
                        (item.issues || []).length
                            ? `<ul>${item.issues
                                  .map((issue) => `<li>${esc(issue)}</li>`)
                                  .join("")}</ul>`
                            : ""
                    }
                    <p><strong>Gợi ý:</strong> ${esc(item.draft)}</p>
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
                           ${rewriteItems}
                       </div>`
                    : ""
            }
        </div>
    `;

    /* chạy hiệu ứng thanh điểm */
    requestAnimationFrame(() => {
        const bar = document.getElementById("overallBar");

        if (bar) {
            bar.style.width = `${overall}%`;
        }
    });

    panel.scrollIntoView({ behavior: "smooth", block: "start" });
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