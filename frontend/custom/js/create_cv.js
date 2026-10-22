document.addEventListener("DOMContentLoaded", () => {
    initCreateCV();
});


// ======================================================
// GLOBAL
// ======================================================

const API_URL =
    "http://localhost:3000/api/cvs";

let currentCVId = null;

let currentColor = "#2F7867";

let currentLayout = "layout1";


// ======================================================
// INIT
// ======================================================

async function initCreateCV() {

    currentCVId =
        new URLSearchParams(
            window.location.search
        ).get("id");


    setupDynamicItems();

    setupColor();

    setupLayout();

    setupRealtimePreview();

    setupActions();

    updatePreview();


    // Edit CV
    if (currentCVId) {

        await loadCV(
            currentCVId
        );

    }

}


// ======================================================
// ACTIONS
// ======================================================

function setupActions() {

    const saveBtn =
        document.getElementById(
            "saveCvBtn"
        );

    const cancelBtn =
        document.getElementById(
            "cancelCV"
        );


    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            saveCV
        );

    }


    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../home/home.html";

            }
        );

    }

}


// ======================================================
// DYNAMIC ITEMS
// ======================================================

function setupDynamicItems() {

    const buttons = [

        [
            "addProfessionalSkill",
            addProfessionalSkillItem
        ],

        [
            "addExperience",
            addExperienceItem
        ],

        [
            "addEducation",
            addEducationItem
        ],

        [
            "addProject",
            addProjectItem
        ],

        [
            "addLanguage",
            addLanguageItem
        ],

        [
            "addActivity",
            addActivityItem
        ]

    ];


    buttons.forEach(
        ([id, handler]) => {

            const button =
                document.getElementById(id);


            if (button) {

                button.addEventListener(
                    "click",
                    handler
                );

            }

        }
    );


    setupRemoveButtons();

    updateItemLabels();

}


// ======================================================
// REMOVE BUTTONS
// ======================================================

function setupRemoveButtons() {

    document
        .querySelectorAll(
            ".remove-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const item =
                        button.closest(
                            ".dynamic-item"
                        );


                    if (!item) {
                        return;
                    }


                    removeDynamicItem(
                        item
                    );

                }
            );

        });

}


function setupRemoveButtonForItem(
    item
) {

    const button =
        item.querySelector(
            ".remove-btn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            removeDynamicItem(
                item
            );

        }
    );

}


function removeDynamicItem(
    item
) {

    const list =
        item.parentElement;


    if (!list) {
        return;
    }


    const items =
        list.querySelectorAll(
            ".dynamic-item"
        );


    /*
     * Luôn giữ lại ít nhất
     * một mục.
     */
    if (items.length <= 1) {

        clearDynamicItem(
            item
        );

    } else {

        item.remove();

    }


    updateItemLabels();

    updatePreview();

}


function clearDynamicItem(
    item
) {

    item
        .querySelectorAll(
            "input, textarea"
        )
        .forEach(input => {

            input.value = "";

        });

}


// ======================================================
// ITEM LABEL
// ======================================================

function updateItemLabels() {

    const lists = [

        "#professionalSkillList",

        "#experienceList",

        "#educationList",

        "#projectList",

        "#activityList"

    ];


    lists.forEach(
        selector => {

            const list =
                document.querySelector(
                    selector
                );


            if (!list) {
                return;
            }


            list
                .querySelectorAll(
                    ".dynamic-item"
                )
                .forEach(
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

        }
    );

}


// ======================================================
// ADD PROFESSIONAL SKILL
// ======================================================

function addProfessionalSkillItem() {

    const list =
        document.getElementById(
            "professionalSkillList"
        );


    if (!list) {
        return;
    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "dynamic-item professional-skill-item";


    item.innerHTML = `

        <div class="dynamic-item-header">

            <span class="item-label">
                Mục
            </span>

            <button
                type="button"
                class="remove-btn"
            >
                Xóa
            </button>

        </div>


        <div class="form-group">

            <label>
                Vị trí / lĩnh vực
            </label>

            <input
                type="text"
                class="professional-skill-position"
                placeholder="Frontend Developer"
            >

        </div>


        <div class="form-group">

            <label>
                Công nghệ sử dụng
            </label>

            <input
                type="text"
                class="professional-skill-technologies"
                placeholder="HTML, CSS, JavaScript, React..."
            >

            <small class="form-hint">
                Ngăn cách các công nghệ bằng dấu phẩy.
            </small>

        </div>

    `;


    list.appendChild(
        item
    );


    setupRemoveButtonForItem(
        item
    );

    setupRealtimeForElement(
        item
    );

    updateItemLabels();

    updatePreview();

}


// ======================================================
// ADD EXPERIENCE
// ======================================================

function addExperienceItem() {

    const list =
        document.getElementById(
            "experienceList"
        );


    if (!list) {
        return;
    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "dynamic-item experience-item";


    item.innerHTML = `

        <div class="dynamic-item-header">

            <span class="item-label">
                Mục
            </span>

            <button
                type="button"
                class="remove-btn"
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
                >

            </div>


            <div class="form-group">

                <label>
                    Thời gian
                </label>

                <input
                    type="text"
                    class="experience-time"
                    placeholder="2024 – nay"
                >

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
            >

        </div>


        <div class="form-group">

            <label>
                Mô tả công việc
            </label>

            <textarea
                class="experience-description"
                rows="4"
                placeholder="Mô tả công việc đã đảm nhiệm..."
            ></textarea>

        </div>

    `;


    list.appendChild(
        item
    );


    setupRemoveButtonForItem(
        item
    );

    setupRealtimeForElement(
        item
    );

    updateItemLabels();

    updatePreview();

}


// ======================================================
// ADD EDUCATION
// ======================================================

function addEducationItem() {

    const list =
        document.getElementById(
            "educationList"
        );


    if (!list) {
        return;
    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "dynamic-item education-item";


    item.innerHTML = `

        <div class="dynamic-item-header">

            <span class="item-label">
                Mục
            </span>

            <button
                type="button"
                class="remove-btn"
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
                >

            </div>


            <div class="form-group">

                <label>
                    Thời gian
                </label>

                <input
                    type="text"
                    class="education-time"
                    placeholder="2020 – 2024"
                >

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
            >

        </div>


        <div class="form-group">

            <label>
                GPA
            </label>

            <input
                type="number"
                class="education-gpa"
                min="0"
                max="4"
                step="0.01"
                placeholder="Ví dụ: 3.03"
            >

        </div>

    `;


    list.appendChild(
        item
    );


    setupRemoveButtonForItem(
        item
    );

    setupRealtimeForElement(
        item
    );

    updateItemLabels();

    updatePreview();

}


// ======================================================
// ADD PROJECT
// ======================================================

function addProjectItem() {

    const list =
        document.getElementById(
            "projectList"
        );


    if (!list) {
        return;
    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "dynamic-item project-item";


    item.innerHTML = `

        <div class="dynamic-item-header">

            <span class="item-label">
                Mục
            </span>

            <button
                type="button"
                class="remove-btn"
            >
                Xóa
            </button>

        </div>


        <div class="form-group">

            <label>
                Tên dự án
            </label>

            <input
                type="text"
                class="project-name"
                placeholder="CV Studio"
            >

        </div>


        <div class="form-group">

            <label>
                Công nghệ sử dụng
            </label>

            <input
                type="text"
                class="project-technologies"
                placeholder="HTML, CSS, JavaScript, Node.js, MySQL..."
            >

            <small class="form-hint">
                Ngăn cách các công nghệ bằng dấu phẩy.
            </small>

        </div>


        <div class="form-group">

            <label>
                Mô tả dự án
            </label>

            <textarea
                class="project-description"
                rows="4"
                placeholder="Mô tả ngắn gọn về dự án, chức năng và công việc bạn đã thực hiện..."
            ></textarea>

        </div>

    `;


    list.appendChild(
        item
    );


    setupRemoveButtonForItem(
        item
    );

    setupRealtimeForElement(
        item
    );

    updateItemLabels();

    updatePreview();

}


// ======================================================
// ADD LANGUAGE
// ======================================================

function addLanguageItem() {

    const list =
        document.getElementById(
            "languageList"
        );


    if (!list) {
        return;
    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "dynamic-item language-item";


    item.innerHTML = `

        <div class="form-row">

            <div class="form-group">

                <label>
                    Ngôn ngữ
                </label>

                <input
                    type="text"
                    class="language-name"
                    placeholder="Ví dụ: Tiếng Anh"
                >

            </div>


            <div class="form-group">

                <label>
                    Trình độ
                </label>

                <input
                    type="text"
                    class="language-level"
                    placeholder="Ví dụ: B2, N1..."
                >

            </div>

        </div>

    `;


    list.appendChild(
        item
    );


    setupRealtimeForElement(
        item
    );

}


// ======================================================
// ADD ACTIVITY
// ======================================================

function addActivityItem() {

    const list =
        document.getElementById(
            "activityList"
        );


    if (!list) {
        return;
    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "dynamic-item activity-item";


    item.innerHTML = `

        <div class="dynamic-item-header">

            <span class="item-label">
                Mục
            </span>

            <button
                type="button"
                class="remove-btn"
            >
                Xóa
            </button>

        </div>


        <div class="form-row">

            <div class="form-group">

                <label>
                    Tên hoạt động
                </label>

                <input
                    type="text"
                    class="activity-name"
                    placeholder="CLB Lập trình"
                >

            </div>


            <div class="form-group">

                <label>
                    Năm
                </label>

                <input
                    type="text"
                    class="activity-year"
                    placeholder="2024 – 2025"
                >

            </div>

        </div>


        <div class="form-group">

            <label>
                Mô tả
            </label>

            <textarea
                class="activity-description"
                rows="4"
                placeholder="Mô tả hoạt động, vai trò hoặc thành tích..."
            ></textarea>

        </div>

    `;


    list.appendChild(
        item
    );


    setupRemoveButtonForItem(
        item
    );

    setupRealtimeForElement(
        item
    );

    updateItemLabels();

    updatePreview();

}


// ======================================================
// COLOR
// ======================================================

function setupColor() {

    const buttons =
        document.querySelectorAll(
            ".color-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    currentColor =
                        button.dataset.color ||
                        "#2F7867";


                    buttons.forEach(
                        btn => {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    applyColor();

                }
            );

        }
    );

}


function applyColor() {

    const preview =
        document.getElementById(
            "cvPreview"
        );


    if (!preview) {
        return;
    }


    preview.style.setProperty(
        "--primary-color",
        currentColor
    );


    const header =
        preview.querySelector(
            ".cv-header"
        );


    if (header) {

        header.style.backgroundColor =
            currentColor;

    }

}


// ======================================================
// LAYOUT
// ======================================================

function setupLayout() {

    const buttons =
        document.querySelectorAll(
            ".layout-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const layout =
                        button.dataset.layout;


                    if (!layout) {
                        return;
                    }


                    currentLayout =
                        layout;


                    buttons.forEach(
                        btn => {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    applyLayout();

                }
            );

        }
    );

}


function applyLayout() {

    const preview =
        document.getElementById(
            "cvPreview"
        );


    if (!preview) {
        return;
    }


    preview.classList.remove(
        "layout1",
        "layout2",
        "layout3",
        "layout4"
    );


    preview.classList.add(
        currentLayout
    );

}


// ======================================================
// REALTIME
// ======================================================

function setupRealtimePreview() {

    document
        .querySelectorAll(
            ".editor input, .editor textarea"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "input",
                    updatePreview
                );

            }
        );

}


function setupRealtimeForElement(
    element
) {

    element
        .querySelectorAll(
            "input, textarea"
        )
        .forEach(
            input => {

                input.addEventListener(
                    "input",
                    updatePreview
                );

            }
        );

}


// ======================================================
// UPDATE PREVIEW
// ======================================================

function updatePreview() {

    updateBasicPreview();

    updateExperiencePreview();

    updateEducationPreview();

    updateSoftSkillPreview();

    updateProfessionalSkillPreview();

    updateProjectPreview();

    updateLanguagePreview();

    updateActivityPreview();

    applyColor();

}


// ======================================================
// BASIC PREVIEW
// ======================================================

function updateBasicPreview() {

    const name =
        getValue("fullName") ||
        "Họ và tên";


    const position =
        getValue("position") ||
        "Chức danh";


    const summary =
        getValue("summary") ||
        "Giới thiệu bản thân";


    const previewName =
        document.getElementById(
            "previewName"
        );


    const previewPosition =
        document.getElementById(
            "previewPosition"
        );


    const previewSummary =
        document.getElementById(
            "previewSummary"
        );


    if (previewName) {

        previewName.textContent =
            name;

    }


    if (previewPosition) {

        previewPosition.textContent =
            position;

    }


    if (previewSummary) {

        previewSummary.textContent =
            summary;

    }

}


// ======================================================
// EXPERIENCE PREVIEW
// ======================================================

function updateExperiencePreview() {

    const section =
        document.getElementById(
            "experiencePreview"
        );


    if (!section) {
        return;
    }


    const items =
        getExperiences();


    let html =
        "<h2>Kinh nghiệm</h2>";


    const validItems =
        items.filter(
            item =>
                item.position ||
                item.time_range ||
                item.company ||
                item.description
        );


    if (!validItems.length) {

        section.innerHTML =
            html +
            '<div class="empty-line"></div>';

        return;

    }


    validItems.forEach(
        item => {

            html += `

                <div class="preview-item">

                    ${
                        item.position
                            ? `<strong>${escapeHTML(item.position)}</strong>`
                            : ""
                    }

                    ${
                        item.time_range
                            ? `<span>${escapeHTML(item.time_range)}</span>`
                            : ""
                    }

                    ${
                        item.company
                            ? `<div>${escapeHTML(item.company)}</div>`
                            : ""
                    }

                    ${
                        item.description
                            ? `<p>${formatText(item.description)}</p>`
                            : ""
                    }

                </div>

            `;

        }
    );


    section.innerHTML =
        html;

}


// ======================================================
// EDUCATION PREVIEW
// ======================================================

function updateEducationPreview() {

    const section =
        document.getElementById(
            "educationPreview"
        );


    if (!section) {
        return;
    }


    const items =
        getEducations();


    let html =
        "<h2>Học vấn</h2>";


    const validItems =
        items.filter(
            item =>
                item.degree ||
                item.time_range ||
                item.school ||
                item.gpa
        );


    if (!validItems.length) {

        section.innerHTML =
            html +
            '<div class="empty-line"></div>';

        return;

    }


    validItems.forEach(
        item => {

            html += `

                <div class="preview-item">

                    ${
                        item.degree
                            ? `<strong>${escapeHTML(item.degree)}</strong>`
                            : ""
                    }

                    ${
                        item.time_range
                            ? `<span>${escapeHTML(item.time_range)}</span>`
                            : ""
                    }

                    ${
                        item.school
                            ? `<div>${escapeHTML(item.school)}</div>`
                            : ""
                    }

                    ${
                        item.gpa !== ""
                            ? `<p>GPA: ${escapeHTML(item.gpa)}</p>`
                            : ""
                    }

                </div>

            `;

        }
    );


    section.innerHTML =
        html;

}


// ======================================================
// SOFT SKILL PREVIEW
// ======================================================

function updateSoftSkillPreview() {

    const section =
        document.getElementById(
            "softSkillPreview"
        );


    if (!section) {
        return;
    }


    const value =
        getValue("softSkills");


    const skills =
        splitComma(value);


    let html =
        "<h2>Kỹ năng mềm</h2>";


    if (!skills.length) {

        section.innerHTML =
            html +
            '<div class="empty-line"></div>';

        return;

    }


    html += `

        <p>
            ${escapeHTML(
                skills.join(", ")
            )}
        </p>

    `;


    section.innerHTML =
        html;

}


// ======================================================
// PROFESSIONAL SKILL PREVIEW
// ======================================================

function updateProfessionalSkillPreview() {

    const section =
        document.getElementById(
            "professionalSkillPreview"
        );


    if (!section) {
        return;
    }


    const items =
        getProfessionalSkills();


    let html =
        "<h2>Kỹ năng chuyên môn</h2>";


    const validItems =
        items.filter(
            item =>
                item.position ||
                item.technologies
        );


    if (!validItems.length) {

        section.innerHTML =
            html +
            '<div class="empty-line"></div>';

        return;

    }


    validItems.forEach(
        item => {

            const technologies =
                splitComma(
                    item.technologies
                );


            html += `

                <div class="preview-item">

                    ${
                        item.position
                            ? `<strong>${escapeHTML(item.position)}</strong>`
                            : ""
                    }

                    ${
                        technologies.length
                            ? `
                                <p>
                                    ${escapeHTML(
                                        technologies.join(", ")
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

            `;

        }
    );


    section.innerHTML =
        html;

}


// ======================================================
// PROJECT PREVIEW
// ======================================================

function updateProjectPreview() {

    const section =
        document.getElementById(
            "projectPreview"
        );


    if (!section) {
        return;
    }


    const items =
        getProjects();


    let html =
        "<h2>Dự án</h2>";


    const validItems =
        items.filter(
            item =>
                item.project_name ||
                item.technologies ||
                item.description
        );


    if (!validItems.length) {

        section.innerHTML =
            html +
            '<div class="empty-line"></div>';

        return;

    }


    validItems.forEach(
        item => {

            const technologies =
                splitComma(
                    item.technologies
                );


            html += `

                <div class="preview-item">

                    ${
                        item.project_name
                            ? `<strong>${escapeHTML(item.project_name)}</strong>`
                            : ""
                    }

                    ${
                        technologies.length
                            ? `
                                <p>
                                    ${escapeHTML(
                                        technologies.join(", ")
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${
                        item.description
                            ? `<p>${formatText(item.description)}</p>`
                            : ""
                    }

                </div>

            `;

        }
    );


    section.innerHTML =
        html;

}


// ======================================================
// LANGUAGE PREVIEW
// ======================================================

function updateLanguagePreview() {

    const section =
        document.getElementById(
            "languagePreview"
        );


    if (!section) {
        return;
    }


    const items =
        getLanguages();


    let html =
        "<h2>Ngoại ngữ</h2>";


    if (!items.length) {

        section.innerHTML =
            html +
            '<div class="empty-line"></div>';

        return;

    }


    items.forEach(
        item => {

            html += `

                <div class="preview-item">

                    ${
                        item.name
                            ? `<strong>${escapeHTML(item.name)}</strong>`
                            : ""
                    }

                    ${
                        item.level
                            ? `<span>${escapeHTML(item.level)}</span>`
                            : ""
                    }

                </div>

            `;

        }
    );


    section.innerHTML =
        html;

}


// ======================================================
// ACTIVITY PREVIEW
// ======================================================

function updateActivityPreview() {

    const section =
        document.getElementById(
            "activityPreview"
        );


    if (!section) {
        return;
    }


    const items =
        getActivities();


    let html =
        "<h2>Hoạt động</h2>";


    const validItems =
        items.filter(
            item =>
                item.activity_name ||
                item.activity_year ||
                item.description
        );


    if (!validItems.length) {

        section.innerHTML =
            html +
            '<div class="empty-line"></div>';

        return;

    }


    validItems.forEach(
        item => {

            html += `

                <div class="preview-item">

                    ${
                        item.activity_name
                            ? `<strong>${escapeHTML(item.activity_name)}</strong>`
                            : ""
                    }

                    ${
                        item.activity_year
                            ? `<span>${escapeHTML(item.activity_year)}</span>`
                            : ""
                    }

                    ${
                        item.description
                            ? `<p>${formatText(item.description)}</p>`
                            : ""
                    }

                </div>

            `;

        }
    );


    section.innerHTML =
        html;

}


// ======================================================
// GET EXPERIENCES
// ======================================================

function getExperiences() {

    return Array.from(
        document.querySelectorAll(
            ".experience-item"
        )
    ).map(
        item => ({

            position:
                getItemValue(
                    item,
                    ".experience-position"
                ),

            time_range:
                getItemValue(
                    item,
                    ".experience-time"
                ),

            company:
                getItemValue(
                    item,
                    ".experience-company"
                ),

            description:
                getItemValue(
                    item,
                    ".experience-description"
                )

        })
    );

}


// ======================================================
// GET EDUCATIONS
// ======================================================

function getEducations() {

    return Array.from(
        document.querySelectorAll(
            ".education-item"
        )
    ).map(
        item => ({

            degree:
                getItemValue(
                    item,
                    ".education-degree"
                ),

            time_range:
                getItemValue(
                    item,
                    ".education-time"
                ),

            school:
                getItemValue(
                    item,
                    ".education-school"
                ),

            gpa:
                getItemValue(
                    item,
                    ".education-gpa"
                )

        })
    );

}


// ======================================================
// GET PROFESSIONAL SKILLS
// ======================================================

function getProfessionalSkills() {

    return Array.from(
        document.querySelectorAll(
            ".professional-skill-item"
        )
    ).map(
        item => ({

            position:
                getItemValue(
                    item,
                    ".professional-skill-position"
                ),

            technologies:
                getItemValue(
                    item,
                    ".professional-skill-technologies"
                )

        })
    );

}


// ======================================================
// GET PROJECTS
// ======================================================

function getProjects() {

    return Array.from(
        document.querySelectorAll(
            ".project-item"
        )
    ).map(
        item => ({

            project_name:
                getItemValue(
                    item,
                    ".project-name"
                ),

            technologies:
                getItemValue(
                    item,
                    ".project-technologies"
                ),

            description:
                getItemValue(
                    item,
                    ".project-description"
                )

        })
    );

}


// ======================================================
// GET LANGUAGES
// ======================================================

function getLanguages() {

    return Array.from(
        document.querySelectorAll(
            ".language-item"
        )
    ).map(
        item => ({

            name:
                getItemValue(
                    item,
                    ".language-name"
                ),

            level:
                getItemValue(
                    item,
                    ".language-level"
                )

        })
    ).filter(
        item =>
            item.name ||
            item.level
    );

}


// ======================================================
// GET ACTIVITIES
// ======================================================

function getActivities() {

    return Array.from(
        document.querySelectorAll(
            ".activity-item"
        )
    ).map(
        item => ({

            activity_name:
                getItemValue(
                    item,
                    ".activity-name"
                ),

            activity_year:
                getItemValue(
                    item,
                    ".activity-year"
                ),

            description:
                getItemValue(
                    item,
                    ".activity-description"
                )

        })
    );

}


// ======================================================
// GET VALUE
// ======================================================

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return "";
    }


    return element.value.trim();

}


// ======================================================
// GET ITEM VALUE
// ======================================================

function getItemValue(
    item,
    selector
) {

    const element =
        item.querySelector(
            selector
        );


    if (!element) {
        return "";
    }


    return element.value.trim();

}


// ======================================================
// SPLIT COMMA
// ======================================================

function splitComma(value) {

    if (!value) {
        return [];
    }


    return value
        .split(",")
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean);

}


// ======================================================
// FORMAT TEXT
// ======================================================

function formatText(value) {

    return escapeHTML(value)
        .replace(
            /\n/g,
            "<br>"
        );

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ======================================================
// ESCAPE ATTRIBUTE
// ======================================================

function escapeAttribute(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}


// ======================================================
// COLLECT CV DATA
// ======================================================

function collectCVData() {

    return {

        // ==============================================
        // MAIN CV
        // ==============================================

        title:
            getValue("cvTitle"),

        full_name:
            getValue("fullName"),

        position:
            getValue("position"),

        summary:
            getValue("summary"),

        email:
            getValue("email"),

        phone:
            getValue("phone"),

        address:
            getValue("address"),

        git_link:
            getValue("gitLink"),

        /*
         * Một chuỗi TEXT:
         * Giao tiếp, Làm việc nhóm, ...
         */
        soft_skills:
            getValue("softSkills"),

        primary_color:
            currentColor,

        template:
            currentLayout,


        // ==============================================
        // PROFESSIONAL SKILLS
        // ==============================================

        professional_skills:
            getProfessionalSkills()
                .filter(
                    item =>
                        item.position ||
                        item.technologies
                ),


        // ==============================================
        // EXPERIENCES
        // ==============================================

        experiences:
            getExperiences()
                .filter(
                    item =>
                        item.position ||
                        item.time_range ||
                        item.company ||
                        item.description
                ),


        // ==============================================
        // EDUCATIONS
        // ==============================================

        educations:
            getEducations()
                .filter(
                    item =>
                        item.degree ||
                        item.time_range ||
                        item.school ||
                        item.gpa
                ),


        // ==============================================
        // PROJECTS
        // ==============================================

        projects:
            getProjects()
                .filter(
                    item =>
                        item.project_name ||
                        item.technologies ||
                        item.description
                ),


        // ==============================================
        // LANGUAGES
        // ==============================================

        languages:
            getLanguages(),


        // ==============================================
        // ACTIVITIES
        // ==============================================

        activities:
            getActivities()
                .filter(
                    item =>
                        item.activity_name ||
                        item.activity_year ||
                        item.description
                )

    };

}


// ======================================================
// VALIDATE CV
// ======================================================

function validateCV(data) {

    if (!data.title) {

        alert(
            "Vui lòng nhập tên CV."
        );


        document
            .getElementById(
                "cvTitle"
            )
            ?.focus();


        return false;

    }


    if (!data.full_name) {

        alert(
            "Vui lòng nhập họ và tên."
        );


        document
            .getElementById(
                "fullName"
            )
            ?.focus();


        return false;

    }


    if (
        data.email &&
        !isValidEmail(
            data.email
        )
    ) {

        alert(
            "Email không hợp lệ."
        );


        document
            .getElementById(
                "email"
            )
            ?.focus();


        return false;

    }


    // GPA frontend check

    for (
        const education
        of data.educations
    ) {

        if (
            education.gpa !== "" &&
            (
                Number.isNaN(
                    Number(
                        education.gpa
                    )
                ) ||
                Number(
                    education.gpa
                ) < 0 ||
                Number(
                    education.gpa
                ) > 4
            )
        ) {

            alert(
                "GPA phải nằm trong khoảng từ 0 đến 4."
            );

            return false;

        }

    }


    return true;

}


// ======================================================
// EMAIL
// ======================================================

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


// ======================================================
// SAVE CV
// ======================================================

async function saveCV() {

    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        alert(
            "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại."
        );


        window.location.href =
            "../../auth/auth.html";


        return;

    }


    const data =
        collectCVData();


    if (!validateCV(data)) {
        return;
    }


    const isEdit =
        Boolean(
            currentCVId
        );


    const url =
        isEdit
            ? `${API_URL}/${currentCVId}`
            : API_URL;


    const method =
        isEdit
            ? "PUT"
            : "POST";


    const saveButton =
        document.getElementById(
            "saveCvBtn"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Đang lưu...";

    }


    try {

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
                            data
                        )

                }
            );


        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "token"
            );


            window.location.href =
                "../../auth/auth.html";


            return;

        }


        const result =
            await response
                .json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể lưu CV."
            );

        }


        showToast(
            isEdit
                ? "Cập nhật thành công"
                : "Tạo CV thành công",
            isEdit
                ? "CV của bạn đã được cập nhật"
                : "CV của bạn đã được tạo"
        );

        setTimeout(() => {

            window.location.href =
                "../home/home.html";

        }, 1000);


    } catch (error) {

        console.error(
            "SAVE CV ERROR:",
            error
        );


        alert(
            error.message ||
            "Có lỗi xảy ra khi lưu CV."
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Lưu CV";

        }

    }

}


// ======================================================
// LOAD CV
// ======================================================

async function loadCV(
    id
) {

    const token =
        localStorage.getItem(
            "token"
        );


    if (!token) {

        window.location.href =
            "../../auth/auth.html";

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );


        if (
            response.status === 401
        ) {

            localStorage.removeItem(
                "token"
            );


            window.location.href =
                "../../auth/auth.html";


            return;

        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể lấy thông tin CV."
            );

        }


        /*
         * Backend controller trả:
         *
         * {
         *   success: true,
         *   data: {...}
         * }
         */

        const cv =
            result.data;


        if (!cv) {

            throw new Error(
                "Dữ liệu CV không tồn tại."
            );

        }


        fillForm(
            cv
        );


        updatePreview();


    } catch (error) {

        console.error(
            "LOAD CV ERROR:",
            error
        );


        alert(
            error.message ||
            "Không thể tải CV."
        );

    }

}


// ======================================================
// FILL FORM
// ======================================================

function fillForm(
    cv
) {

    // ==============================================
    // MAIN CV
    // ==============================================

    setValue(
        "cvTitle",
        cv.title
    );

    setValue(
        "fullName",
        cv.full_name
    );

    setValue(
        "position",
        cv.position
    );

    setValue(
        "summary",
        cv.summary
    );

    setValue(
        "email",
        cv.email
    );

    setValue(
        "phone",
        cv.phone
    );

    setValue(
        "address",
        cv.address
    );

    setValue(
        "gitLink",
        cv.git_link
    );

    setValue(
        "softSkills",
        cv.soft_skills
    );


    // ==============================================
    // COLOR
    // ==============================================

    currentColor =
        cv.primary_color ||
        "#2F7867";


    setActiveColor(
        currentColor
    );


    // ==============================================
    // LAYOUT
    // ==============================================

    currentLayout =
        cv.template ||
        "layout1";


    setActiveLayoutButton(
        currentLayout
    );


    applyLayout();

    applyColor();


    // ==============================================
    // PROFESSIONAL SKILLS
    // ==============================================

    fillProfessionalSkills(
        cv.professional_skills ||
        []
    );


    // ==============================================
    // EXPERIENCES
    // ==============================================

    fillExperiences(
        cv.experiences ||
        []
    );


    // ==============================================
    // EDUCATIONS
    // ==============================================

    fillEducations(
        cv.educations ||
        []
    );


    // ==============================================
    // PROJECTS
    // ==============================================

    fillProjects(
        cv.projects ||
        []
    );


    // ==============================================
    // LANGUAGES
    // ==============================================

    fillLanguages(
        cv.languages ||
        []
    );


    // ==============================================
    // ACTIVITIES
    // ==============================================

    fillActivities(
        cv.activities ||
        []
    );

}


// ======================================================
// SET VALUE
// ======================================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.value =
        value ?? "";

}


// ======================================================
// FILL PROFESSIONAL SKILLS
// ======================================================

function fillProfessionalSkills(
    items
) {

    const list =
        document.getElementById(
            "professionalSkillList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        addProfessionalSkillItem();

        return;

    }


    items.forEach(
        item => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "dynamic-item professional-skill-item";


            wrapper.innerHTML = `

                <div class="dynamic-item-header">

                    <span class="item-label">
                        Mục
                    </span>

                    <button
                        type="button"
                        class="remove-btn"
                    >
                        Xóa
                    </button>

                </div>


                <div class="form-group">

                    <label>
                        Vị trí / lĩnh vực
                    </label>

                    <input
                        type="text"
                        class="professional-skill-position"
                        value="${escapeAttribute(
                            item.position
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Công nghệ sử dụng
                    </label>

                    <input
                        type="text"
                        class="professional-skill-technologies"
                        value="${escapeAttribute(
                            item.technologies
                        )}"
                    >

                    <small class="form-hint">
                        Ngăn cách các công nghệ bằng dấu phẩy.
                    </small>

                </div>

            `;


            list.appendChild(
                wrapper
            );


            setupRemoveButtonForItem(
                wrapper
            );

            setupRealtimeForElement(
                wrapper
            );

        }
    );


    updateItemLabels();

}


// ======================================================
// FILL EXPERIENCES
// ======================================================

function fillExperiences(
    items
) {

    const list =
        document.getElementById(
            "experienceList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        addExperienceItem();

        return;

    }


    items.forEach(
        item => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "dynamic-item experience-item";


            wrapper.innerHTML = `

                <div class="dynamic-item-header">

                    <span class="item-label">
                        Mục
                    </span>

                    <button
                        type="button"
                        class="remove-btn"
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
                            value="${escapeAttribute(
                                item.position
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Thời gian
                        </label>

                        <input
                            type="text"
                            class="experience-time"
                            value="${escapeAttribute(
                                item.time_range
                            )}"
                        >

                    </div>

                </div>


                <div class="form-group">

                    <label>
                        Công ty / tổ chức
                    </label>

                    <input
                        type="text"
                        class="experience-company"
                        value="${escapeAttribute(
                            item.company
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Mô tả công việc
                    </label>

                    <textarea
                        class="experience-description"
                        rows="4"
                    >${escapeHTML(
                        item.description
                    )}</textarea>

                </div>

            `;


            list.appendChild(
                wrapper
            );


            setupRemoveButtonForItem(
                wrapper
            );

            setupRealtimeForElement(
                wrapper
            );

        }
    );


    updateItemLabels();

}


// ======================================================
// FILL EDUCATIONS
// ======================================================

function fillEducations(
    items
) {

    const list =
        document.getElementById(
            "educationList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        addEducationItem();

        return;

    }


    items.forEach(
        item => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "dynamic-item education-item";


            wrapper.innerHTML = `

                <div class="dynamic-item-header">

                    <span class="item-label">
                        Mục
                    </span>

                    <button
                        type="button"
                        class="remove-btn"
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
                            value="${escapeAttribute(
                                item.degree
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Thời gian
                        </label>

                        <input
                            type="text"
                            class="education-time"
                            value="${escapeAttribute(
                                item.time_range
                            )}"
                        >

                    </div>

                </div>


                <div class="form-group">

                    <label>
                        Tên trường
                    </label>

                    <input
                        type="text"
                        class="education-school"
                        value="${escapeAttribute(
                            item.school
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        GPA
                    </label>

                    <input
                        type="number"
                        class="education-gpa"
                        min="0"
                        max="4"
                        step="0.01"
                        value="${escapeAttribute(
                            item.gpa
                        )}"
                    >

                </div>

            `;


            list.appendChild(
                wrapper
            );


            setupRemoveButtonForItem(
                wrapper
            );

            setupRealtimeForElement(
                wrapper
            );

        }
    );


    updateItemLabels();

}


// ======================================================
// FILL PROJECTS
// ======================================================

function fillProjects(
    items
) {

    const list =
        document.getElementById(
            "projectList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        addProjectItem();

        return;

    }


    items.forEach(
        item => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "dynamic-item project-item";


            wrapper.innerHTML = `

                <div class="dynamic-item-header">

                    <span class="item-label">
                        Mục
                    </span>

                    <button
                        type="button"
                        class="remove-btn"
                    >
                        Xóa
                    </button>

                </div>


                <div class="form-group">

                    <label>
                        Tên dự án
                    </label>

                    <input
                        type="text"
                        class="project-name"
                        value="${escapeAttribute(
                            item.project_name
                        )}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Công nghệ sử dụng
                    </label>

                    <input
                        type="text"
                        class="project-technologies"
                        value="${escapeAttribute(
                            item.technologies
                        )}"
                    >

                    <small class="form-hint">
                        Ngăn cách các công nghệ bằng dấu phẩy.
                    </small>

                </div>


                <div class="form-group">

                    <label>
                        Mô tả dự án
                    </label>

                    <textarea
                        class="project-description"
                        rows="4"
                    >${escapeHTML(
                        item.description
                    )}</textarea>

                </div>

            `;


            list.appendChild(
                wrapper
            );


            setupRemoveButtonForItem(
                wrapper
            );

            setupRealtimeForElement(
                wrapper
            );

        }
    );


    updateItemLabels();

}


// ======================================================
// FILL LANGUAGES
// ======================================================

function fillLanguages(
    items
) {

    const list =
        document.getElementById(
            "languageList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        addLanguageItem();

        return;

    }


    items.forEach(
        item => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "dynamic-item language-item";


            wrapper.innerHTML = `

                <div class="form-row">

                    <div class="form-group">

                        <label>
                            Ngôn ngữ
                        </label>

                        <input
                            type="text"
                            class="language-name"
                            value="${escapeAttribute(
                                item.name
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Trình độ
                        </label>

                        <input
                            type="text"
                            class="language-level"
                            value="${escapeAttribute(
                                item.level
                            )}"
                        >

                    </div>

                </div>

            `;


            list.appendChild(
                wrapper
            );


            setupRealtimeForElement(
                wrapper
            );

        }
    );

}


// ======================================================
// FILL ACTIVITIES
// ======================================================

function fillActivities(
    items
) {

    const list =
        document.getElementById(
            "activityList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        addActivityItem();

        return;

    }


    items.forEach(
        item => {

            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "dynamic-item activity-item";


            wrapper.innerHTML = `

                <div class="dynamic-item-header">

                    <span class="item-label">
                        Mục
                    </span>

                    <button
                        type="button"
                        class="remove-btn"
                    >
                        Xóa
                    </button>

                </div>


                <div class="form-row">

                    <div class="form-group">

                        <label>
                            Tên hoạt động
                        </label>

                        <input
                            type="text"
                            class="activity-name"
                            value="${escapeAttribute(
                                item.activity_name
                            )}"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Năm
                        </label>

                        <input
                            type="text"
                            class="activity-year"
                            value="${escapeAttribute(
                                item.activity_year
                            )}"
                        >

                    </div>

                </div>


                <div class="form-group">

                    <label>
                        Mô tả
                    </label>

                    <textarea
                        class="activity-description"
                        rows="4"
                    >${escapeHTML(
                        item.description
                    )}</textarea>

                </div>

            `;


            list.appendChild(
                wrapper
            );


            setupRemoveButtonForItem(
                wrapper
            );

            setupRealtimeForElement(
                wrapper
            );

        }
    );


    updateItemLabels();

}


// ======================================================
// SET ACTIVE COLOR
// ======================================================

function setActiveColor(
    color
) {

    const buttons =
        document.querySelectorAll(
            ".color-btn"
        );


    let found = false;


    buttons.forEach(
        button => {

            const buttonColor =
                button.dataset.color;


            const isActive =
                buttonColor &&
                buttonColor.toLowerCase() ===
                String(color).toLowerCase();


            button.classList.toggle(
                "active",
                isActive
            );


            if (isActive) {

                found = true;

            }

        }
    );


    if (!found) {

        currentColor =
            "#2F7867";

    }

}


// ======================================================
// SET ACTIVE LAYOUT
// ======================================================

function setActiveLayoutButton(
    layout
) {

    document
        .querySelectorAll(
            ".layout-btn"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.layout ===
                    layout
                );

            }
        );

}


// ======================================================
// TOAST
// ======================================================
function showToast(title, message) {

    const toastArea =
        document.getElementById("toastArea");

    if (!toastArea) {
        return;
    }

    const toast =
        document.createElement("div");

    toast.className = "toast";

    toast.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>

        <div>
            <strong>
                ${escapeHTML(title)}
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>
        </div>
    `;

    toastArea.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}