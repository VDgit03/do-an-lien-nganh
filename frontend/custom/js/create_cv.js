document.addEventListener("DOMContentLoaded", () => {

    /* dom */

    const fullNameInput =
        document.getElementById("fullName");

    const positionInput =
        document.getElementById("position");

    const summaryInput =
        document.getElementById("summary");

    const previewName =
        document.getElementById("previewName");

    const previewPosition =
        document.getElementById("previewPosition");

    const previewSummary =
        document.getElementById("previewSummary");

    const experienceList =
        document.getElementById("experienceList");

    const educationList =
        document.getElementById("educationList");

    const languageList =
        document.getElementById("languageList");

    const addExperience =
        document.getElementById("addExperience");

    const addEducation =
        document.getElementById("addEducation");

    const addLanguage =
        document.getElementById("addLanguage");

    const experiencePreview =
        document.getElementById("experiencePreview");

    const educationPreview =
        document.getElementById("educationPreview");

    const cvPreview =
        document.getElementById("cvPreview");

    const layoutButtons =
        document.querySelectorAll(".layout-btn");

    const colorButtons =
        document.querySelectorAll(".color-btn");

    const saveCvButton =
        document.getElementById("saveCvBtn");

    const skillsInput =
        document.getElementById("skills");

    const softSkillsInput =
        document.getElementById("softSkills");


    /* kiểm tra preview */

    if (!cvPreview) {
        console.error(
            "Không tìm thấy #cvPreview"
        );
        return;
    }


    /* xác định chế độ */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const editCvId =
        urlParams.get("id");

    const isEditMode =
        Boolean(editCvId);


    /* biến đếm */

    let experienceCount = 0;
    let educationCount = 0;
    let languageCount = 0;


    /* escape html */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* tạo section preview */

    function createPreviewSection(
        id,
        title
    ) {

        let section =
            document.getElementById(id);

        if (section) {
            return section;
        }

        section =
            document.createElement("section");

        section.className =
            "preview-section";

        section.id = id;

        section.innerHTML = `
            <h2>${title}</h2>

            <div class="preview-content"></div>
        `;

        const cvMain =
            cvPreview.querySelector(".cv-main");

        if (!cvMain) {
            return null;
        }

        if (experiencePreview) {

            cvMain.insertBefore(
                section,
                experiencePreview
            );

        } else {

            cvMain.appendChild(section);
        }

        return section;
    }


    /* preview kỹ năng */

    const skillsPreview =
        createPreviewSection(
            "skillsPreview",
            "Kỹ năng"
        );

    const softSkillsPreview =
        createPreviewSection(
            "softSkillsPreview",
            "Kỹ năng mềm"
        );

    const languagePreview =
        createPreviewSection(
            "languagePreview",
            "Ngoại ngữ"
        );


    /* thông tin cá nhân */

    function updatePersonalInfo() {

        if (previewName) {

            previewName.textContent =
                fullNameInput?.value.trim() ||
                "Họ và tên";
        }

        if (previewPosition) {

            previewPosition.textContent =
                positionInput?.value.trim() ||
                "Chức danh";
        }

        if (previewSummary) {

            previewSummary.textContent =
                summaryInput?.value.trim() ||
                "Giới thiệu bản thân";
        }
    }


    fullNameInput?.addEventListener(
        "input",
        updatePersonalInfo
    );

    positionInput?.addEventListener(
        "input",
        updatePersonalInfo
    );

    summaryInput?.addEventListener(
        "input",
        updatePersonalInfo
    );


    /* phân tích thời gian */

    function getTimeValue(timeRange) {

        if (!timeRange) {
            return 0;
        }

        const text =
            String(timeRange)
                .toLowerCase()
                .trim();

        const monthYearMatch =
            text.match(
                /(?:tháng\s*)?(\d{1,2})[\/\-](\d{4})/i
            );

        let year = 0;
        let month = 1;

        if (monthYearMatch) {

            month =
                Number(
                    monthYearMatch[1]
                );

            year =
                Number(
                    monthYearMatch[2]
                );

        } else {

            const yearMatch =
                text.match(
                    /\b(19|20)\d{2}\b/
                );

            if (yearMatch) {

                year =
                    Number(
                        yearMatch[0]
                    );
            }
        }

        if (!year) {
            return 0;
        }

        const value =
            year * 100 + month;

        const isCurrent =
            text.includes("nay") ||
            text.includes("hiện tại") ||
            text.includes("hiện nay") ||
            text.includes("present") ||
            text.includes("current");

        if (isCurrent) {

            return (
                100000000 +
                value
            );
        }

        return value;
    }


    /* sắp xếp mới → cũ */

    function sortByNewest(items) {

        return items
            .map(
                (item, index) => ({
                    ...item,
                    originalIndex: index
                })
            )
            .sort(
                (a, b) => {

                    const timeA =
                        getTimeValue(
                            a.time_range
                        );

                    const timeB =
                        getTimeValue(
                            b.time_range
                        );

                    if (timeA !== timeB) {
                        return timeB - timeA;
                    }

                    return (
                        a.originalIndex -
                        b.originalIndex
                    );
                }
            );
    }


    /* kinh nghiệm */

    function createExperienceItem(
        data = {}
    ) {

        experienceCount++;

        const item =
            document.createElement("div");

        item.className =
            "dynamic-item experience-item";

        item.innerHTML = `
            <div class="dynamic-item-header">

                <strong class="item-label">
                    Mục ${experienceCount}
                </strong>

                <button
                    type="button"
                    class="remove-btn"
                    data-action="remove-experience"
                >
                    Xóa
                </button>

            </div>

            <div class="form-row">

                <div class="form-group">

                    <label>
                        Chức danh
                    </label>

                    <input
                        type="text"
                        class="experience-position"
                        placeholder="Backend Developer"
                        value="${escapeHTML(
                            data.position || ""
                        )}"
                    />

                </div>

                <div class="form-group">

                    <label>
                        Thời gian
                    </label>

                    <input
                        type="text"
                        class="experience-time"
                        placeholder="2024 – nay"
                        value="${escapeHTML(
                            data.time_range || ""
                        )}"
                    />

                </div>

            </div>

            <div class="form-group">

                <label>
                    Công ty / tổ chức
                </label>

                <input
                    type="text"
                    class="experience-company"
                    placeholder="Tên công ty / tổ chức"
                    value="${escapeHTML(
                        data.company || ""
                    )}"
                />

            </div>

            <div class="form-group">

                <label>
                    Mô tả công việc
                </label>

                <textarea
                    class="experience-description"
                    rows="4"
                    placeholder="Mô tả công việc đã đảm nhiệm..."
                >${escapeHTML(
                    data.description || ""
                )}</textarea>

            </div>
        `;

        return item;
    }


    function updateExperienceNumbers() {

        if (!experienceList) {
            return;
        }

        const items =
            experienceList.querySelectorAll(
                ".experience-item"
            );

        items.forEach(
            (item, index) => {

                const label =
                    item.querySelector(
                        ".item-label"
                    );

                if (label) {

                    label.textContent =
                        `Mục ${index + 1}`;
                }
            }
        );

        experienceCount =
            items.length;
    }


    function collectExperiences() {

        if (!experienceList) {
            return [];
        }

        const items =
            experienceList.querySelectorAll(
                ".experience-item"
            );

        const experiences = [];

        items.forEach(
            (item) => {

                const position =
                    item.querySelector(
                        ".experience-position"
                    )?.value.trim() || "";

                const time =
                    item.querySelector(
                        ".experience-time"
                    )?.value.trim() || "";

                const company =
                    item.querySelector(
                        ".experience-company"
                    )?.value.trim() || "";

                const description =
                    item.querySelector(
                        ".experience-description"
                    )?.value.trim() || "";

                if (
                    !position &&
                    !time &&
                    !company &&
                    !description
                ) {
                    return;
                }

                experiences.push({

                    position:
                        position || null,

                    time_range:
                        time || null,

                    company:
                        company || null,

                    description:
                        description || null
                });
            }
        );

        return experiences;
    }


    function updateExperiencePreview() {

        if (!experiencePreview) {
            return;
        }

        experiencePreview.innerHTML = `
            <h2>Kinh nghiệm</h2>
        `;

        if (!experienceList) {
            return;
        }

        const items =
            experienceList.querySelectorAll(
                ".experience-item"
            );

        if (!items.length) {

            experiencePreview.innerHTML += `
                <div class="empty-line"></div>
            `;

            return;
        }

        const experiences =
            collectExperiences();

        if (!experiences.length) {

            experiencePreview.innerHTML += `
                <div class="empty-line"></div>
            `;

            return;
        }

        const sortedExperiences =
            sortByNewest(
                experiences
            );

        sortedExperiences.forEach(
            (experience) => {

                const previewItem =
                    document.createElement("div");

                previewItem.className =
                    "preview-item";

                previewItem.innerHTML = `
                    <div class="preview-item-title">
                        ${escapeHTML(
                            experience.position ||
                            "Vị trí công việc"
                        )}
                    </div>

                    <div class="preview-item-info">
                        ${escapeHTML(
                            experience.company ||
                            "Tên công ty"
                        )}

                        ${
                            experience.time_range
                                ? ` · ${escapeHTML(
                                    experience.time_range
                                )}`
                                : ""
                        }
                    </div>

                    ${
                        experience.description
                            ? `
                                <div class="preview-item-description">
                                    ${escapeHTML(
                                        experience.description
                                    )}
                                </div>
                            `
                            : ""
                    }
                `;

                experiencePreview.appendChild(
                    previewItem
                );
            }
        );
    }


    addExperience?.addEventListener(
        "click",
        () => {

            if (!experienceList) {
                return;
            }

            const item =
                createExperienceItem();

            experienceList.appendChild(item);

            updateExperienceNumbers();
            updateExperiencePreview();
        }
    );


    experienceList?.addEventListener(
        "click",
        (event) => {

            const button =
                event.target.closest(
                    '[data-action="remove-experience"]'
                );

            if (!button) {
                return;
            }

            const item =
                button.closest(
                    ".experience-item"
                );

            if (!item) {
                return;
            }

            item.remove();

            updateExperienceNumbers();
            updateExperiencePreview();
        }
    );


    experienceList?.addEventListener(
        "input",
        (event) => {

            if (
                event.target.matches(
                    "input, textarea"
                )
            ) {
                updateExperiencePreview();
            }
        }
    );


    /* học vấn */

    function createEducationItem(
        data = {}
    ) {

        educationCount++;

        const item =
            document.createElement("div");

        item.className =
            "dynamic-item education-item";

        item.innerHTML = `
            <div class="dynamic-item-header">

                <strong class="item-label">
                    Mục ${educationCount}
                </strong>

                <button
                    type="button"
                    class="remove-btn"
                    data-action="remove-education"
                >
                    Xóa
                </button>

            </div>

            <div class="form-row">

                <div class="form-group">

                    <label>
                        Chuyên ngành / bằng cấp
                    </label>

                    <input
                        type="text"
                        class="education-degree"
                        placeholder="Công nghệ thông tin"
                        value="${escapeHTML(
                            data.degree || ""
                        )}"
                    />

                </div>

                <div class="form-group">

                    <label>
                        Thời gian
                    </label>

                    <input
                        type="text"
                        class="education-time"
                        placeholder="2020 – 2024"
                        value="${escapeHTML(
                            data.time_range || ""
                        )}"
                    />

                </div>

            </div>

            <div class="form-group">

                <label>
                    Tên trường
                </label>

                <input
                    type="text"
                    class="education-school"
                    placeholder="Tên trường đại học"
                    value="${escapeHTML(
                        data.school || ""
                    )}"
                />

            </div>
        `;

        return item;
    }


    function updateEducationNumbers() {

        if (!educationList) {
            return;
        }

        const items =
            educationList.querySelectorAll(
                ".education-item"
            );

        items.forEach(
            (item, index) => {

                const label =
                    item.querySelector(
                        ".item-label"
                    );

                if (label) {

                    label.textContent =
                        `Mục ${index + 1}`;
                }
            }
        );

        educationCount =
            items.length;
    }


    function collectEducations() {

        if (!educationList) {
            return [];
        }

        const items =
            educationList.querySelectorAll(
                ".education-item"
            );

        const educations = [];

        items.forEach(
            (item) => {

                const degree =
                    item.querySelector(
                        ".education-degree"
                    )?.value.trim() || "";

                const time =
                    item.querySelector(
                        ".education-time"
                    )?.value.trim() || "";

                const school =
                    item.querySelector(
                        ".education-school"
                    )?.value.trim() || "";

                if (
                    !degree &&
                    !time &&
                    !school
                ) {
                    return;
                }

                educations.push({

                    degree:
                        degree || null,

                    time_range:
                        time || null,

                    school:
                        school || null
                });
            }
        );

        return educations;
    }


    function updateEducationPreview() {

        if (!educationPreview) {
            return;
        }

        educationPreview.innerHTML = `
            <h2>Học vấn</h2>
        `;

        if (!educationList) {
            return;
        }

        const items =
            educationList.querySelectorAll(
                ".education-item"
            );

        if (!items.length) {

            educationPreview.innerHTML += `
                <div class="empty-line"></div>
            `;

            return;
        }

        const educations =
            collectEducations();

        if (!educations.length) {

            educationPreview.innerHTML += `
                <div class="empty-line"></div>
            `;

            return;
        }

        const sortedEducations =
            sortByNewest(
                educations
            );

        sortedEducations.forEach(
            (education) => {

                const previewItem =
                    document.createElement("div");

                previewItem.className =
                    "preview-item";

                previewItem.innerHTML = `
                    <div class="preview-item-title">
                        ${escapeHTML(
                            education.degree ||
                            "Chuyên ngành / bằng cấp"
                        )}
                    </div>

                    <div class="preview-item-info">
                        ${escapeHTML(
                            education.school ||
                            "Tên trường"
                        )}

                        ${
                            education.time_range
                                ? ` · ${escapeHTML(
                                    education.time_range
                                )}`
                                : ""
                        }
                    </div>
                `;

                educationPreview.appendChild(
                    previewItem
                );
            }
        );
    }


    addEducation?.addEventListener(
        "click",
        () => {

            if (!educationList) {
                return;
            }

            const item =
                createEducationItem();

            educationList.appendChild(item);

            updateEducationNumbers();
            updateEducationPreview();
        }
    );


    educationList?.addEventListener(
        "click",
        (event) => {

            const button =
                event.target.closest(
                    '[data-action="remove-education"]'
                );

            if (!button) {
                return;
            }

            const item =
                button.closest(
                    ".education-item"
                );

            if (!item) {
                return;
            }

            item.remove();

            updateEducationNumbers();
            updateEducationPreview();
        }
    );


    educationList?.addEventListener(
        "input",
        (event) => {

            if (
                event.target.matches(
                    "input, textarea"
                )
            ) {
                updateEducationPreview();
            }
        }
    );


    /* kỹ năng */

    function collectSkillArray(input) {

        if (!input) {
            return [];
        }

        const value =
            input.value.trim();

        if (!value) {
            return [];
        }

        return value
            .split(",")
            .map(
                skill => skill.trim()
            )
            .filter(
                skill => skill.length > 0
            );
    }


    function collectSkills() {

        return collectSkillArray(
            skillsInput
        ).join(", ");
    }


    function collectSoftSkills() {

        return collectSkillArray(
            softSkillsInput
        ).join(", ");
    }


    function renderSkillPreview(
        previewSection,
        title,
        skills
    ) {

        if (!previewSection) {
            return;
        }

        previewSection.innerHTML = `
            <h2>${title}</h2>

            <div class="preview-content"></div>
        `;

        const content =
            previewSection.querySelector(
                ".preview-content"
            );

        if (!skills.length) {

            content.innerHTML = `
                <div class="empty-line"></div>
            `;

            return;
        }

        const skillsContainer =
            document.createElement("div");

        skillsContainer.className =
            "preview-skills";

        skills.forEach(
            (skill) => {

                const skillItem =
                    document.createElement("span");

                skillItem.className =
                    "preview-skill";

                skillItem.textContent =
                    skill;

                skillsContainer.appendChild(
                    skillItem
                );
            }
        );

        content.appendChild(
            skillsContainer
        );
    }


    function updateSkillsPreview() {

        renderSkillPreview(
            skillsPreview,
            "Kỹ năng",
            collectSkillArray(
                skillsInput
            )
        );
    }


    function updateSoftSkillsPreview() {

        renderSkillPreview(
            softSkillsPreview,
            "Kỹ năng mềm",
            collectSkillArray(
                softSkillsInput
            )
        );
    }


    skillsInput?.addEventListener(
        "input",
        updateSkillsPreview
    );

    softSkillsInput?.addEventListener(
        "input",
        updateSoftSkillsPreview
    );


    /* ngoại ngữ */

    function createLanguageItem(
        data = {}
    ) {

        languageCount++;

        const item =
            document.createElement("div");

        item.className =
            "dynamic-item language-item";

        item.innerHTML = `
            <div class="dynamic-item-header">

                <strong class="item-label">
                    Mục ${languageCount}
                </strong>

                <button
                    type="button"
                    class="remove-btn"
                    data-action="remove-language"
                >
                    Xóa
                </button>

            </div>

            <div class="form-row">

                <div class="form-group">

                    <label>
                        Ngôn ngữ
                    </label>

                    <input
                        type="text"
                        class="language-name"
                        placeholder="Ngôn ngữ (VD: Tiếng Anh)"
                        value="${escapeHTML(
                            data.language_name ||
                            data.name ||
                            data.language ||
                            ""
                        )}"
                    />

                </div>

                <div class="form-group">

                    <label>
                        Trình độ
                    </label>

                    <input
                        type="text"
                        class="language-level"
                        placeholder="VD: B2, N1..."
                        value="${escapeHTML(
                            data.level ||
                            data.proficiency ||
                            ""
                        )}"
                    />

                </div>

            </div>
        `;

        return item;
    }


    function updateLanguageNumbers() {

        if (!languageList) {
            return;
        }

        const items =
            languageList.querySelectorAll(
                ".language-item"
            );

        items.forEach(
            (item, index) => {

                const label =
                    item.querySelector(
                        ".item-label"
                    );

                if (label) {

                    label.textContent =
                        `Mục ${index + 1}`;
                }
            }
        );

        languageCount =
            items.length;
    }


    function normalizeLanguageItems() {

        if (!languageList) {
            return;
        }

        const items =
            languageList.querySelectorAll(
                ".language-item"
            );

        items.forEach(
            (item, index) => {

                let header =
                    item.querySelector(
                        ".dynamic-item-header"
                    );

                if (!header) {

                    header =
                        document.createElement("div");

                    header.className =
                        "dynamic-item-header";

                    header.innerHTML = `
                        <strong class="item-label">
                            Mục ${index + 1}
                        </strong>

                        <button
                            type="button"
                            class="remove-btn"
                            data-action="remove-language"
                        >
                            Xóa
                        </button>
                    `;

                    item.insertBefore(
                        header,
                        item.firstChild
                    );

                } else {

                    const label =
                        header.querySelector(
                            ".item-label"
                        );

                    if (label) {

                        label.textContent =
                            `Mục ${index + 1}`;
                    }

                    const removeButton =
                        header.querySelector(
                            '[data-action="remove-language"]'
                        );

                    if (!removeButton) {

                        const button =
                            document.createElement(
                                "button"
                            );

                        button.type = "button";
                        button.className = "remove-btn";
                        button.dataset.action =
                            "remove-language";
                        button.textContent = "Xóa";

                        header.appendChild(button);
                    }
                }
            }
        );

        languageCount =
            items.length;
    }


    function collectLanguages() {

        if (!languageList) {
            return [];
        }

        const items =
            languageList.querySelectorAll(
                ".language-item"
            );

        const languages = [];

        items.forEach(
            (item) => {

                const languageName =
                    item.querySelector(
                        ".language-name"
                    )?.value.trim() || "";

                const level =
                    item.querySelector(
                        ".language-level"
                    )?.value.trim() || "";

                if (
                    !languageName &&
                    !level
                ) {
                    return;
                }

                languages.push({

                    language_name:
                        languageName || null,

                    level:
                        level || null
                });
            }
        );

        return languages;
    }


    function updateLanguagePreview() {

        if (!languagePreview) {
            return;
        }

        const languages =
            collectLanguages();

        languagePreview.innerHTML = `
            <h2>Ngoại ngữ</h2>

            <div class="preview-content"></div>
        `;

        const content =
            languagePreview.querySelector(
                ".preview-content"
            );

        if (!languages.length) {

            content.innerHTML = `
                <div class="empty-line"></div>
            `;

            return;
        }

        languages.forEach(
            (language) => {

                const previewItem =
                    document.createElement("div");

                previewItem.className =
                    "preview-item";

                previewItem.innerHTML = `
                    <div class="preview-item-title">
                        ${escapeHTML(
                            language.language_name ||
                            "Ngôn ngữ"
                        )}
                    </div>

                    <div class="preview-item-info">
                        ${escapeHTML(
                            language.level ||
                            "Trình độ"
                        )}
                    </div>
                `;

                content.appendChild(
                    previewItem
                );
            }
        );
    }


    addLanguage?.addEventListener(
        "click",
        () => {

            if (!languageList) {
                return;
            }

            const item =
                createLanguageItem();

            languageList.appendChild(item);

            updateLanguageNumbers();
            updateLanguagePreview();
        }
    );


    languageList?.addEventListener(
        "click",
        (event) => {

            const button =
                event.target.closest(
                    '[data-action="remove-language"]'
                );

            if (!button) {
                return;
            }

            const item =
                button.closest(
                    ".language-item"
                );

            if (!item) {
                return;
            }

            item.remove();

            updateLanguageNumbers();
            updateLanguagePreview();
        }
    );


    languageList?.addEventListener(
        "input",
        (event) => {

            if (
                event.target.matches("input")
            ) {
                updateLanguagePreview();
            }
        }
    );


    /* parse dữ liệu */

    function parseArrayData(data) {

        if (!data) {
            return [];
        }

        if (typeof data === "string") {

            try {

                const parsed =
                    JSON.parse(data);

                return Array.isArray(parsed)
                    ? parsed
                    : [];

            } catch {

                return [];
            }
        }

        return Array.isArray(data)
            ? data
            : [];
    }


    /* thu thập toàn bộ cv */

    function collectCVData() {

        const titleInput =
            document.getElementById("cvTitle");

        const emailInput =
            document.getElementById("email");

        const phoneInput =
            document.getElementById("phone");

        const addressInput =
            document.getElementById("address");

        const title =
            titleInput?.value.trim() ||
            "CV chưa đặt tên";

        const fullName =
            fullNameInput?.value.trim() || "";

        const position =
            positionInput?.value.trim() || "";

        const summary =
            summaryInput?.value.trim() || "";

        const email =
            emailInput?.value.trim() || "";

        const phone =
            phoneInput?.value.trim() || "";

        const address =
            addressInput?.value.trim() || "";

        const primaryColor =
            cvPreview.style
                .getPropertyValue("--accent")
                .trim() ||
            "#2F7867";

        const activeLayout =
            document.querySelector(
                ".layout-btn.active"
            );

        const template =
            activeLayout?.dataset.layout ||
            "layout1";

        return {

            title,

            full_name:
                fullName,

            position,

            summary,

            skills:
                collectSkills(),

            soft_skills:
                collectSoftSkills(),

            email,

            phone,

            address,

            primary_color:
                primaryColor,

            template,

            languages:
                collectLanguages(),

            experiences:
                collectExperiences(),

            educations:
                collectEducations()
        };
    }


    /* validate */

    function validateCVData(data) {

        if (!data.full_name) {

            alert(
                "Vui lòng nhập họ và tên"
            );

            fullNameInput?.focus();

            return false;
        }


        if (data.email) {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailRegex.test(
                    data.email
                )
            ) {

                alert(
                    "Email không hợp lệ"
                );

                document
                    .getElementById("email")
                    ?.focus();

                return false;
            }
        }


        if (
            data.skills &&
            data.skills.length > 1000
        ) {

            alert(
                "Kỹ năng chuyên môn không được vượt quá 1000 ký tự"
            );

            skillsInput?.focus();

            return false;
        }


        if (
            data.soft_skills &&
            data.soft_skills.length > 1000
        ) {

            alert(
                "Kỹ năng mềm không được vượt quá 1000 ký tự"
            );

            softSkillsInput?.focus();

            return false;
        }


        for (
            const experience
            of data.experiences
        ) {

            if (
                experience.time_range &&
                experience.time_range.length > 100
            ) {

                alert(
                    "Thời gian kinh nghiệm không được vượt quá 100 ký tự"
                );

                return false;
            }

            if (
                experience.position &&
                experience.position.length > 150
            ) {

                alert(
                    "Chức danh kinh nghiệm không được vượt quá 150 ký tự"
                );

                return false;
            }

            if (
                experience.company &&
                experience.company.length > 200
            ) {

                alert(
                    "Tên công ty không được vượt quá 200 ký tự"
                );

                return false;
            }
        }


        for (
            const education
            of data.educations
        ) {

            if (
                education.time_range &&
                education.time_range.length > 100
            ) {

                alert(
                    "Thời gian học vấn không được vượt quá 100 ký tự"
                );

                return false;
            }

            if (
                education.degree &&
                education.degree.length > 200
            ) {

                alert(
                    "Bằng cấp không được vượt quá 200 ký tự"
                );

                return false;
            }

            if (
                education.school &&
                education.school.length > 200
            ) {

                alert(
                    "Tên trường không được vượt quá 200 ký tự"
                );

                return false;
            }
        }


        for (
            const language
            of data.languages
        ) {

            if (!language.language_name) {

                alert(
                    "Vui lòng nhập tên ngoại ngữ"
                );

                return false;
            }

            if (
                language.language_name.length > 100
            ) {

                alert(
                    "Tên ngoại ngữ không được vượt quá 100 ký tự"
                );

                return false;
            }

            if (
                language.level &&
                language.level.length > 100
            ) {

                alert(
                    "Trình độ ngoại ngữ không được vượt quá 100 ký tự"
                );

                return false;
            }
        }


        return true;
    }


    /* điền form khi edit */

    function fillCVForm(cv) {

        console.log(
            "Dữ liệu CV nhận được:",
            cv
        );


        const titleInput =
            document.getElementById("cvTitle");

        const emailInput =
            document.getElementById("email");

        const phoneInput =
            document.getElementById("phone");

        const addressInput =
            document.getElementById("address");


        if (titleInput) {
            titleInput.value =
                cv.title || "";
        }

        if (fullNameInput) {
            fullNameInput.value =
                cv.full_name || "";
        }

        if (positionInput) {
            positionInput.value =
                cv.position || "";
        }

        if (summaryInput) {
            summaryInput.value =
                cv.summary || "";
        }

        if (emailInput) {
            emailInput.value =
                cv.email || "";
        }

        if (phoneInput) {
            phoneInput.value =
                cv.phone || "";
        }

        if (addressInput) {
            addressInput.value =
                cv.address || "";
        }


        /* kỹ năng */

        if (skillsInput) {

            skillsInput.value =
                cv.skills || "";
        }

        if (softSkillsInput) {

            softSkillsInput.value =
                cv.soft_skills || "";
        }


        /* màu */

        const color =
            cv.primary_color ||
            "#2F7867";

        cvPreview.style.setProperty(
            "--accent",
            color
        );

        colorButtons.forEach(
            (button) => {

                const buttonColor =
                    button.dataset.color;

                button.classList.toggle(
                    "active",
                    Boolean(
                        buttonColor &&
                        buttonColor.toLowerCase() ===
                        color.toLowerCase()
                    )
                );
            }
        );


        /* bố cục */

        const template =
            cv.template ||
            "layout1";

        cvPreview.classList.remove(
            "layout1",
            "layout2",
            "layout3",
            "layout4"
        );

        cvPreview.classList.add(
            template
        );

        layoutButtons.forEach(
            (button) => {

                button.classList.toggle(
                    "active",
                    button.dataset.layout ===
                    template
                );
            }
        );


        /* kinh nghiệm */

        if (experienceList) {

            experienceList.innerHTML = "";
            experienceCount = 0;

            const experiences =
                parseArrayData(
                    cv.experiences
                );

            experiences.forEach(
                (experience) => {

                    const item =
                        createExperienceItem({

                            position:
                                experience.position,

                            time_range:
                                experience.time_range,

                            company:
                                experience.company,

                            description:
                                experience.description
                        });

                    experienceList.appendChild(
                        item
                    );
                }
            );

            if (!experiences.length) {

                experienceList.appendChild(
                    createExperienceItem()
                );
            }

            updateExperienceNumbers();
            updateExperiencePreview();
        }


        /* học vấn */

        if (educationList) {

            educationList.innerHTML = "";
            educationCount = 0;

            const educations =
                parseArrayData(
                    cv.educations
                );

            educations.forEach(
                (education) => {

                    const item =
                        createEducationItem({

                            degree:
                                education.degree,

                            time_range:
                                education.time_range,

                            school:
                                education.school
                        });

                    educationList.appendChild(
                        item
                    );
                }
            );

            if (!educations.length) {

                educationList.appendChild(
                    createEducationItem()
                );
            }

            updateEducationNumbers();
            updateEducationPreview();
        }


        /* ngoại ngữ */

        if (languageList) {

            languageList.innerHTML = "";
            languageCount = 0;

            const languages =
                parseArrayData(
                    cv.languages
                );

            languages.forEach(
                (language) => {

                    const languageName =
                        language.language_name ||
                        language.name ||
                        language.language ||
                        "";

                    const level =
                        language.level ||
                        language.proficiency ||
                        language.language_level ||
                        "";

                    const item =
                        createLanguageItem({

                            language_name:
                                languageName,

                            level
                        });

                    languageList.appendChild(
                        item
                    );
                }
            );

            if (!languages.length) {

                languageList.appendChild(
                    createLanguageItem()
                );
            }

            updateLanguageNumbers();
            updateLanguagePreview();
        }


        /* cập nhật preview */

        updatePersonalInfo();
        updateSkillsPreview();
        updateSoftSkillsPreview();
        updateLanguagePreview();


        /* đổi giao diện edit */

        if (saveCvButton) {

            saveCvButton.textContent =
                "Cập nhật CV";
        }

        const pageTitle =
            document.getElementById(
                "pageTitle"
            );

        if (pageTitle) {

            pageTitle.textContent =
                "Chỉnh sửa CV";
        }
    }


    /* load cv khi edit */

    async function loadCVForEdit() {

        if (!isEditMode) {
            return;
        }

        const token =
            localStorage.getItem("token");

        if (!token) {

            alert(
                "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại."
            );

            window.location.href =
                "../auth/login.html";

            return;
        }


        if (saveCvButton) {

            saveCvButton.disabled = true;

            saveCvButton.textContent =
                "Đang tải...";
        }


        try {

            const response =
                await fetch(
                    `http://localhost:3000/api/cvs/${encodeURIComponent(
                        editCvId
                    )}`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            if (response.status === 401) {

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "userId"
                );

                alert(
                    "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại."
                );

                window.location.href =
                    "../auth/login.html";

                return;
            }


            let result = null;

            try {

                result =
                    await response.json();

            } catch {

                throw new Error(
                    "Server trả về dữ liệu không hợp lệ"
                );
            }


            if (!response.ok) {

                throw new Error(
                    result?.message ||
                    "Không thể tải CV"
                );
            }


            const cv =
                result?.data ||
                result?.cv ||
                result;


            if (!cv) {

                throw new Error(
                    "Không tìm thấy dữ liệu CV"
                );
            }

            fillCVForm(cv);

        } catch (error) {

            console.error(
                "LOAD CV ERROR:",
                error
            );

            alert(
                error.message ||
                "Không thể tải CV"
            );

            window.location.href =
                "../home/home.html";

        } finally {

            if (saveCvButton) {

                saveCvButton.disabled = false;

                saveCvButton.textContent =
                    isEditMode
                        ? "Cập nhật CV"
                        : "Lưu CV";
            }
        }
    }


    /* đổi bố cục */

    layoutButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    const layout =
                        button.dataset.layout;

                    if (!layout) {
                        return;
                    }

                    layoutButtons.forEach(
                        (btn) => {
                            btn.classList.remove(
                                "active"
                            );
                        }
                    );

                    button.classList.add(
                        "active"
                    );

                    cvPreview.classList.remove(
                        "layout1",
                        "layout2",
                        "layout3",
                        "layout4"
                    );

                    cvPreview.classList.add(
                        layout
                    );
                }
            );
        }
    );


    /* đổi màu */

    colorButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    const color =
                        button.dataset.color;

                    if (!color) {
                        return;
                    }

                    cvPreview.style.setProperty(
                        "--accent",
                        color
                    );

                    colorButtons.forEach(
                        (btn) => {
                            btn.classList.remove(
                                "active"
                            );
                        }
                    );

                    button.classList.add(
                        "active"
                    );
                }
            );
        }
    );


    /* lưu cv */

    async function saveCV() {

        const token =
            localStorage.getItem("token");

        if (!token) {

            alert(
                "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại."
            );

            window.location.href =
                "../auth/login.html";

            return;
        }


        const cvData =
            collectCVData();


        console.log(
            "Dữ liệu CV gửi lên:",
            cvData
        );


        if (!validateCVData(cvData)) {
            return;
        }


        if (saveCvButton) {

            saveCvButton.disabled = true;

            saveCvButton.dataset.oldText =
                saveCvButton.textContent;

            saveCvButton.textContent =
                isEditMode
                    ? "Đang cập nhật..."
                    : "Đang lưu...";
        }


        try {

            const url =
                isEditMode
                    ? `http://localhost:3000/api/cvs/${encodeURIComponent(
                        editCvId
                    )}`
                    : "http://localhost:3000/api/cvs";

            const method =
                isEditMode
                    ? "PUT"
                    : "POST";


            const response =
                await fetch(
                    url,
                    {
                        method,

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify(
                                cvData
                            )
                    }
                );


            const responseText =
                await response.text();

            let result = {};

            try {

                result =
                    responseText
                        ? JSON.parse(
                            responseText
                        )
                        : {};

            } catch {

                throw new Error(
                    responseText ||
                    `Server trả về dữ liệu không hợp lệ (${response.status})`
                );
            }


            if (response.status === 401) {

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "userId"
                );

                alert(
                    "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại."
                );

                window.location.href =
                    "../auth/login.html";

                return;
            }


            if (!response.ok) {

                throw new Error(
                    result?.message ||
                    (
                        isEditMode
                            ? "Không thể cập nhật CV"
                            : "Không thể lưu CV"
                    )
                );
            }


            console.log(
                isEditMode
                    ? "CV đã cập nhật:"
                    : "CV đã lưu:",
                result?.data
            );


            const savedId =
                result?.data?.id ||
                editCvId;


            if (savedId) {

                localStorage.setItem(
                    "currentCvId",
                    savedId
                );
            }


            sessionStorage.setItem(
                "toastMessage",
                isEditMode
                    ? "Cập nhật CV thành công!"
                    : "Lưu CV thành công!"
            );


            window.location.href =
                "../home/home.html";

        } catch (error) {

            console.error(
                "SAVE CV ERROR:",
                error
            );

            alert(
                error.message ||
                (
                    isEditMode
                        ? "Có lỗi xảy ra khi cập nhật CV"
                        : "Có lỗi xảy ra khi lưu CV"
                )
            );

        } finally {

            if (saveCvButton) {

                saveCvButton.disabled = false;

                saveCvButton.textContent =
                    saveCvButton.dataset.oldText ||
                    (
                        isEditMode
                            ? "Cập nhật CV"
                            : "Lưu CV"
                    );
            }
        }
    }


    /* gắn nút lưu */

    saveCvButton?.addEventListener(
        "click",
        saveCV
    );


    /* khởi tạo ngoại ngữ */

    normalizeLanguageItems();


    /* cv mới */

    if (
        !isEditMode &&
        experienceList &&
        experienceList.children.length === 0
    ) {

        experienceList.appendChild(
            createExperienceItem()
        );
    }


    if (
        !isEditMode &&
        educationList &&
        educationList.children.length === 0
    ) {

        educationList.appendChild(
            createEducationItem()
        );
    }


    if (
        !isEditMode &&
        languageList &&
        languageList.children.length === 0
    ) {

        languageList.appendChild(
            createLanguageItem()
        );
    }


    /* khởi tạo số lượng */

    updateExperienceNumbers();
    updateEducationNumbers();
    updateLanguageNumbers();


    /* khởi tạo preview */

    updatePersonalInfo();
    updateSkillsPreview();
    updateSoftSkillsPreview();
    updateLanguagePreview();
    updateExperiencePreview();
    updateEducationPreview();


    /* load cv edit */

    if (isEditMode) {
        loadCVForEdit();
    }

});