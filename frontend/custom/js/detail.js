document.addEventListener(
    "DOMContentLoaded",
    () => {

        initDetailCV();

    }
);


// khởi tạo

async function initDetailCV() {

    const token =
        localStorage.getItem("token");

    if (!token) {

        window.location.href =
            "../../auth/auth.html";

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


    await loadCV(id, token);

}


// components




// lấy id cv

function getCVIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");

}


// tải cv

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


        document.getElementById(
            "cv-title"
        ).textContent =
            "Không thể tải CV";


        document.getElementById(
            "cv-meta"
        ).textContent =
            error.message;


        showToast(
            error.message ||
            "Không thể tải CV"
        );

    }

}


// hiển thị cv

function renderCV(cv) {

    const documentEl =
        document.getElementById(
            "cv-document"
        );


    const template =
        cv.template ||
        "layout1";


    const color =
        cv.primary_color ||
        "#2f7867";


    documentEl.className =
        `cv-document ${template}`;


    documentEl.style.setProperty(
        "--cv-color",
        color
    );


    document.getElementById(
        "cv-title"
    ).textContent =
        cv.title ||
        "CV chưa đặt tên";


    const updated =
        formatDate(
            cv.updated_at
        );


    document.getElementById(
        "cv-meta"
    ).textContent =
        `Bố cục: ${getTemplateName(template)} · Cập nhật ${updated}`;


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


// layout 1

function renderLayout1(cv) {

    return `

        <div class="cv-content">

            ${renderHeader(cv)}

            ${renderSummary(cv)}

            ${renderExperience(cv)}

            ${renderEducation(cv)}

            ${renderSkills(cv)}

            ${renderSoftSkills(cv)}

            ${renderLanguages(cv)}

        </div>

    `;

}


// layout 2

function renderLayout2(cv) {

    return `
        <div class="cv-two-column">

            <aside class="cv-sidebar">

                ${renderHeader(cv, true, true)}

                ${renderSkills(cv)}

                ${renderSoftSkills(cv)}

                ${renderLanguages(cv)}

            </aside>

            <main class="cv-main">

                ${renderSummary(cv)}

                ${renderExperience(cv)}

                ${renderEducation(cv)}

            </main>

        </div>
    `;
}


// layout 3

function renderLayout3(cv) {

    return `

        <div class="cv-content">

            ${renderHeader(cv)}

            ${renderSummary(cv)}

            ${renderExperience(cv)}

            ${renderEducation(cv)}

            ${renderSkills(cv)}

            ${renderSoftSkills(cv)}

            ${renderLanguages(cv)}

        </div>

    `;

}


// layout 4

function renderLayout4(cv) {

    return `

        <div class="cv-content">

            ${renderHeader(cv)}

            ${renderSummary(cv)}

            ${renderExperience(cv)}

            ${renderEducation(cv)}

            ${renderSkills(cv)}

            ${renderSoftSkills(cv)}

            ${renderLanguages(cv)}

        </div>

    `;

}


// header

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
                showPosition && cv.position
                ?
                `
                <div class="cv-position">
                    ${escapeHTML(cv.position)}
                </div>
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

                </div>
                `
                :
                ""
            }

        </header>
    `;
}


// giới thiệu

function renderSummary(cv) {

    if (!cv.summary) {

        return "";

    }


    return `

        <section class="cv-section">

            <div class="cv-section-title">
                Giới thiệu
            </div>


            <div class="cv-summary">

                ${formatText(cv.summary)}

            </div>

        </section>

    `;

}


// kinh nghiệm

function renderExperience(cv) {

    const experiences =
        cv.experiences || [];


    if (experiences.length === 0) {

        return "";

    }


    return `

        <section class="cv-section">

            <div class="cv-section-title">
                Kinh nghiệm làm việc
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


// học vấn

function renderEducation(cv) {

    const educations =
        cv.educations || [];


    if (educations.length === 0) {

        return "";

    }


    return `

        <section class="cv-section">

            <div class="cv-section-title">
                Học vấn
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


// kỹ năng

function renderSkills(cv) {

    const skills =
        parseSkills(
            cv.skills
        );


    if (skills.length === 0) {

        return "";

    }


    return `

        <section class="cv-section">

            <div class="cv-section-title">
                Kỹ năng
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


// kỹ năng mềm

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


// ngoại ngữ

function renderLanguages(cv) {

    const languages =
        cv.languages || [];


    if (languages.length === 0) {

        return "";

    }


    return `

        <section class="cv-section">

            <div class="cv-section-title">
                Ngoại ngữ
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


// thao tác

function setupActions(
    cv,
    token
) {

    const id =
        cv.id;


    // sửa

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


    // xóa

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


    // nhân bản

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


    // pdf

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


// xóa

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
            "Đã xóa CV"
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


// nhân bản

async function duplicateCV(
    cv,
    token
) {

    try {

        const duplicateData = {

            title:
                `${cv.title || "CV"} - Bản sao`,

            full_name:
                cv.full_name,

            position:
                cv.position,

            summary:
                cv.summary,

            skills:
                cv.skills,

            soft_skills:
                cv.soft_skills,

            email:
                cv.email,

            phone:
                cv.phone,

            address:
                cv.address,

            primary_color:
                cv.primary_color,

            template:
                cv.template,

            experiences:
                cv.experiences || [],

            educations:
                cv.educations || [],

            languages:
                cv.languages || []

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


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể nhân bản CV"
            );

        }


        showToast(
            "Đã nhân bản CV"
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


// pdf

function downloadPDF(cv) {

    const element =
        document.getElementById(
            "cv-document"
        );


    if (!element) {

        showToast(
            "Không tìm thấy nội dung CV"
        );

        return;

    }


    // đặt tiêu đề cho file pdf

    const oldTitle =
        document.title;


    document.title =
        sanitizeFilename(
            cv?.title ||
            "CV"
        );


    // mở hộp thoại in của trình duyệt

    window.print();


    // khôi phục tiêu đề trang

    setTimeout(
        () => {

            document.title =
                oldTitle;

        },
        1000
    );

}


// hàm hỗ trợ

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


function formatText(value) {

    return escapeHTML(
        value || ""
    ).replace(
        /\n/g,
        "<br>"
    );

}


function formatDate(value) {

    if (!value) {

        return "--/--/----";

    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {

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


function sanitizeFilename(
    value
) {

    return String(value)

        .replace(
            /[<>:"/\\|?*]/g,
            ""
        )

        .trim() ||

        "CV";

}


function escapeHTML(value) {

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


// toast

function showToast(
    message
) {

    const toastArea =
        document.getElementById(
            "toastArea"
        );


    if (!toastArea) {

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast";


    toast.innerHTML = `

        <i class="fa-solid fa-circle-check"></i>

        <div>

            <strong>
                ${escapeHTML(message)}
            </strong>

        </div>

    `;


    toastArea.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        2000
    );

}