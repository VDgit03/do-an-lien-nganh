// home
document.addEventListener("DOMContentLoaded", () => {
    loadHome();
});


// load home

async function loadHome() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../auth/index.html";
        return;
    }

    // hiển thị thời gian
    loadGreeting();
    loadCurrentDate();


    loadUserName();


    // dsach cv
    await loadCVs(token);

    showLoginSuccess();
}





// load cv
async function loadCVs(token) {

    const container = document.getElementById("cv-container");

    if (!container) {
        return;
    }

    try {
        const response =
            await fetch(
                "http://localhost:3000/api/cvs/my-cvs",
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

        if (!response.ok) {
            throw new Error("Không thể lấy danh sách CV");
        }

        const data = await response.json();
        

        const cvs = data.cvs || [];

        // ko có cv
        if (cvs.length === 0) {

    // Giữ nút Tạo CV ở phần tiêu đề
    const createBtn =
        document.getElementById("createCvBtn");

    if (createBtn) {
        createBtn.style.display = "";
    }

    container.innerHTML = `
        <div class="empty-cv">

            <h2>
                Chưa có CV nào
            </h2>

            <p>
                Bắt đầu bằng cách tạo bản CV
                đầu tiên của bạn.
            </p>

        </div>
    `;

    return;
}


        // có cv
        container.innerHTML = `
            <div class="cv-grid">
                ${cvs
                    .map(cv => createCVCard(cv))
                    .join("")
                }

                <!-- CARD TẠO CV MỚI -->
                <div
                    class="create-cv-card"
                    id="createCvCard"
                    onclick="goToCreateCV()"
                >
                    <i class="fa-solid fa-plus"></i>
                    <span>
                        Tạo CV mới
                    </span>
                </div>
            </div>
        `;
    }

    catch (error) {
        console.error("Lỗi load CV:",error);

        container.innerHTML = `
            <div class="empty-cv">
                <h2>
                    Không thể tải CV
                </h2>
                <p>
                    Vui lòng thử lại sau.
                </p>
            </div>
        `;
    }
}
function goToCreateCV() {
    window.location.href = "../cv/create_cv.html";
}


function createCVCard(cv) {

    const id =
        cv.id;

    const title =
        cv.title ||
        "CV chưa đặt tên";

    const color =
        cv.primary_color ||
        "#2f7867";

    const template =
        cv.template ||
        "layout1";

    return `
        <div
            class="cv-card"
            onclick="openCVDetail(${id})"
        >

            <div
                class="cv-preview ${template}"
                style="--cv-color: ${color};"
            >

                ${createCVPreview(
                    cv,
                    template
                )}

            </div>


            <div class="cv-card-footer">

                <div class="cv-title">

                    ${escapeHTML(title)}

                </div>


                <div class="cv-actions">


                    <button
                        type="button"
                        title="Chỉnh sửa"
                        onclick="
                            event.stopPropagation();
                            editCV(${id});
                        "
                    >

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        type="button"
                        title="Xóa"
                        onclick="
                            event.stopPropagation();
                            deleteCV(${id});
                        "
                    >

                        <i class="fa-regular fa-trash-can"></i>

                    </button>


                </div>

            </div>

        </div>
    `;
}

function editCV(id) {
    window.location.href = `../cv/create_cv.html?id=${id}`;
}
function openCVDetail(id) {

    window.location.href =
        `../cv/detail_cv.html?id=${id}`;

}

function createCVPreview(cv, template) {

    const name =
        escapeHTML(
            cv.full_name || "Chưa có tên"
        );

    const title =
        escapeHTML(
            cv.title || "CV chưa đặt tên"
        );

    // LAYOUT 1
    if (template === "layout1") {
        return `
            <div class="cv-preview-content">

                <h3>${name}</h3>

                <div class="real-text">
                    ${title}
                </div>

                <div class="line"></div>
                <div class="line line-short"></div>
                <div class="line"></div>
                <div class="line line-small"></div>
                <div class="line"></div>

            </div>
        `;
    }

    // LAYOUT 2
    if (template === "layout2") {
        return `
            <div class="cv-preview-content">

                <h3>${name}</h3>

                <div class="real-text">
                    ${title}
                </div>

                <div class="line line-small"></div>
                <div class="line"></div>
                <div class="line line-short"></div>

                <div class="line"></div>
                <div class="line line-small"></div>

            </div>
        `;
    }

    // LAYOUT 3
    if (template === "layout3") {
        return `
            <div class="cv-preview-content">

                <h3>${name}</h3>

                <div class="real-text">
                    ${title}
                </div>

                <div class="line line-short"></div>
                <div class="line line-small"></div>

                <div class="line"></div>
                <div class="line"></div>

                <div class="line line-short"></div>

            </div>
        `;
    }

    // LAYOUT 4
    if (template === "layout4") {
        return `
            <div class="cv-preview-content">

                <h3>${name}</h3>

                <div class="real-text">
                    ${title}
                </div>

                <div class="line"></div>

                <div class="line line-small"></div>
                <div class="line line-short"></div>

                <div class="line"></div>
                <div class="line line-small"></div>

            </div>
        `;
    }

    // Mặc định
    return `
        <div class="cv-preview-content">

            <h3>${name}</h3>

            <div class="real-text">
                ${title}
            </div>

            <div class="line"></div>
            <div class="line line-short"></div>
            <div class="line"></div>

        </div>
    `;
}
// toast genaral
function showToast(message) {

    const toastArea = document.getElementById("toastArea");

    if (!toastArea) {
        return;
    }

    const toast = document.createElement("div");

    toast.className = "toast";

    toast.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <div>
            <strong>
                ${escapeHTML(message)}
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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const message =
            sessionStorage.getItem(
                "toastMessage"
            );

        if (!message) {
            return;
        }

        showToast(message);

        sessionStorage.removeItem(
            "toastMessage"
        );
    }
);


// xóa cv
async function deleteCV(id) {
    const confirmDelete = confirm("Bạn có chắc muốn xóa CV này?");

    if (!confirmDelete) {
        return;
    }

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            logout();
            return;

        }

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

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Không thể xóa CV"
            );

        }

        showToast(
            "Đã xóa CV"
        );

        await loadCVs(token);

        await loadSidebarStats();

    }

    catch (error) {
        console.error("Lỗi xóa CV:",error);

        alert(error.message || "Có lỗi xảy ra khi xóa CV");
    }

}


// thông báo login thành công
function showLoginSuccess() {

    const toastArea = document.getElementById("toastArea");

    const userName = localStorage.getItem("userName");

    const loginSuccess = sessionStorage.getItem("loginSuccess");
 
    if (!toastArea || !userName || loginSuccess !== "true") {
        return;
    }

    const toast = document.createElement("div");

    toast.className ="toast";

    toast.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <div>
            <strong>
                Đăng nhập thành công
            </strong>
            <p>
                Chào mừng ${escapeHTML(userName)}
            </p>
        </div>
    `;

    toastArea.appendChild(toast);

    // hiện 1 lần
    sessionStorage.removeItem(
        "loginSuccess"
    );

    setTimeout(
        () => {
            toast.remove();
        },
        2000
    );

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
