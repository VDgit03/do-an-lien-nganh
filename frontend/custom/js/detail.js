document.addEventListener(
    "DOMContentLoaded",
    () => {
        initDetailCV();
    }
);


// ======================================================
// KHỞI TẠO
// ======================================================

async function initDetailCV() {

    const token =
        localStorage.getItem("token");

    if (!token) {

        window.location.href =
            "../auth/index.html";

        return;
    }

    const id =
        getCVIdFromURL();

    if (!id) {

        showToast(
            "Không tìm thấy CV"
        );

        setTimeout(
            () => {
                window.location.href =
                    "../home/home.html";
            },
            1200
        );

        return;
    }

    await loadCV(
        id,
        token
    );
}


// ======================================================
// LẤY ID CV TỪ URL
// ======================================================

function getCVIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");
}


// ======================================================
// LOAD CV
// ======================================================

async function loadCV(
    id,
    token
) {

    try {

        const response =
            await fetch(
                `http://localhost:3000/api/cvs/${id}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể lấy CV"
            );
        }


        const cv =
            result.data;


        if (!cv) {

            throw new Error(
                "Không tìm thấy CV"
            );
        }


        renderCV(cv);


        setupActions(
            cv,
            token
        );


    } catch (error) {

        console.error(
            "GET CV DETAIL ERROR:",
            error
        );


        const title =
            document.getElementById(
                "cv-title"
            );

        const meta =
            document.getElementById(
                "cv-meta"
            );


        if (title) {

            title.textContent =
                "Không thể tải CV";
        }


        if (meta) {

            meta.textContent =
                error.message;
        }


        showToast(
            error.message ||
            "Không thể tải CV"
        );
    }
}


// ======================================================
// HIỂN THỊ CV
// ======================================================

function renderCV(cv) {

    const documentEl =
        document.getElementById(
            "cv-document"
        );


    if (!documentEl) {
        return;
    }


    const template =
        [
            "layout1",
            "layout2",
            "layout3",
            "layout4"
        ].includes(cv.template)
            ? cv.template
            : "layout1";


    const color =
        cv.primary_color ||
        "#2f7867";

    documentEl.style.setProperty(
        "--cv-color",
        color
    );

    documentEl.style.setProperty(
        "--cv-color-soft",
        hexToRgba(color, 0.10)
    );

        documentEl.className =
            `cv-document ${template}`;



    const title =
        document.getElementById(
            "cv-title"
        );


    if (title) {

        title.textContent =
            cv.title ||
            "CV chưa đặt tên";
    }


    const updated =
        formatDate(
            cv.updated_at
        );


    const meta =
        document.getElementById(
            "cv-meta"
        );


    if (meta) {

        meta.textContent =
            `Bố cục: ${getTemplateName(template)} · Cập nhật ${updated}`;
    }


    if (template === "layout2") {

        documentEl.innerHTML =
            renderLayout2(cv);

        return;
    }


    if (template === "layout3") {

        documentEl.innerHTML =
            renderLayout3(cv);

        return;
    }


    if (template === "layout4") {

        documentEl.innerHTML =
            renderLayout4(cv);

        return;
    }


    documentEl.innerHTML =
        renderLayout1(cv);
}


// ======================================================
// LAYOUT 1 - CỔ ĐIỂN
// ======================================================

function renderLayout1(cv) {

    return `
        <div class="cv-content">

            ${renderHeader(cv)}

            ${renderSummary(cv)}

            ${renderExperience(cv)}

            ${renderProjects(cv)}

            ${renderEducation(cv)}

            ${renderProfessionalSkills(cv)}

            ${renderSoftSkills(cv)}

            ${renderLanguages(cv)}

            ${renderActivities(cv)}

        </div>
    `;
}


// ======================================================
// LAYOUT 2 - HAI CỘT
// ======================================================

function renderLayout2(cv) {

    return `
        <div class="cv-two-column">

            <aside class="cv-sidebar">

                ${renderSidebarHeader(cv)}

                ${renderProfessionalSkills(cv)}

                ${renderLanguages(cv)}

            </aside>


            <main class="cv-main">

                ${renderSummary(cv)}

                ${renderExperience(cv)}

                ${renderProjects(cv)}

                ${renderEducation(cv)}

                ${renderSoftSkills(cv)}

                ${renderActivities(cv)}

            </main>

        </div>
    `;
}


// ======================================================
// LAYOUT 3 - TỐI GIẢN
// ======================================================

function renderLayout3(cv) {

    return `
        <div class="cv-content">

            ${renderHeader(cv)}

            ${renderSummary(cv)}

            ${renderExperience(cv)}

            ${renderProjects(cv)}

            ${renderEducation(cv)}

            ${renderProfessionalSkills(cv)}

            ${renderSoftSkills(cv)}

            ${renderLanguages(cv)}

            ${renderActivities(cv)}

        </div>
    `;
}


// ======================================================
// LAYOUT 4 - DÒNG THỜI GIAN
// ======================================================

function renderLayout4(cv) {

    return `
        <div class="cv-content">

            ${renderHeader(cv)}

            ${renderSummary(cv)}

            ${renderExperience(cv)}

            ${renderProjects(cv)}

            ${renderEducation(cv)}

            ${renderProfessionalSkills(cv)}

            ${renderSoftSkills(cv)}

            ${renderLanguages(cv)}

            ${renderActivities(cv)}

        </div>
    `;
}


function renderSidebarHeader(cv) {

    const name =
        cv.full_name ||
        "Chưa có tên";

    const firstLetter =
        name
            .trim()
            .charAt(0)
            .toUpperCase();


    return `
        <header class="cv-header cv-sidebar-header">

            <div class="cv-avatar">
                ${escapeHTML(firstLetter)}
            </div>


            <h1 class="cv-name">
                ${escapeHTML(name)}
            </h1>


            ${
                cv.position
                    ?
                    `
                        <div class="cv-position">
                            ${escapeHTML(cv.position)}
                        </div>
                        <span class="cv-position-line"></span>
                    `
                    :
                    ""
            }


            <div class="contact-list">

                ${
                    cv.email
                        ?
                        `
                            <div class="contact-item">

                                <i class="fa-regular fa-envelope"></i>

                                <span>
                                    ${escapeHTML(cv.email)}
                                </span>

                            </div>
                        `
                        :
                        ""
                }


                ${
                    cv.phone
                        ?
                        `
                            <div class="contact-item">

                                <i class="fa-solid fa-phone"></i>

                                <span>
                                    ${escapeHTML(cv.phone)}
                                </span>

                            </div>
                        `
                        :
                        ""
                }


                ${
                    cv.address
                        ?
                        `
                            <div class="contact-item">

                                <i class="fa-solid fa-location-dot"></i>

                                <span>
                                    ${escapeHTML(cv.address)}
                                </span>

                            </div>
                        `
                        :
                        ""
                }


                ${
                    cv.git_link
                        ?
                        `
                            <div class="contact-item">

                                <i class="fa-brands fa-github"></i>

                                <span>
                                    ${escapeHTML(cv.git_link)}
                                </span>

                            </div>
                        `
                        :
                        ""
                }

            </div>

        </header>
    `;
}
// ======================================================
// HEADER
// ======================================================

function renderHeader(
    cv,
    showPosition = true,
    showContact = true
) {

    return `
        <header class="cv-header">

            <h1 class="cv-name">
                ${escapeHTML(
                    cv.full_name ||
                    "Chưa có tên"
                )}
            </h1>


            ${
                showPosition &&
                cv.position
                ?
                `
                    <div class="cv-position">
                        ${escapeHTML(
                            cv.position
                        )}
                    </div>
                    <span class="cv-position-line"></span>
                `
                :
                ""
            }


            ${
                showContact
                ?
                `
                    <div class="contact-list">

                        ${
                            cv.email
                            ?
                            `
                                <div class="contact-item">

                                    <i class="fa-regular fa-envelope"></i>

                                    <span>
                                        ${escapeHTML(
                                            cv.email
                                        )}
                                    </span>

                                </div>
                            `
                            :
                            ""
                        }


                        ${
                            cv.phone
                            ?
                            `
                                <div class="contact-item">

                                    <i class="fa-solid fa-phone"></i>

                                    <span>
                                        ${escapeHTML(
                                            cv.phone
                                        )}
                                    </span>

                                </div>
                            `
                            :
                            ""
                        }


                        ${
                            cv.address
                            ?
                            `
                                <div class="contact-item">

                                    <i class="fa-solid fa-location-dot"></i>

                                    <span>
                                        ${escapeHTML(
                                            cv.address
                                        )}
                                    </span>

                                </div>
                            `
                            :
                            ""
                        }


                        ${
                            cv.git_link
                            ?
                            `
                                <div class="contact-item">

                                    <i class="fa-brands fa-github"></i>

                                    <span>
                                        ${escapeHTML(
                                            cv.git_link
                                        )}
                                    </span>

                                </div>
                            `
                            :
                            ""
                        }

                    </div>
                `
                :
                ""
            }

        </header>
    `;
}


// ======================================================
// GIỚI THIỆU
// ======================================================

function renderSummary(cv) {

    if (!cv.summary) {
        return "";
    }


    return `
        <section class="cv-section">

            <div class="cv-section-title">
                Giới thiệu
                <span class="cv-section-line"></span>
            </div>


            <div class="cv-summary">
                ${formatText(
                    cv.summary
                )}
            </div>

        </section>
    `;
}


// ======================================================
// KINH NGHIỆM
// ======================================================

function renderExperience(cv) {

    const experiences =
        Array.isArray(cv.experiences)
            ? cv.experiences
            : [];


    if (experiences.length === 0) {
        return "";
    }


    return `
        <section class="cv-section">

            <div class="cv-section-title">
                Kinh nghiệm làm việc
                <span class="cv-section-line"></span>
            </div>


            ${experiences.map(
                experience => `

                    <div class="experience-item">

                        <div class="experience-head">

                            <div>

                                ${
                                    experience.position
                                    ?
                                    `
                                        <div class="experience-position">
                                            ${escapeHTML(
                                                experience.position
                                            )}
                                        </div>
                                    `
                                    :
                                    ""
                                }


                                ${
                                    experience.company
                                    ?
                                    `
                                        <div class="experience-company">
                                            ${escapeHTML(
                                                experience.company
                                            )}
                                        </div>
                                    `
                                    :
                                    ""
                                }

                            </div>


                            ${
                                experience.time_range
                                ?
                                `
                                    <div class="experience-time">
                                        ${escapeHTML(
                                            experience.time_range
                                        )}
                                    </div>
                                `
                                :
                                ""
                            }

                        </div>


                        ${
                            experience.description
                            ?
                            `
                                <div class="experience-description">
                                    ${formatText(
                                        experience.description
                                    )}
                                </div>
                            `
                            :
                            ""
                        }

                    </div>

                `
            ).join("")}

        </section>
    `;
}


// ======================================================
// HỌC VẤN
// ======================================================

function renderEducation(cv) {

    const educations =
        Array.isArray(cv.educations)
            ? cv.educations
            : [];


    if (educations.length === 0) {
        return "";
    }


    return `
        <section class="cv-section">

            <div class="cv-section-title">
                Học vấn
                <span class="cv-section-line"></span>
            </div>


            ${educations.map(
                education => `

                    <div class="education-item">

                        <div class="education-head">

                            <div>

                                ${
                                    education.degree
                                    ?
                                    `
                                        <div class="education-degree">
                                            ${escapeHTML(
                                                education.degree
                                            )}
                                        </div>
                                    `
                                    :
                                    ""
                                }


                                ${
                                    education.school
                                    ?
                                    `
                                        <div class="education-school">
                                            ${escapeHTML(
                                                education.school
                                            )}
                                        </div>
                                    `
                                    :
                                    ""
                                }


                                ${
                                    education.gpa !== null &&
                                    education.gpa !== undefined &&
                                    education.gpa !== ""
                                    ?
                                    `
                                        <div class="education-gpa">
                                            GPA: ${escapeHTML(
                                                education.gpa
                                            )}
                                        </div>
                                    `
                                    :
                                    ""
                                }

                            </div>


                            ${
                                education.time_range
                                ?
                                `
                                    <div class="education-time">
                                        ${escapeHTML(
                                            education.time_range
                                        )}
                                    </div>
                                `
                                :
                                ""
                            }

                        </div>

                    </div>

                `
            ).join("")}

        </section>
    `;
}


// ======================================================
// KỸ NĂNG CHUYÊN MÔN
// ======================================================

function renderProfessionalSkills(cv) {

    const skills =
        Array.isArray(cv.professional_skills)
            ? cv.professional_skills
            : [];

    const validSkills =
        skills.filter(
            skill =>
                skill &&
                (
                    skill.position ||
                    skill.technologies
                )
        );

    if (validSkills.length === 0) {
        return "";
    }

    return `
        <section class="cv-section">

            <div class="cv-section-title">
                Kỹ năng chuyên môn
                <span class="cv-section-line"></span>
            </div>

            <div class="professional-skills-list">

                ${validSkills.map(skill => `

                    <div class="professional-skill-item">

                        ${
                            skill.position
                                ? `
                                    <span class="professional-skill-position">
                                        ${escapeHTML(skill.position)}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            skill.position && skill.technologies
                                ? `<span class="professional-skill-separator">: </span>`
                                : ""
                        }

                        ${
                            skill.technologies
                                ? `
                                    <span class="professional-skill-technologies">
                                        ${renderCommaText(skill.technologies)}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                `).join("")}

            </div>

        </section>
    `;
}


// ======================================================
// KỸ NĂNG MỀM
// ======================================================

function renderSoftSkills(cv) {

    const skills =
        parseSkills(
            cv.soft_skills
        );


    if (skills.length === 0) {
        return "";
    }


    return `
        <section class="cv-section">

            <div class="cv-section-title">
                Kỹ năng mềm
                <span class="cv-section-line"></span>
            </div>


            <div class="tags">

                ${skills.map(
                    skill => `

                        <span class="tag">
                            ${escapeHTML(skill)}
                        </span>

                    `
                ).join("")}

            </div>

        </section>
    `;
}


// ======================================================
// DỰ ÁN
// ======================================================

function renderProjects(cv) {

    const projects =
        Array.isArray(cv.projects)
            ? cv.projects
            : [];


    const validProjects =
        projects.filter(
            project =>
                project &&
                (
                    project.project_name ||
                    project.technologies ||
                    project.description
                )
        );


    if (validProjects.length === 0) {
        return "";
    }


    return `
        <section class="cv-section">

            <div class="cv-section-title">
                Dự án
                <span class="cv-section-line"></span>
            </div>


            ${validProjects.map(
                project => `

                    <div class="project-item">

                        ${
                            project.project_name
                            ?
                            `
                                <div class="project-name">
                                    ${escapeHTML(
                                        project.project_name
                                    )}
                                </div>
                            `
                            :
                            ""
                        }


                        ${
                            project.technologies
                            ?
                            `
                                <div class="project-technologies">
                                    ${renderCommaText(
                                        project.technologies
                                    )}
                                </div>
                            `
                            :
                            ""
                        }


                        ${
                            project.description
                            ?
                            `
                                <div class="project-description">
                                    ${formatText(
                                        project.description
                                    )}
                                </div>
                            `
                            :
                            ""
                        }

                    </div>

                `
            ).join("")}

        </section>
    `;
}


// ======================================================
// NGOẠI NGỮ
// ======================================================

function renderLanguages(cv) {

    const languages =
        Array.isArray(cv.languages)
            ? cv.languages
            : [];


    if (languages.length === 0) {
        return "";
    }


    return `
        <section class="cv-section">

            <div class="cv-section-title">
                Ngoại ngữ
                <span class="cv-section-line"></span>
            </div>


            <div class="tags">

                ${languages.map(
                    language => {

                        const name =
                            language.name ||
                            language.language_name ||
                            language.language ||
                            "";


                        const level =
                            language.level ||
                            language.proficiency ||
                            "";


                        if (!name && !level) {
                            return "";
                        }


                        const text =
                            level
                            ?
                            `${name} - ${level}`
                            :
                            name;


                        return `

                            <span class="tag">
                                ${escapeHTML(
                                    text
                                )}
                            </span>

                        `;
                    }
                ).join("")}

            </div>

        </section>
    `;
}


// ======================================================
// HOẠT ĐỘNG
// ======================================================

function renderActivities(cv) {

    const activities =
        Array.isArray(cv.activities)
            ? cv.activities
            : [];


    const validActivities =
        activities.filter(
            activity =>
                activity &&
                (
                    activity.activity_name ||
                    activity.activity_year ||
                    activity.description
                )
        );


    if (validActivities.length === 0) {
        return "";
    }


    return `
        <section class="cv-section">

            <div class="cv-section-title">
                Hoạt động
                <span class="cv-section-line"></span>
            </div>


            ${validActivities.map(
                activity => `

                    <div class="activity-item">

                        <div class="activity-head">

                            ${
                                activity.activity_name
                                ?
                                `
                                    <div class="activity-name">
                                        ${escapeHTML(
                                            activity.activity_name
                                        )}
                                    </div>
                                `
                                :
                                ""
                            }


                            ${
                                activity.activity_year
                                ?
                                `
                                    <div class="activity-year">
                                        ${escapeHTML(
                                            activity.activity_year
                                        )}
                                    </div>
                                `
                                :
                                ""
                            }

                        </div>


                        ${
                            activity.description
                            ?
                            `
                                <div class="activity-description">
                                    ${formatText(
                                        activity.description
                                    )}
                                </div>
                            `
                            :
                            ""
                        }

                    </div>

                `
            ).join("")}

        </section>
    `;
}


// ======================================================
// ACTIONS
// ======================================================

function setupActions(
    cv,
    token
) {

    const id =
        cv.id;


    // ==================================================
    // EDIT
    // ==================================================

    const editBtn =
        document.getElementById(
            "editBtn"
        );


    if (editBtn) {

        editBtn.onclick =
            () => {

                window.location.href =
                    `create_cv.html?id=${id}`;
            };
    }


    // ==================================================
    // DELETE
    // ==================================================

    const deleteBtn =
        document.getElementById(
            "deleteBtn"
        );


    if (deleteBtn) {

        deleteBtn.onclick =
            () => {

                deleteCurrentCV(
                    id,
                    token
                );
            };
    }


    // ==================================================
    // DUPLICATE
    // ==================================================

    const duplicateBtn =
        document.getElementById(
            "duplicateBtn"
        );


    if (duplicateBtn) {

        duplicateBtn.onclick =
            () => {

                duplicateCV(
                    cv,
                    token
                );
            };
    }


    // ==================================================
    // PDF
    // ==================================================

    const downloadBtn =
        document.getElementById(
            "downloadPdfBtn"
        );


    if (downloadBtn) {

        downloadBtn.onclick =
            () => {

                downloadPDF(
                    cv
                );
            };
    }
}


// ======================================================
// XÓA CV
// ======================================================

async function deleteCurrentCV(
    id,
    token
) {

    const confirmed =
        confirm(
            "Bạn có chắc muốn xóa CV này?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `http://localhost:3000/api/cvs/${id}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể xóa CV"
            );
        }


        showToast(
            "Đã xóa CV",
            "Thao tác thành công"
        );


        setTimeout(
            () => {

                window.location.href =
                    "../home/home.html";

            },
            900
        );


    } catch (error) {

        console.error(
            "DELETE CV ERROR:",
            error
        );


        showToast(
            error.message ||
            "Không thể xóa CV"
        );
    }
}


// ======================================================
// NHÂN BẢN CV
// ======================================================

async function duplicateCV(
    cv,
    token
) {

    try {

        const duplicateData = {

            title:
                `${cv.title || "CV"} - Bản sao`,

            full_name:
                cv.full_name || "",

            position:
                cv.position || "",

            summary:
                cv.summary || "",

            email:
                cv.email || "",

            phone:
                cv.phone || "",

            address:
                cv.address || "",

            git_link:
                cv.git_link || "",

            soft_skills:
                cv.soft_skills || "",

            primary_color:
                cv.primary_color || "#2F7867",

            template:
                cv.template || "layout1",


            // kỹ năng chuyên môn
            professional_skills:
                Array.isArray(
                    cv.professional_skills
                )
                    ?
                    cv.professional_skills.map(
                        skill => ({
                            position:
                                skill.position || "",

                            technologies:
                                skill.technologies || ""
                        })
                    )
                    :
                    [],


            // kinh nghiệm
            experiences:
                Array.isArray(
                    cv.experiences
                )
                    ?
                    cv.experiences.map(
                        experience => ({
                            position:
                                experience.position || "",

                            time_range:
                                experience.time_range || "",

                            company:
                                experience.company || "",

                            description:
                                experience.description || ""
                        })
                    )
                    :
                    [],


            // học vấn
            educations:
                Array.isArray(
                    cv.educations
                )
                    ?
                    cv.educations.map(
                        education => ({
                            degree:
                                education.degree || "",

                            time_range:
                                education.time_range || "",

                            school:
                                education.school || "",

                            gpa:
                                education.gpa === null ||
                                education.gpa === undefined
                                    ?
                                    null
                                    :
                                    education.gpa
                        })
                    )
                    :
                    [],


            // dự án
            projects:
                Array.isArray(
                    cv.projects
                )
                    ?
                    cv.projects.map(
                        project => ({
                            project_name:
                                project.project_name || "",

                            technologies:
                                project.technologies || "",

                            description:
                                project.description || ""
                        })
                    )
                    :
                    [],


            // ngoại ngữ
            languages:
                Array.isArray(
                    cv.languages
                )
                    ?
                    cv.languages.map(
                        language => ({
                            name:
                                language.name ||
                                language.language_name ||
                                "",

                            level:
                                language.level || ""
                        })
                    )
                    :
                    [],


            // hoạt động
            activities:
                Array.isArray(
                    cv.activities
                )
                    ?
                    cv.activities.map(
                        activity => ({
                            activity_name:
                                activity.activity_name || "",

                            activity_year:
                                activity.activity_year || "",

                            description:
                                activity.description || ""
                        })
                    )
                    :
                    []
        };


        const response =
            await fetch(
                "http://localhost:3000/api/cvs",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(
                            duplicateData
                        )
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể nhân bản CV"
            );
        }


        showToast(
            "Đã nhân bản CV",
            "Thao tác thành công"
        );


        setTimeout(
            () => {

                window.location.href =
                    "../home/home.html";

            },
            900
        );


    } catch (error) {

        console.error(
            "DUPLICATE CV ERROR:",
            error
        );


        showToast(
            error.message ||
            "Không thể nhân bản CV"
        );
    }
}


// ======================================================
// PDF
// ======================================================

// ======================================================
// TẢI PDF TRỰC TIẾP
// ======================================================

async function downloadPDF(cv) {
    const element = document.getElementById("cv-document");

    if (!element) {
        showToast("Lỗi", "Không tìm thấy nội dung CV");
        return;
    }

    if (typeof html2canvas === "undefined") {
        showToast("Lỗi", "Chưa tải được thư viện html2canvas-pro");
        return;
    }

    if (!window.jspdf?.jsPDF) {
        showToast("Lỗi", "Chưa tải được thư viện PDF");
        return;
    }

    // Lưu giá trị và độ ưu tiên CSS ban đầu để khôi phục chính xác.
    const properties = [
        "width",
        "min-width",
        "max-width",
        "min-height",
        "height",
        "margin",
        "transform",
        "transform-origin",
        "overflow",
        "box-sizing",
        "flex",
        "align-self"
    ];

    const oldStyles = {};

    properties.forEach(property => {
        oldStyles[property] = {
            value: element.style.getPropertyValue(property),
            priority: element.style.getPropertyPriority(property)
        };
    });

    const restoreStyles = () => {
        properties.forEach(property => {
            const old = oldStyles[property];

            if (old.value) {
                element.style.setProperty(
                    property,
                    old.value,
                    old.priority
                );
            } else {
                element.style.removeProperty(property);
            }
        });
    };

    try {
        showToast("Đang tạo PDF", "Vui lòng chờ trong giây lát...");

        // Chờ font tải xong trước khi chụp.
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        // A4 tại 96 DPI xấp xỉ 794 × 1123 px.
        // flex: none giúp tránh phần tử bị co chiều rộng.
        const forcedStyles = {
            width: "794px",
            "min-width": "794px",
            "max-width": "794px",
            "min-height": "1123px",
            height: "auto",
            margin: "0 auto",
            transform: "none",
            "transform-origin": "top left",
            overflow: "visible",
            "box-sizing": "border-box",
            flex: "0 0 794px",
            "align-self": "flex-start"
        };

        Object.entries(forcedStyles).forEach(([property, value]) => {
            element.style.setProperty(property, value, "important");
        });

        // Giữ màu chủ đạo khi xuất layout 3.
        if (element.classList.contains("layout3")) {
            const color = cv?.primary_color || "#2f7867";

            element.style.setProperty("--cv-color", color);

            if (typeof hexToRgba === "function") {
                element.style.setProperty(
                    "--cv-color-soft",
                    hexToRgba(color, 0.1)
                );
            }
        }

        // Đợi trình duyệt áp dụng kích thước và render lại.
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });

        console.log("PDF - kích thước trước khi chụp:", {
            width: element.getBoundingClientRect().width,
            height: element.getBoundingClientRect().height,
            scrollWidth: element.scrollWidth,
            scrollHeight: element.scrollHeight
        });

        // Chụp CV thành canvas.
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff",
            logging: false,
            imageTimeout: 15000,
            scrollX: 0,
            scrollY: 0,
            windowWidth: Math.max(
                document.documentElement.clientWidth,
                794
            ),
            windowHeight: Math.max(
                document.documentElement.clientHeight,
                element.scrollHeight
            )
        });

        if (!canvas.width || !canvas.height) {
            throw new Error("Không tạo được ảnh CV.");
        }

        console.log("PDF - kích thước canvas:", {
            width: canvas.width,
            height: canvas.height
        });

        // Lấy các điểm ngắt trang TRƯỚC khi khôi phục CSS.
        const elementRect = element.getBoundingClientRect();

        const scaleY = canvas.height / elementRect.height;

        const breakPoints = [];

        const breakSelectors = [
            ".cv-section",
            ".cv-item",
            ".experience-item",
            ".education-item",
            ".project-item",
            ".activity-item",
            ".language-item",
            ".professional-skill-item"
        ].join(",");

        element.querySelectorAll(breakSelectors).forEach(item => {
            const rect = item.getBoundingClientRect();

            const bottom = Math.round(
                (rect.bottom - elementRect.top) * scaleY
            );

            if (bottom > 0 && bottom < canvas.height) {
                breakPoints.push(bottom);
            }
        });

        const uniqueBreakPoints = [
            ...new Set(breakPoints)
        ].sort((a, b) => a - b);

        // Khôi phục giao diện ngay sau khi đã chụp và lấy điểm ngắt.
        restoreStyles();

        // Khởi tạo PDF A4.
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Quy đổi chiều cao trang A4 sang pixel canvas.
        const ratio = pageWidth / canvas.width;

        const pageCanvasHeight = Math.floor(
            pageHeight / ratio
        );

        let currentY = 0;
        let pageIndex = 0;

        // Cắt canvas theo từng trang A4.
        // ======================================================
// TẠO PDF - GIỮ CV TRÊN 1 TRANG A4 NẾU VỪA
// ======================================================

const totalHeightMM = canvas.height * ratio;

if (totalHeightMM <= pageHeight + 1) {
    // CV vừa một trang A4: không chia canvas thành nhiều trang.
    const imageData = canvas.toDataURL("image/jpeg", 0.98);

    // Căn giữa theo chiều ngang, giữ nguyên tỷ lệ ảnh.
    const imageWidth = pageWidth;
    const imageHeight = totalHeightMM;

    pdf.addImage(
        imageData,
        "JPEG",
        0,
        0,
        imageWidth,
        imageHeight,
        undefined,
        "FAST"
    );
} else {
    // CV dài hơn A4: chia thành nhiều trang.
    let currentY = 0;
    let pageIndex = 0;

    while (currentY < canvas.height) {
        const maxPageY = Math.min(
            currentY + pageCanvasHeight,
            canvas.height
        );

        let pageEnd = maxPageY;

        // Ưu tiên ngắt ở cuối section nếu có điểm ngắt phù hợp.
        if (maxPageY < canvas.height) {
            const minBreakY =
                currentY + pageCanvasHeight * 0.65;

            const possibleBreaks = uniqueBreakPoints.filter(
                point =>
                    point >= minBreakY &&
                    point <= maxPageY
            );

            if (possibleBreaks.length > 0) {
                pageEnd = possibleBreaks[possibleBreaks.length - 1];
            }
        }

        const sliceHeight = pageEnd - currentY;

        if (sliceHeight <= 0) {
            break;
        }

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext("2d");

        if (!ctx) {
            throw new Error("Không thể xử lý ảnh PDF.");
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        ctx.drawImage(
            canvas,
            0,
            currentY,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
        );

        if (pageIndex > 0) {
            pdf.addPage("a4", "portrait");
        }

        pdf.addImage(
            pageCanvas.toDataURL("image/jpeg", 0.98),
            "JPEG",
            0,
            0,
            pageWidth,
            sliceHeight * ratio,
            undefined,
            "FAST"
        );

        currentY = pageEnd;
        pageIndex++;
    }
}

        // Đặt tên file.
        const rawName =
            cv?.title ||
            cv?.full_name ||
            "CV";

        const fileName = String(rawName)
            .trim()
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
            .replace(/\s+/g, "_");

        pdf.save(`${fileName}.pdf`);

        showToast("Thành công", "Đã tải CV xuống PDF.");

        console.log("PDF - số trang:", pageIndex);

    } catch (error) {
        console.error("PDF ERROR:", error);

        showToast(
            "Lỗi",
            error.message || "Không thể xuất PDF. Vui lòng thử lại."
        );

    } finally {
        // Đảm bảo giao diện luôn trở về trạng thái ban đầu.
        restoreStyles();
    }
}

// ======================================================
// PARSE SKILLS
// ======================================================

function parseSkills(value) {

    if (!value) {
        return [];
    }


    if (Array.isArray(value)) {

        return value
            .map(
                item =>
                    String(item).trim()
            )
            .filter(Boolean);
    }


    return String(value)
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

    return escapeHTML(
        value || ""
    ).replace(
        /\n/g,
        "<br>"
    );
}


// ======================================================
// FORMAT COMMA TEXT
// ======================================================

function renderCommaText(value) {

    const items =
        parseSkills(value);


    if (items.length === 0) {
        return "";
    }


    return items
        .map(
            item =>
                escapeHTML(item)
        )
        .join(", ");
}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(value) {

    if (!value) {

        return "--/--/----";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;
    }


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const year =
        date.getFullYear();


    return `${day}/${month}/${year}`;
}


// ======================================================
// TEMPLATE NAME
// ======================================================

function getTemplateName(
    template
) {

    const names = {

        layout1:
            "Cổ điển",

        layout2:
            "Hai cột",

        layout3:
            "Tối giản",

        layout4:
            "Dòng thời gian"
    };


    return names[
        template
    ] || "Cổ điển";
}


// ======================================================
// SANITIZE FILENAME
// ======================================================

function sanitizeFilename(
    value
) {

    return String(value)

        .replace(
            /[<>:"/\\|?*]/g,
            ""
        )

        .trim()

        || "CV";
}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHTML(
    value
) {

    return String(value)

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

function hexToRgba(hex, alpha = 0.1) {

    hex = String(hex || "").replace("#", "");

    if (hex.length === 3) {
        hex = hex
            .split("")
            .map(char => char + char)
            .join("");
    }

    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
        return `rgba(47, 120, 103, ${alpha})`;
    }

    const r = parseInt(
        hex.substring(0, 2),
        16
    );

    const g = parseInt(
        hex.substring(2, 4),
        16
    );

    const b = parseInt(
        hex.substring(4, 6),
        16
    );

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function showToast(title, message) {

    if (message === undefined) {
        message = "Thao tác thành công";
    }

    let toastArea =
        document.getElementById("toastArea");

    if (!toastArea) {

        toastArea =
            document.createElement("div");

        toastArea.id = "toastArea";
        toastArea.className = "toast-area";

        document.body.appendChild(
            toastArea
        );
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

        <div class="toast-progress"></div>
    `;

    toastArea.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}