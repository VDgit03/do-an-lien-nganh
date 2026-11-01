/*
 * cv_draft.js - Màn nổi "AI tự sửa CV":
 *   1. gọi /api/analysis/fix (mode=draft) lấy bản nháp CV đã áp dụng chỉnh sửa của AI
 *   2. cho chọn mẫu (4 bố cục như trang tạo CV), màu, cỡ chữ
 *   3. xem trước dạng trang A4 và SỬA TRỰC TIẾP ngay trên bản xem trước
 *   4. bấm "Tạo PDF" -> mở hộp thoại in của trình duyệt (chọn "Lưu dạng PDF")
 *
 * Dùng các biến/hàm toàn cục của analysis.js: ANALYSIS_API_URL, lastJobDescription,
 * showMessage(), fixPdfWithAgent().
 */

const CVD_TEMPLATES = [
    { id: "layout1", label: "Cổ điển" },
    { id: "layout2", label: "Hai cột" },
    { id: "layout3", label: "Tối giản" },
    { id: "layout4", label: "Dòng thời gian" }
];

const CVD_COLORS = ["#2F7867", "#1F3A5F", "#B3412F", "#6B4BA1", "#C7842B", "#222222"];

const CVD_FONT_SIZES = [
    { id: "sm", label: "Nhỏ", value: "9.5pt" },
    { id: "md", label: "Vừa", value: "10.5pt" },
    { id: "lg", label: "Lớn", value: "11.5pt" }
];

const CVD_PLACEHOLDER = /\[[^\]\n]{1,40}\]/g;

// thứ tự mục khi hiển thị 1 cột; cột phải chỉ dùng cho mẫu "Hai cột"
const CVD_SECTIONS = [
    { key: "summary", side: false, title: { vi: "Giới thiệu", en: "Summary" } },
    { key: "experience", side: false, title: { vi: "Kinh nghiệm làm việc", en: "Work Experience" } },
    { key: "education", side: true, title: { vi: "Học vấn", en: "Education" } },
    { key: "projects", side: false, title: { vi: "Dự án", en: "Projects" } },
    { key: "skills", side: true, title: { vi: "Kỹ năng", en: "Skills" } },
    { key: "certifications", side: true, title: { vi: "Chứng chỉ", en: "Certifications" } },
    { key: "awards", side: false, title: { vi: "Giải thưởng", en: "Awards" } },
    { key: "languages", side: true, title: { vi: "Ngoại ngữ", en: "Languages" } }
];

// nhãn cố định trên CV theo ngôn ngữ nội dung CV (để CV không bị lẫn hai thứ tiếng)
const CVD_LABELS = {
    vi: { name: "Họ và tên", tech: "Công nghệ", repo: "Mã nguồn" },
    en: { name: "Full Name", tech: "Technologies", repo: "Repository" }
};

// tên các mục "khác" mà bộ đọc CV không có mục riêng (Hoạt động, Sở thích...)
const CVD_OTHER_TITLES = {
    activities: { vi: "Hoạt động", en: "Activities" },
    activity: { vi: "Hoạt động", en: "Activities" },
    "hoạt động": { vi: "Hoạt động", en: "Activities" },
    interest: { vi: "Sở thích", en: "Interests" },
    interests: { vi: "Sở thích", en: "Interests" },
    hobbies: { vi: "Sở thích", en: "Interests" },
    "sở thích": { vi: "Sở thích", en: "Interests" },
    "more information": { vi: "Thông tin thêm", en: "Additional Information" },
    "additional information": { vi: "Thông tin thêm", en: "Additional Information" },
    "thông tin thêm": { vi: "Thông tin thêm", en: "Additional Information" },
    references: { vi: "Người giới thiệu", en: "References" },
    volunteering: { vi: "Tình nguyện", en: "Volunteering" },
    publications: { vi: "Công bố", en: "Publications" }
};

const CVD_DATE_LINE = /^\s*(?:\d{1,2}\s*\/\s*)?\d{4}\s*[-–—]\s*(?:(?:\d{1,2}\s*\/\s*)?\d{4}|now|present|current|nay|hiện tại)\s*$/i;
const CVD_NOISE_LINE = /©|topcv|^\s*page\s+\d+|^\s*\d+\s*\/\s*\d+\s*$/i;

const CVD_VI_CHARS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi;

/** Đoán ngôn ngữ của CV: có đủ chữ có dấu tiếng Việt thì "vi", ngược lại "en". */
function cvdDetectLang(cv) {
    const parts = [];

    (cv.experience || []).forEach((e) => parts.push(...(e.description || []), e.position, e.company));
    (cv.projects || []).forEach((p) => parts.push(...(p.description || []), p.name));
    parts.push(cv.summary, ...(cv.certifications || []), ...(cv.awards || []));

    const text = parts.filter(Boolean).join(" ");
    const letters = (text.match(/\p{L}/gu) || []).length;
    const vietnamese = (text.match(CVD_VI_CHARS) || []).length;

    return letters > 0 && vietnamese / letters > 0.02 ? "vi" : "en";
}

const cvdTitle = (def) => def.title[cvdState.lang] || def.title.vi;

const cvdState = {
    template: "layout1",
    color: CVD_COLORS[0],
    fontSize: "md",
    highlight: true,
    changes: [],
    photo: "",
    otherDefs: [],
    lang: "vi",
    root: null,
    busy: false
};

/* ---------- lưu lựa chọn của người dùng (không bắt buộc) ---------- */

function cvdLoadPrefs() {
    try {
        const saved = JSON.parse(localStorage.getItem("cvDraftPrefs") || "{}");

        if (CVD_TEMPLATES.some((t) => t.id === saved.template)) cvdState.template = saved.template;
        if (/^#[0-9a-f]{6}$/i.test(saved.color || "")) cvdState.color = saved.color;
        if (CVD_FONT_SIZES.some((f) => f.id === saved.fontSize)) cvdState.fontSize = saved.fontSize;
    } catch {
        /* localStorage có thể bị chặn */
    }
}

function cvdSavePrefs() {
    try {
        localStorage.setItem("cvDraftPrefs", JSON.stringify({
            template: cvdState.template,
            color: cvdState.color,
            fontSize: cvdState.fontSize
        }));
    } catch {
        /* bỏ qua */
    }
}

/* ---------- helper dựng DOM (luôn dùng textContent -> không dính XSS từ nội dung CV) ---------- */

function cvdEl(tag, className, text, editable) {
    const node = document.createElement(tag);

    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    if (editable) {
        node.contentEditable = "true";
        node.spellcheck = false;
    }

    return node;
}

// Nối danh sách kỹ năng: sau một câu đã kết thúc bằng ". ; ! ?" thì nối bằng dấu cách,
// tránh sinh ra "users., IT Operations".
const cvdClean = (value) => String(value ?? "").replace(/[\ufeff\u200b\u200c\u200d\u2060]/g, "").trim();

const cvdJoin = (items) =>
    items
        .map((item) => cvdClean(item))
        .filter(Boolean)
        .reduce((out, item) => (out ? out + (/[.;!?]$/.test(out) ? " " : ", ") + item : item), "");

const cvdText = (value) =>
    Array.isArray(value) ? cvdJoin(value) : cvdClean(value);

/* ---------- gọi API lấy bản nháp ---------- */

async function openCvDraft(useOcr = false) {
    if (cvdState.busy) return;

    const button = document.getElementById("aiFixPdfBtn");
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
    formData.append("mode", "draft");
    formData.append("ocr", useOcr === true ? "1" : "0");

    cvdState.busy = true;
    if (button) button.disabled = true;

    const loading = cvdShowLoading("AI đang chuẩn bị bản nháp CV, có thể mất tới 1 phút...");

    try {
        const response = await fetch(`${ANALYSIS_API_URL}/fix`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            showMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            return;
        }

        /* PDF dạng ảnh: xin đồng ý dùng AI đọc chữ */
        if (data.code === "NO_TEXT" && data.canOcr && useOcr !== true) {
            loading.remove();

            const agree = window.confirm(
                "CV này là PDF dạng ảnh nên chưa sửa trực tiếp được.\n\n" +
                "Dùng AI (Google Gemini) đọc chữ từ ảnh rồi dựng bản nháp CV có chữ (sửa được)?\n" +
                "File CV sẽ được gửi tới Google. Bố cục CV mới sẽ khác bản gốc."
            );

            cvdState.busy = false;

            if (agree) {
                if (button) button.disabled = false;
                return await openCvDraft(true);
            }

            showMessage("Hãy xuất lại CV thành PDF có chữ (Export/Download as PDF) rồi thử lại.");
            return;
        }

        if (!response.ok || !data.success) {
            showMessage(data.message || "Không dựng được bản nháp CV.");
            return;
        }

        loading.remove();
        cvdOpenEditor(data.data);
    } catch {
        showMessage("Không kết nối được máy chủ.");
    } finally {
        loading.remove();
        cvdState.busy = false;
        if (button) button.disabled = false;
    }
}

function cvdShowLoading(message) {
    const box = cvdEl("div", "cvd-loading");

    box.appendChild(cvdEl("div", "cvd-spinner"));
    box.appendChild(cvdEl("p", "", message));
    document.body.appendChild(box);

    return box;
}

/* ---------- dựng bản xem trước CV từ dữ liệu ---------- */

/**
 * Vị trí cuối cùng của từng đoạn AI sửa. Server ghi vị trí tại thời điểm áp dụng;
 * một thay đổi sau đó ở vị trí trước/bằng có thể đẩy các bullet phía sau lên/xuống
 * (khi 1 bullet tách thành nhiều dòng), nên phải cộng dồn lại.
 */
function cvdResolveChangePositions(changes) {
    const items = changes.map((c) => ({ ...c }));

    for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
            if (
                items[j].section === items[i].section &&
                items[j].entry === items[i].entry &&
                items[j].index <= items[i].index
            ) {
                items[i].index += Math.max(0, (items[j].count || 1) - 1);
            }
        }
    }

    return items;
}

function cvdBuildBullets(items, section, entry, changes) {
    const list = cvdEl("ul", "cvp-list");

    (items || []).forEach((text, index) => {
        if (!String(text || "").trim()) return;

        const li = cvdEl("li", "", cvdText(text), true);
        const change = changes.find(
            (c) =>
                c.section === section &&
                c.entry === entry &&
                index >= c.index &&
                index < c.index + (c.count || 1)
        );

        if (change) {
            li.classList.add("ai-changed");
            li.dataset.changeId = change.id;
            li.title = "AI đã sửa dòng này";
        }

        list.appendChild(li);
    });

    return list;
}

function cvdBuildSection(def, cv, changes) {
    const section = cvdSectionShell(def);
    const body = section.querySelector(".cvp-body-inner");
    const key = def.key;

    if (key === "summary") {
        const text = cvdText(cv.summary);

        if (!text) return null;
        body.appendChild(cvdEl("p", "cvp-summary", text, true));
    } else if (key === "experience") {
        const entries = (cv.experience || []).filter((e) => e.position || e.company || (e.description || []).length);

        if (!entries.length) return null;

        entries.forEach((entry, idx) => {
            const item = cvdEl("div", "cvp-item");
            const head = cvdEl("div", "cvp-item-head");

            head.appendChild(cvdEl("strong", "cvp-pos", cvdText(entry.position), true));
            head.appendChild(cvdEl("span", "cvp-comp", cvdText(entry.company), true));
            head.appendChild(cvdEl("span", "cvp-date", cvdText(entry.date), true));
            item.appendChild(head);
            item.appendChild(cvdBuildBullets(entry.description, "experience", cv.experience.indexOf(entry), changes));
            body.appendChild(item);
        });
    } else if (key === "education") {
        const entries = (cv.education || []).filter((e) => e.institution || e.degree || e.major);

        if (!entries.length) return null;

        entries.forEach((entry) => {
            const item = cvdEl("div", "cvp-item");
            const head = cvdEl("div", "cvp-item-head");

            head.appendChild(cvdEl("strong", "cvp-pos", cvdText(entry.institution), true));
            head.appendChild(cvdEl("span", "cvp-date", cvdText(entry.date), true));
            item.appendChild(head);

            const detail = [entry.degree, entry.major, entry.gpa ? `GPA: ${entry.gpa}` : ""]
                .filter(Boolean)
                .join(" · ");

            if (detail) item.appendChild(cvdEl("div", "cvp-sub", detail, true));
            if ((entry.description || []).length) {
                item.appendChild(cvdBuildBullets(entry.description, "education", cv.education.indexOf(entry), changes));
            }

            body.appendChild(item);
        });
    } else if (key === "projects") {
        const entries = (cv.projects || []).filter((e) => e.name || (e.description || []).length);

        if (!entries.length) return null;

        entries.forEach((entry) => {
            const item = cvdEl("div", "cvp-item");
            const head = cvdEl("div", "cvp-item-head");

            head.appendChild(cvdEl("strong", "cvp-pos", cvdText(entry.name), true));
            head.appendChild(cvdEl("span", "cvp-comp", cvdText(entry.role), true));
            head.appendChild(cvdEl("span", "cvp-date", cvdText(entry.date), true));
            item.appendChild(head);
            item.appendChild(cvdBuildBullets(entry.description, "projects", cv.projects.indexOf(entry), changes));

            if (cvdText(entry.technologies)) {
                const tech = cvdEl("div", "cvp-sub", `${CVD_LABELS[cvdState.lang].tech}: ${cvdText(entry.technologies)}`, true);

                tech.dataset.labelKey = "tech";
                item.appendChild(tech);
            }

            if (cvdText(entry.repository)) {
                const repo = cvdEl("div", "cvp-sub", `${CVD_LABELS[cvdState.lang].repo}: ${cvdText(entry.repository)}`, true);

                repo.dataset.labelKey = "repo";
                item.appendChild(repo);
            }

            body.appendChild(item);
        });
    } else if (key === "skills") {
        const groups = cv.skill_groups && Object.keys(cv.skill_groups).length ? cv.skill_groups : null;
        const lines = groups
            ? Object.entries(groups).map(([name, list]) => `${name}: ${cvdText(list)}`)
            : [cvdText(cv.skills)];
        const filtered = lines.filter((line) => line && !/:\s*$/.test(line));

        if (!filtered.length) return null;
        filtered.forEach((line) => body.appendChild(cvdEl("p", "cvp-skill-line", line, true)));
    } else {
        const items = (cv[key] || []).map(cvdText).filter(Boolean);

        if (!items.length) return null;

        const list = cvdEl("ul", "cvp-list");

        items.forEach((text) => list.appendChild(cvdEl("li", "", text, true)));
        body.appendChild(list);
    }

    return section;
}

// tạo khung 1 mục: tiêu đề (sửa được) + nút ẩn mục
function cvdSectionShell(def) {
    const section = cvdEl("section", "cvp-sec");
    const head = cvdEl("div", "cvp-sec-head");
    const remove = cvdEl("button", "cvp-remove", "×");

    section.dataset.key = def.key;
    section.dataset.side = def.side ? "1" : "0";
    section.style.order = String(
        def.order ?? CVD_SECTIONS.findIndex((s) => s.key === def.key) + 1
    );

    remove.type = "button";
    remove.title = "Xóa mục này khỏi CV";
    remove.addEventListener("click", () => section.remove());

    head.appendChild(cvdEl("h2", "", cvdTitle(def), true));
    head.appendChild(remove);
    section.appendChild(head);
    section.appendChild(cvdEl("div", "cvp-body-inner"));

    return section;
}

const cvdTitleCase = (text) =>
    text === text.toUpperCase()
        ? text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
        : text;

/** Nội dung một mục "khác" (chuỗi nhiều dòng) -> các entry {date, head[], bullets[]}. */
function cvdParseOther(content) {
    const lines = String(content || "")
        .split("\n")
        .map(cvdClean)
        .filter((line) => line && !CVD_NOISE_LINE.test(line));
    const entries = [];
    let entry = null;

    const start = () => {
        entry = { date: "", head: [], bullets: [] };
        entries.push(entry);
    };

    lines.forEach((line) => {
        const bullet = /^[-•▪●◦○■□◆◇*]\s*/.test(line);
        const isDate = CVD_DATE_LINE.test(line);

        if (!entry || (isDate && entry.bullets.length)) start();

        if (bullet) {
            entry.bullets.push(line.replace(/^[-•▪●◦○■□◆◇*]\s*/, ""));
        } else if (isDate && !entry.date) {
            entry.date = line;
        } else if (entry.bullets.length) {
            // dòng PDF bị xuống dòng giữa một gạch đầu dòng ("...aquarium" / "biotop")
            entry.bullets[entry.bullets.length - 1] += " " + line;
        } else {
            entry.head.push(line);
        }
    });

    return entries;
}

function cvdBuildOtherSection(block, index) {
    const name = cvdClean(block.section);
    const known = CVD_OTHER_TITLES[name.toLowerCase()];
    const pretty = cvdTitleCase(name);
    const def = {
        key: `other-${index}`,
        side: false,
        order: 20 + index,
        title: known || { vi: pretty, en: pretty }
    };
    const entries = cvdParseOther(block.content);

    if (!entries.some((e) => e.head.length || e.bullets.length || e.date)) return null;

    const section = cvdSectionShell(def);
    const body = section.querySelector(".cvp-body-inner");

    entries.forEach((entry) => {
        const item = cvdEl("div", "cvp-item");

        if (entry.head.length || entry.date) {
            const head = cvdEl("div", "cvp-item-head");

            head.appendChild(cvdEl("strong", "cvp-pos", entry.head[0] || "", true));
            head.appendChild(cvdEl("span", "cvp-comp", entry.head.slice(1).join(" · "), true));
            head.appendChild(cvdEl("span", "cvp-date", entry.date, true));
            item.appendChild(head);
        }

        if (entry.bullets.length) {
            const list = cvdEl("ul", "cvp-list");

            entry.bullets.forEach((text) => list.appendChild(cvdEl("li", "", text, true)));
            item.appendChild(list);
        }

        body.appendChild(item);
    });

    cvdState.otherDefs.push(def);

    return section;
}

function cvdBuildCv(cv, changes) {
    const personal = cv.personal || {};
    const sheet = cvdEl("div", "cvp");
    const header = cvdEl("header", "cvp-head");
    const body = cvdEl("div", "cvp-body");
    const side = cvdEl("aside", "cvp-side");
    const main = cvdEl("div", "cvp-main");

    const headText = cvdEl("div", "cvp-head-text");

    headText.appendChild(cvdEl("h1", "cvp-name", cvdText(personal.name) || CVD_LABELS[cvdState.lang].name, true));
    headText.appendChild(cvdEl("p", "cvp-title", cvdText(personal.title), true));
    header.appendChild(headText);

    const contactBlock = cvdEl("div", "cvp-contact");

    [personal.email, personal.phone, personal.address, personal.linkedin, personal.github]
        .map(cvdText)
        .filter(Boolean)
        .forEach((value) => contactBlock.appendChild(cvdEl("span", "cvp-contact-item", value, true)));

    contactBlock.style.order = "0";
    side.appendChild(contactBlock);

    CVD_SECTIONS.forEach((def) => {
        const section = cvdBuildSection(def, cv, changes);

        if (section) (def.side ? side : main).appendChild(section);
    });

    cvdState.otherDefs = [];
    (cv.other || []).forEach((block, index) => {
        const section = cvdBuildOtherSection(block, index);

        if (section) main.appendChild(section);
    });

    if (cvdState.photo) {
        const photo = document.createElement("img");

        photo.className = "cvp-photo";
        photo.alt = "Ảnh chân dung";
        photo.src = cvdState.photo;
        header.insertBefore(photo, header.firstChild);
        header.classList.add("has-photo");
    }

    body.appendChild(side);
    body.appendChild(main);
    sheet.appendChild(header);
    sheet.appendChild(body);

    return sheet;
}

/* ---------- màn nổi ---------- */

function cvdOpenEditor(data) {
    cvdLoadPrefs();
    cvdClose();

    const changes = cvdResolveChangePositions(data.changes || []);

    cvdState.changes = changes;
    cvdState.lang = cvdDetectLang(data.cv || {});
    cvdState.photo = typeof data.photo === "string" && data.photo.startsWith("data:image/") ? data.photo : "";

    const overlay = cvdEl("div", "cvd-overlay");
    const modal = cvdEl("div", "cvd-modal");

    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.appendChild(modal);

    /* --- thanh trên --- */
    const top = cvdEl("div", "cvd-top");
    const title = cvdEl("div", "cvd-title");

    title.appendChild(cvdEl("strong", "", "Xem trước & sửa CV"));
    title.appendChild(cvdEl("span", "", "Bấm vào chữ trên CV để sửa trực tiếp."));

    const closeBtn = cvdEl("button", "cvd-close", "×");

    closeBtn.type = "button";
    closeBtn.title = "Đóng";
    closeBtn.addEventListener("click", () => cvdConfirmClose());
    top.appendChild(title);
    top.appendChild(closeBtn);

    /* --- cột điều khiển --- */
    const panel = cvdEl("div", "cvd-panel");

    panel.appendChild(cvdEl("h3", "", "Mẫu CV"));
    const templateRow = cvdEl("div", "cvd-templates");

    CVD_TEMPLATES.forEach((tpl) => {
        const btn = cvdEl("button", "cvd-tpl");
        const thumb = cvdEl("span", `cvd-thumb cvd-thumb-${tpl.id}`);

        btn.type = "button";
        btn.dataset.template = tpl.id;
        btn.appendChild(thumb);
        btn.appendChild(cvdEl("span", "", tpl.label));
        btn.addEventListener("click", () => {
            cvdState.template = tpl.id;
            cvdSavePrefs();
            cvdApplyStyle();
        });
        templateRow.appendChild(btn);
    });
    panel.appendChild(templateRow);

    panel.appendChild(cvdEl("h3", "", "Màu chủ đạo"));
    const colorRow = cvdEl("div", "cvd-colors");

    CVD_COLORS.forEach((color) => {
        const btn = cvdEl("button", "cvd-color");

        btn.type = "button";
        btn.dataset.color = color;
        btn.style.background = color;
        btn.title = color;
        btn.addEventListener("click", () => {
            cvdState.color = color;
            cvdSavePrefs();
            cvdApplyStyle();
        });
        colorRow.appendChild(btn);
    });
    panel.appendChild(colorRow);

    panel.appendChild(cvdEl("h3", "", "Cỡ chữ"));
    const sizeRow = cvdEl("div", "cvd-sizes");

    CVD_FONT_SIZES.forEach((size) => {
        const btn = cvdEl("button", "cvd-size", size.label);

        btn.type = "button";
        btn.dataset.size = size.id;
        btn.addEventListener("click", () => {
            cvdState.fontSize = size.id;
            cvdSavePrefs();
            cvdApplyStyle();
        });
        sizeRow.appendChild(btn);
    });
    panel.appendChild(sizeRow);

    panel.appendChild(cvdEl("h3", "", "Ngôn ngữ tiêu đề mục"));
    const langRow = cvdEl("div", "cvd-sizes");

    [["vi", "Tiếng Việt"], ["en", "English"]].forEach(([id, label]) => {
        const btn = cvdEl("button", "cvd-size cvd-lang", label);

        btn.type = "button";
        btn.dataset.lang = id;
        btn.addEventListener("click", () => {
            cvdState.lang = id;
            cvdRelabelSections();
            cvdApplyStyle();
        });
        langRow.appendChild(btn);
    });
    panel.appendChild(langRow);

    /* --- danh sách đoạn AI đã sửa --- */
    panel.appendChild(cvdEl("h3", "", `AI đã sửa ${changes.length} đoạn`));

    const highlightLabel = cvdEl("label", "cvd-check");
    const highlightBox = document.createElement("input");

    highlightBox.type = "checkbox";
    highlightBox.checked = cvdState.highlight;
    highlightBox.addEventListener("change", () => {
        cvdState.highlight = highlightBox.checked;
        cvdApplyStyle();
    });
    highlightLabel.appendChild(highlightBox);
    highlightLabel.appendChild(document.createTextNode(" Tô sáng chỗ AI sửa"));
    panel.appendChild(highlightLabel);

    if (cvdState.photo) {
        const photoLabel = cvdEl("label", "cvd-check");
        const photoBox = document.createElement("input");

        photoBox.type = "checkbox";
        photoBox.checked = true;
        photoBox.addEventListener("change", () => {
            cvdState.root?.classList.toggle("hide-photo", !photoBox.checked);
        });
        photoLabel.appendChild(photoBox);
        photoLabel.appendChild(document.createTextNode(" Hiện ảnh chân dung"));
        panel.appendChild(photoLabel);
    }

    const changeList = cvdEl("div", "cvd-changes");

    changes.forEach((change) => {
        const row = cvdEl("div", "cvd-change");

        row.dataset.changeId = change.id;
        row.appendChild(cvdEl("div", "cvd-change-src", change.source || "Mô tả"));
        row.appendChild(cvdEl("div", "cvd-change-old", change.original || ""));

        if (change.needsInput) {
            row.appendChild(cvdEl("div", "cvd-change-warn", "Có chỗ [ ] cần bạn điền số liệu thật trước khi tạo PDF."));
        }

        const actions = cvdEl("div", "cvd-change-actions");
        const find = cvdEl("button", "", "Xem trên CV");
        const undo = cvdEl("button", "", "Hoàn tác");

        find.type = "button";
        undo.type = "button";
        find.addEventListener("click", () => cvdLocate(change.id));
        undo.addEventListener("click", () => {
            cvdUndo(change);
            row.classList.add("reverted");
            undo.disabled = true;
        });
        actions.appendChild(find);
        actions.appendChild(undo);
        row.appendChild(actions);
        changeList.appendChild(row);
    });

    if (!changes.length) {
        changeList.appendChild(cvdEl("p", "cvd-muted", "AI không đề xuất đoạn nào cần sửa."));
    }

    if (data.failed) {
        changeList.appendChild(
            cvdEl("p", "cvd-muted", `${data.failed} đoạn không tìm thấy trên CV nên chưa áp dụng.`)
        );
    }

    (data.notes || []).forEach((note) => changeList.appendChild(cvdEl("p", "cvd-muted", note)));
    panel.appendChild(changeList);

    /* --- khu xem trước --- */
    const stage = cvdEl("div", "cvd-stage");
    const page = cvdEl("div", "cvd-page");
    const sheet = cvdBuildCv(data.cv || {}, changes);

    page.appendChild(sheet);
    stage.appendChild(page);
    cvdState.root = sheet;

    /* --- thanh dưới --- */
    const bottom = cvdEl("div", "cvd-bottom");
    const legacy = cvdEl("button", "cvd-link", "Hoặc sửa thẳng vào PDF gốc (giữ nguyên bố cục cũ)");
    const cancel = cvdEl("button", "cvd-btn-secondary", "Đóng");
    const create = cvdEl("button", "cvd-btn-primary", "Tạo PDF");

    legacy.type = "button";
    legacy.addEventListener("click", () => {
        cvdClose();
        fixPdfWithAgent();
    });
    cancel.type = "button";
    cancel.addEventListener("click", () => cvdConfirmClose());
    create.type = "button";
    create.addEventListener("click", cvdCreatePdf);

    bottom.appendChild(legacy);
    bottom.appendChild(cancel);
    bottom.appendChild(create);

    const content = cvdEl("div", "cvd-content");

    content.appendChild(panel);
    content.appendChild(stage);
    modal.appendChild(top);
    modal.appendChild(content);
    modal.appendChild(bottom);

    document.body.appendChild(overlay);
    document.body.classList.add("cvd-lock");

    overlay.addEventListener("keydown", (event) => {
        if (event.key === "Escape") cvdConfirmClose();
    });
    overlay.tabIndex = -1;
    overlay.focus();

    cvdState.overlay = overlay;
    cvdState.stage = stage;
    cvdState.page = page;

    window.addEventListener("resize", cvdFitPage);
    cvdApplyStyle();
}

function cvdClose() {
    document.querySelectorAll(".cvd-overlay").forEach((node) => node.remove());
    document.body.classList.remove("cvd-lock");
    window.removeEventListener("resize", cvdFitPage);
    cvdState.root = null;
}

function cvdConfirmClose() {
    if (window.confirm("Đóng bản xem trước? Các chỉnh sửa trên CV sẽ không được lưu.")) {
        cvdClose();
    }
}

/* ---------- áp dụng mẫu / màu / cỡ chữ ---------- */

function cvdApplyStyle() {
    const root = cvdState.root;

    if (!root) return;

    CVD_TEMPLATES.forEach((tpl) => root.classList.remove(tpl.id));
    root.classList.add(cvdState.template);
    root.classList.toggle("show-changes", cvdState.highlight);
    root.style.setProperty("--cv-color", cvdState.color);
    root.style.setProperty(
        "--cv-font",
        (CVD_FONT_SIZES.find((f) => f.id === cvdState.fontSize) || CVD_FONT_SIZES[1]).value
    );

    document.querySelectorAll(".cvd-tpl").forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.template === cvdState.template)
    );
    document.querySelectorAll(".cvd-color").forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.color === cvdState.color)
    );
    document.querySelectorAll(".cvd-size:not(.cvd-lang)").forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.size === cvdState.fontSize)
    );
    document.querySelectorAll(".cvd-lang").forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.lang === cvdState.lang)
    );

    cvdFitPage();
}

// đổi tiêu đề các mục (và nhãn "Công nghệ") theo ngôn ngữ đang chọn
function cvdRelabelSections() {
    if (!cvdState.root) return;

    CVD_SECTIONS.concat(cvdState.otherDefs).forEach((def) => {
        const heading = cvdState.root.querySelector(`.cvp-sec[data-key="${def.key}"] h2`);

        if (heading) heading.textContent = cvdTitle(def);
    });

    cvdState.root.querySelectorAll(".cvp-sub[data-label-key]").forEach((node) => {
        const label = CVD_LABELS[cvdState.lang][node.dataset.labelKey];
        const colon = node.textContent.indexOf(":");

        if (label && colon > -1) node.textContent = `${label}${node.textContent.slice(colon)}`;
    });
}

// thu nhỏ trang A4 vừa chiều rộng khung xem trước
function cvdFitPage() {
    const { stage, page } = cvdState;

    if (!stage || !page) return;

    const available = stage.clientWidth - 32;
    const zoom = Math.min(1, Math.max(0.4, available / 794));

    page.style.zoom = String(zoom);
}

/* ---------- hoàn tác / định vị đoạn AI sửa ---------- */

function cvdLocate(changeId) {
    const target = cvdState.root?.querySelector(`li[data-change-id="${CSS.escape(String(changeId))}"]`);

    if (!target) {
        showMessage("Đoạn này đã bị xóa hoặc sửa khỏi CV.");
        return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("flash");
    setTimeout(() => target.classList.remove("flash"), 1500);
}

function cvdUndo(change) {
    const nodes = Array.from(
        cvdState.root?.querySelectorAll(`li[data-change-id="${CSS.escape(String(change.id))}"]`) || []
    );

    if (!nodes.length) {
        showMessage("Không tìm thấy đoạn này trên CV (có thể bạn đã xóa).");
        return;
    }

    nodes[0].textContent = change.original || "";
    nodes[0].classList.remove("ai-changed");
    nodes[0].removeAttribute("data-change-id");
    nodes[0].removeAttribute("title");
    nodes.slice(1).forEach((node) => node.remove());
}

/* ---------- tạo PDF ---------- */

function cvdCleanClone() {
    const clone = cvdState.root.cloneNode(true);

    clone.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
    clone.querySelectorAll(".cvp-remove").forEach((node) => node.remove());
    clone.querySelectorAll(".ai-changed").forEach((node) => node.classList.remove("ai-changed"));
    clone.classList.remove("show-changes");

    if (clone.classList.contains("hide-photo")) {
        clone.querySelectorAll(".cvp-photo").forEach((node) => node.remove());
    }

    // bỏ mục không còn nội dung, và dòng bullet trống do người dùng xóa chữ
    clone.querySelectorAll("li").forEach((li) => {
        if (!li.textContent.trim()) li.remove();
    });
    clone.querySelectorAll(".cvp-sec").forEach((section) => {
        if (!section.querySelector(".cvp-body-inner")?.textContent.trim()) section.remove();
    });

    return clone;
}

function cvdCreatePdf() {
    if (!cvdState.root) return;

    const clone = cvdCleanClone();
    const leftover = (clone.textContent.match(CVD_PLACEHOLDER) || []).length;

    if (
        leftover &&
        !window.confirm(
            `Trên CV còn ${leftover} chỗ dạng [ ... ] chưa điền (ví dụ [X%]).\n` +
            "Bạn vẫn muốn tạo PDF?"
        )
    ) {
        return;
    }

    const cssLink = document.querySelector('link[href*="cv_draft.css"]');
    const name = (clone.querySelector(".cvp-name")?.textContent || "CV").trim();
    const fileTitle = `CV - ${name}`.replace(/[\\/:*?"<>|]/g, "");
    const frame = document.createElement("iframe");

    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    frame.srcdoc =
        `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${fileTitle
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")}</title>` +
        `<link rel="stylesheet" href="${cssLink ? cssLink.href : ""}"></head>` +
        `<body class="cvd-print">${clone.outerHTML}</body></html>`;

    frame.onload = () => {
        const win = frame.contentWindow;
        const cleanup = () => setTimeout(() => frame.remove(), 500);

        win.addEventListener("afterprint", cleanup);
        setTimeout(() => frame.remove(), 5 * 60 * 1000);

        // đợi layout xong rồi mở hộp thoại in
        setTimeout(() => {
            win.focus();
            win.print();
        }, 250);
    };

    document.body.appendChild(frame);
    showMessage('Trong hộp thoại in, chọn "Lưu dạng PDF" để tạo file.');
}
