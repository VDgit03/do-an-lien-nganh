document.addEventListener("DOMContentLoaded", () => {
    initInterviewPage();
});


// ======================================================
// GLOBAL
// ======================================================

let interviews = [];

let editingId = null;


// ======================================================
// API
// ======================================================

const API_URL =
    "http://localhost:3000/api/interviews";


// ======================================================
// INIT
// ======================================================

async function initInterviewPage() {

    setupEvents();

    setupTypeChange();

    toggleLink();

    await loadInterviews();

}


// ======================================================
// API HELPER
// ======================================================

async function apiRequest(
    url,
    options = {}
) {

    const token =
        localStorage.getItem("token");


    if (!token) {

        window.location.href =
            "../auth/index.html";

        throw new Error(
            "Bạn chưa đăng nhập."
        );

    }


    const headers = {
        ...(options.headers || {}),
        "Authorization":
            `Bearer ${token}`
    };


    if (
        options.body &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";

    }


    const response =
        await fetch(
            url,
            {
                ...options,
                headers
            }
        );


    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    let result;


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        result =
            await response.json();

    } else {

        const text =
            await response.text();

        console.error(
            "SERVER RESPONSE:",
            text
        );

        throw new Error(
            `API trả về HTTP ${response.status}`
        );

    }


    if (!response.ok) {

        throw new Error(
            result.message ||
            result.error ||
            `HTTP ${response.status}`
        );

    }


    return result;

}


// ======================================================
// LOAD INTERVIEWS
// GET /api/interviews
// ======================================================

async function loadInterviews() {

    try {

        const result =
            await apiRequest(
                API_URL,
                {
                    method: "GET"
                }
            );


        /*
         * Backend dự kiến:
         *
         * {
         *     interviews: [...]
         * }
         */

        interviews =
            Array.isArray(
                result.interviews
            )
                ? result.interviews.map(
                    normalizeInterview
                )
                : [];


        console.log(
            "LOAD INTERVIEWS:",
            interviews
        );


        renderInterviews();

    }

    catch (error) {

        console.error(
            "LOAD INTERVIEWS ERROR:",
            error
        );


        interviews = [];

        renderInterviews();


        showToast(
            error.message ||
            "Không thể tải lịch phỏng vấn.",
            "error"
        );

    }

}


// ======================================================
// NORMALIZE INTERVIEW
// ======================================================

function normalizeInterview(
    row
) {

    return {

        id:
            row.id,


        company:
            row.company ||
            "",


        position:
            row.position ||
            "",


        interview_date:
            normalizeDate(
                row.interview_date ??
                row.date
            ),


        start_time:
            normalizeTime(
                row.start_time ??
                row.time
            ),


        interview_type:
            row.interview_type ??
            row.type ??
            "online",


        interview_link:
            row.interview_link ??
            row.link ??
            "",


        location:
            row.location ??
            "",


        note:
            row.note ??
            "",


        reminder_enabled:
            Boolean(
                row.reminder_enabled ??
                row.reminder ??
                false
            ),


        reminder_minutes:
            Number(
                row.reminder_minutes ??
                row.reminderMinutes ??
                60
            ),


        status:
            row.status ??
            "scheduled",


        cv_id:
            row.cv_id ??
            row.cvId ??
            null,


        created_at:
            row.created_at ??
            null,


        updated_at:
            row.updated_at ??
            null

    };

}


// ======================================================
// EVENTS
// ======================================================

function setupEvents() {

    const addButton =
        document.getElementById(
            "addInterviewBtn"
        );


    const closeButton =
        document.getElementById(
            "closeModalBtn"
        );


    const cancelButton =
        document.getElementById(
            "cancelModalBtn"
        );


    const modal =
        document.getElementById(
            "interviewModal"
        );


    const form =
        document.getElementById(
            "interviewForm"
        );


    // ------------------------------------------
    // THÊM LỊCH
    // ------------------------------------------

    if (addButton) {

        addButton.addEventListener(
            "click",
            () => {

                openAddModal();

            }
        );

    }


    // ------------------------------------------
    // ĐÓNG POPUP
    // ------------------------------------------

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                closeModal();

            }
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {

                closeModal();

            }
        );

    }


    // ------------------------------------------
    // CLICK RA NGOÀI POPUP
    // ------------------------------------------

    if (modal) {

        modal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === modal
                ) {

                    closeModal();

                }

            }
        );

    }


    // ------------------------------------------
    // SUBMIT FORM
    // ------------------------------------------

    if (form) {

        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                await saveInterview();

            }
        );

    }

}


// ======================================================
// RENDER ALL
// ======================================================

function renderInterviews() {

    const list =
        document.getElementById(
            "interviewList"
        );


    const nearest =
        document.getElementById(
            "nearestInterview"
        );


    if (!list || !nearest) {

        return;

    }


    if (
        !Array.isArray(interviews) ||
        interviews.length === 0
    ) {

        renderNearestEmpty(
            nearest
        );

        renderListEmpty(
            list
        );

        return;

    }


    // Chỉ lấy lịch chưa hủy
    const activeInterviews =
        interviews.filter(
            interview =>
                interview.status !==
                "cancelled"
        );


    if (
        activeInterviews.length === 0
    ) {

        renderNearestEmpty(
            nearest
        );

        renderListEmpty(
            list
        );

        return;

    }


    // Sắp xếp ngày + giờ
    const sortedInterviews =
        [...activeInterviews].sort(
            (a, b) => {

                return (
                    getDateTime(a) -
                    getDateTime(b)
                );

            }
        );


    renderNearest(
        sortedInterviews,
        nearest
    );


    renderInterviewList(
        sortedInterviews,
        list
    );

}


// ======================================================
// EMPTY NEAREST
// ======================================================

function renderNearestEmpty(
    container
) {

    container.innerHTML = `
        <div class="nearest-empty">
            Chưa có lịch phỏng vấn sắp tới.
        </div>
    `;

}


// ======================================================
// EMPTY LIST
// ======================================================

function renderListEmpty(
    container
) {

    container.innerHTML = `
        <div class="empty-interview">

            <h3>
                Chưa có lịch phỏng vấn
            </h3>

            <p>
                Thêm lịch phỏng vấn đầu tiên
                của bạn để không bỏ lỡ
                buổi hẹn nào.
            </p>

        </div>
    `;

}


// ======================================================
// RENDER NEAREST
// ======================================================

function renderNearest(
    sortedInterviews,
    container
) {

    const now =
        new Date();


    const nearest =
        sortedInterviews.find(
            interview =>
                getDateTime(
                    interview
                ) >= now
        );


    if (!nearest) {

        renderNearestEmpty(
            container
        );

        return;

    }


    container.innerHTML = `

        <div class="nearest-card">

            <div class="nearest-icon">

                <i class="fa-regular fa-bell"></i>

            </div>


            <div class="nearest-content">

                <div class="nearest-title">

                    Lịch phỏng vấn gần nhất

                </div>


                <div class="nearest-info">

                    ${formatDate(
                        getInterviewDate(
                            nearest
                        )
                    )}

                    lúc

                    ${escapeHtml(
                        getInterviewTime(
                            nearest
                        )
                    )}

                    — phỏng vấn

                    <strong>
                        ${escapeHtml(
                            nearest.company
                        )}
                    </strong>

                    ${
                        nearest.position
                            ? `
                                (${escapeHtml(
                                    nearest.position
                                )})
                            `
                            : ""
                    }

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// RENDER LIST
// ======================================================

function renderInterviewList(
    sortedInterviews,
    container
) {

    const groups = {};


    sortedInterviews.forEach(
        interview => {

            const date =
                getInterviewDate(
                    interview
                );


            if (!groups[date]) {

                groups[date] = [];

            }


            groups[date].push(
                interview
            );

        }
    );


    container.innerHTML =
        Object.entries(groups)
            .map(
                ([date, items]) => {

                    return `

                        <div class="interview-day">

                            <div class="day-title">

                                ${formatFullDate(
                                    date
                                )}

                            </div>


                            <div class="day-items">

                                ${items
                                    .map(
                                        interview =>
                                            renderInterviewCard(
                                                interview
                                            )
                                    )
                                    .join("")}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    attachCardEvents();

}


// ======================================================
// RENDER CARD
// ======================================================

function renderInterviewCard(
    interview
) {

    const type =
        getInterviewType(
            interview
        );


    const isOnline =
        type === "online";


    const reminderEnabled =
        Boolean(
            interview.reminder_enabled
        );


    return `

        <article
            class="interview-card"
            data-id="${escapeAttribute(
                interview.id
            )}"
        >

            <!-- TIME -->

            <div class="interview-time">

                <strong>

                    ${escapeHtml(
                        getInterviewTime(
                            interview
                        )
                    )}

                </strong>


                <span>

                    ${
                        isOnline
                            ? "ONLINE"
                            : "TRỰC TIẾP"
                    }

                </span>

            </div>


            <!-- CONTENT -->

            <div class="interview-content">

                <div class="company-name">

                    ${escapeHtml(
                        interview.company
                    )}

                </div>


                ${
                    interview.position
                        ? `
                            <div class="position-name">

                                <i
                                    class="
                                        fa-solid
                                        fa-briefcase
                                    "
                                ></i>

                                ${escapeHtml(
                                    interview.position
                                )}

                            </div>
                        `
                        : ""
                }


                <div class="interview-meta">

                    <span
                        class="
                            meta-badge
                            ${
                                isOnline
                                    ? ""
                                    : "offline"
                            }
                        "
                    >

                        <i
                            class="
                                fa-solid
                                ${
                                    isOnline
                                        ? "fa-video"
                                        : "fa-location-dot"
                                }
                            "
                        ></i>


                        ${
                            isOnline
                                ? "Trực tuyến (Online)"
                                : "Trực tiếp (Offline)"
                        }

                    </span>


                    ${
                        reminderEnabled
                            ? `
                                <span
                                    class="
                                        meta-badge
                                        reminder
                                    "
                                >

                                    <i
                                        class="
                                            fa-regular
                                            fa-envelope
                                        "
                                    ></i>

                                    Nhắc trước
                                    ${
                                        interview.reminder_minutes / 60 ||
                                        60
                                    }
                                    giờ

                                </span>
                            `
                            : ""
                    }

                </div>


                ${
                    isOnline &&
                    interview.interview_link
                        ? `
                            <a
                                class="interview-link"
                                href="${escapeAttribute(
                                    interview.interview_link
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >

                                ${escapeHtml(
                                    interview.interview_link
                                )}

                            </a>
                        `
                        : ""
                }


                ${
                    !isOnline &&
                    interview.location
                        ? `
                            <div class="interview-note">

                                <i
                                    class="
                                        fa-solid
                                        fa-location-dot
                                    "
                                ></i>

                                ${escapeHtml(
                                    interview.location
                                )}

                            </div>
                        `
                        : ""
                }


                ${
                    interview.note
                        ? `
                            <div class="interview-note">

                                ${escapeHtml(
                                    interview.note
                                )}

                            </div>
                        `
                        : ""
                }

            </div>


            <!-- ACTIONS -->

            <div class="interview-actions">

                <button
                    type="button"
                    class="action-btn edit-btn"
                    data-id="${escapeAttribute(
                        interview.id
                    )}"
                    title="Sửa"
                >

                    <i
                        class="
                            fa-regular
                            fa-pen-to-square
                        "
                    ></i>

                </button>


                <button
                    type="button"
                    class="
                        action-btn
                        delete
                        delete-btn
                    "
                    data-id="${escapeAttribute(
                        interview.id
                    )}"
                    title="Xóa"
                >

                    <i
                        class="
                            fa-regular
                            fa-trash-can
                        "
                    ></i>

                </button>

            </div>

        </article>

    `;

}


// ======================================================
// CARD EVENTS
// ======================================================

function attachCardEvents() {

    const editButtons =
        document.querySelectorAll(
            ".edit-btn"
        );


    editButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    openEditModal(id);

                }
            );

        }
    );


    const deleteButtons =
        document.querySelectorAll(
            ".delete-btn"
        );


    deleteButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.id;

                    deleteInterview(id);

                }
            );

        }
    );

}


// ======================================================
// OPEN ADD MODAL
// ======================================================

function openAddModal() {

    editingId = null;


    const modalTitle =
        document.getElementById(
            "modalTitle"
        );


    const form =
        document.getElementById(
            "interviewForm"
        );


    if (modalTitle) {

        modalTitle.textContent =
            "Thêm lịch phỏng vấn";

    }


    if (form) {

        form.reset();

    }


    const reminder =
        document.getElementById(
            "reminder"
        );


    if (reminder) {

        reminder.checked = true;

    }


    const type =
        document.getElementById(
            "type"
        );


    if (type) {

        type.value = "online";

    }


    toggleLink();

    openModal();

}


// ======================================================
// OPEN EDIT MODAL
// ======================================================

function openEditModal(id) {

    const interview =
        interviews.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!interview) {

        showToast(
            "Không tìm thấy lịch phỏng vấn.",
            "error"
        );

        return;

    }


    editingId =
        interview.id;


    const modalTitle =
        document.getElementById(
            "modalTitle"
        );


    if (modalTitle) {

        modalTitle.textContent =
            "Sửa lịch phỏng vấn";

    }


    setInputValue(
        "interviewId",
        interview.id
    );


    setInputValue(
        "company",
        interview.company
    );


    setInputValue(
        "position",
        interview.position
    );


    setInputValue(
        "date",
        getInterviewDate(
            interview
        )
    );


    setInputValue(
        "time",
        getInterviewTime(
            interview
        )
    );


    setInputValue(
        "type",
        getInterviewType(
            interview
        )
    );


    setInputValue(
        "link",
        interview.interview_link ||
        ""
    );


    setInputValue(
        "location",
        interview.location ||
        ""
    );


    setInputValue(
        "note",
        interview.note ||
        ""
    );


    const reminder =
        document.getElementById(
            "reminder"
        );


    if (reminder) {

        reminder.checked =
            Boolean(
                interview.reminder_enabled
            );

    }


    toggleLink();

    openModal();

}


// ======================================================
// OPEN MODAL
// ======================================================

function openModal() {

    const modal =
        document.getElementById(
            "interviewModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeModal() {

    const modal =
        document.getElementById(
            "interviewModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";


    editingId = null;

}


// ======================================================
// SAVE
// ======================================================

async function saveInterview() {

    const data =
        getFormData();


    if (
        !validateInterview(
            data
        )
    ) {

        return;

    }


    if (
        editingId === null
    ) {

        await createInterview(
            data
        );

    } else {

        await updateInterview(
            editingId,
            data
        );

    }

}


// ======================================================
// GET FORM DATA
// ======================================================

function getFormData() {

    return {

        company:
            getInputValue(
                "company"
            ),

        position:
            getInputValue(
                "position"
            ),

        date:
            getInputValue(
                "date"
            ),

        time:
            getInputValue(
                "time"
            ),

        type:
            getInputValue(
                "type"
            ),

        link:
            getInputValue(
                "link"
            ),

        location:
            getInputValue(
                "location"
            ),

        note:
            getInputValue(
                "note"
            ),

        reminder:
            document.getElementById(
                "reminder"
            )?.checked || false

    };

}


// ======================================================
// VALIDATE
// ======================================================

function validateInterview(
    data
) {

    if (!data.company) {

        showToast(
            "Vui lòng nhập tên công ty.",
            "error"
        );

        return false;

    }


    if (!data.position) {

        showToast(
            "Vui lòng nhập vị trí ứng tuyển.",
            "error"
        );

        return false;

    }


    if (!data.date) {

        showToast(
            "Vui lòng chọn ngày phỏng vấn.",
            "error"
        );

        return false;

    }


    if (!data.time) {

        showToast(
            "Vui lòng chọn giờ bắt đầu.",
            "error"
        );

        return false;

    }


    if (
        data.type === "online" &&
        !data.link
    ) {

        showToast(
            "Vui lòng nhập link phỏng vấn.",
            "error"
        );

        return false;

    }


    if (
        data.type === "online" &&
        data.link
    ) {

        try {

            new URL(
                data.link
            );

        }

        catch {

            showToast(
                "Link phỏng vấn không hợp lệ.",
                "error"
            );

            return false;

        }

    }


    if (
        data.type === "offline" &&
        !data.location
    ) {

        showToast(
            "Vui lòng nhập địa điểm phỏng vấn.",
            "error"
        );

        return false;

    }


    return true;

}


// ======================================================
// CREATE
// POST /api/interviews
// ======================================================

async function createInterview(
    data
) {

    try {

        const result =
            await apiRequest(
                API_URL,
                {
                    method: "POST",

                    body: JSON.stringify({

                        cv_id: null,

                        company:
                            data.company,

                        position:
                            data.position,

                        interview_date:
                            data.date,

                        start_time:
                            data.time,

                        interview_type:
                            data.type,

                        interview_link:
                            data.type === "online"
                                ? (
                                    data.link ||
                                    null
                                )
                                : null,

                        location:
                            data.type === "offline"
                                ? (
                                    data.location ||
                                    null
                                )
                                : null,

                        note:
                            data.note ||
                            null,

                        reminder_enabled:
                            Boolean(
                                data.reminder
                            ),

                        reminder_minutes:
                            300

                    })
                }
            );


        console.log(
            "CREATE INTERVIEW:",
            result
        );


        showToast(
            "Tạo lịch phỏng vấn thành công."
        );


        closeModal();


        await loadInterviews();

    }

    catch (error) {

        console.error(
            "CREATE INTERVIEW ERROR:",
            error
        );


        showToast(
            error.message ||
            "Không thể tạo lịch phỏng vấn.",
            "error"
        );

    }

}


// ======================================================
// UPDATE
// PUT /api/interviews/:id
// ======================================================

async function updateInterview(
    id,
    data
) {

    try {

        const result =
            await apiRequest(
                `${API_URL}/${id}`,
                {
                    method: "PUT",

                    body: JSON.stringify({

                        company:
                            data.company,

                        position:
                            data.position,

                        interview_date:
                            data.date,

                        start_time:
                            data.time,

                        interview_type:
                            data.type,

                        interview_link:
                            data.type === "online"
                                ? (
                                    data.link ||
                                    null
                                )
                                : null,

                        location:
                            data.type === "offline"
                                ? (
                                    data.location ||
                                    null
                                )
                                : null,

                        note:
                            data.note ||
                            null,

                        reminder_enabled:
                            Boolean(
                                data.reminder
                            ),

                        reminder_minutes:
                            300

                    })
                }
            );


        console.log(
            "UPDATE INTERVIEW:",
            result
        );


        showToast(
            "Cập nhật lịch phỏng vấn thành công."
        );


        closeModal();


        await loadInterviews();

    }

    catch (error) {

        console.error(
            "UPDATE INTERVIEW ERROR:",
            error
        );


        showToast(
            error.message ||
            "Không thể cập nhật lịch phỏng vấn.",
            "error"
        );

    }

}


// ======================================================
// DELETE
// DELETE /api/interviews/:id
// ======================================================

async function deleteInterview(
    id
) {

    const interview =
        interviews.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!interview) {

        return;

    }


    const confirmed =
        window.confirm(
            `Bạn có chắc muốn xóa lịch phỏng vấn tại "${interview.company}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const result =
            await apiRequest(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );


        console.log(
            "DELETE INTERVIEW:",
            result
        );


        showToast(
            "Xóa lịch phỏng vấn thành công."
        );


        await loadInterviews();

    }

    catch (error) {

        console.error(
            "DELETE INTERVIEW ERROR:",
            error
        );


        showToast(
            error.message ||
            "Không thể xóa lịch phỏng vấn.",
            "error"
        );

    }

}


// ======================================================
// TYPE CHANGE
// ======================================================

// ======================================================
// TYPE CHANGE
// ======================================================

function setupTypeChange() {

    const type =
        document.getElementById("type");

    if (!type) {
        return;
    }

    type.addEventListener(
        "change",
        toggleLink
    );

}


// ======================================================
// TOGGLE LINK / LOCATION
// ======================================================

function toggleLink() {

    const type =
        document.getElementById("type");

    const linkGroup =
        document.getElementById("linkGroup");

    const locationGroup =
        document.getElementById("locationGroup");

    const link =
        document.getElementById("link");

    const location =
        document.getElementById("location");


    if (!type) {
        return;
    }


    if (type.value === "online") {

        // Hiện link
        if (linkGroup) {
            linkGroup.style.display = "block";
        }

        // Ẩn địa điểm
        if (locationGroup) {
            locationGroup.style.display = "none";
        }

        // Xóa địa điểm
        if (location) {
            location.value = "";
        }

    } else {

        // Ẩn link
        if (linkGroup) {
            linkGroup.style.display = "none";
        }

        // Hiện địa điểm
        if (locationGroup) {
            locationGroup.style.display = "block";
        }

        // Xóa link
        if (link) {
            link.value = "";
        }

    }
}

// ======================================================
// TOAST
// ======================================================

function showToast(message) {

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
                ${escapeHtml(message)}
            </strong>

            <p>
                Thao tác thành công
            </p>

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


// ======================================================
// DATE TIME
// ======================================================

function getDateTime(
    interview
) {

    const date =
        getInterviewDate(
            interview
        );


    const time =
        getInterviewTime(
            interview
        );


    if (!date || !time) {

        return new Date(0);

    }


    return new Date(
        `${date}T${time}`
    );

}


// ======================================================
// GET DATE
// ======================================================

function getInterviewDate(
    interview
) {

    return normalizeDate(
        interview.interview_date ||
        interview.date ||
        ""
    );

}


// ======================================================
// GET TIME
// ======================================================

function getInterviewTime(
    interview
) {

    return normalizeTime(
        interview.start_time ||
        interview.time ||
        ""
    );

}


// ======================================================
// GET TYPE
// ======================================================

function getInterviewType(
    interview
) {

    return (
        interview.interview_type ||
        interview.type ||
        "online"
    );

}


// ======================================================
// NORMALIZE DATE
// ======================================================

function normalizeDate(
    value
) {

    if (!value) {

        return "";

    }


    return String(
        value
    ).slice(
        0,
        10
    );

}


// ======================================================
// NORMALIZE TIME
// ======================================================

function normalizeTime(
    value
) {

    if (!value) {

        return "";

    }


    return String(
        value
    ).slice(
        0,
        5
    );

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleDateString(
        "vi-VN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// ======================================================
// FORMAT FULL DATE
// ======================================================

function formatFullDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleDateString(
        "vi-VN",
        {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// ======================================================
// GET INPUT VALUE
// ======================================================

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";

    }


    return element.value.trim();

}


// ======================================================
// SET INPUT VALUE
// ======================================================

function setInputValue(
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
// ESCAPE HTML
// ======================================================

function escapeHtml(
    value
) {

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

function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}