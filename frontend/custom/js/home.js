// home
document.addEventListener("DOMContentLoaded", () => {
    loadHome();
});


// load home

async function loadHome() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../../auth/auth.html";
        return;
    }

    // hiển thị thời gian
    loadGreeting();
    loadCurrentDate();


    loadUserName();

    // thống kê
    await loadSidebarStats();

    // dsach cv
    await loadCVs(token);

    showLoginSuccess();
}


// chào
function loadGreeting() {

    const hour = new Date().getHours();

    let greeting;

    if (hour >= 5 && hour < 12) {
        greeting = "Chào buổi sáng,";
    } else if (hour >= 12 && hour < 18) {
        greeting = "Chào buổi chiều,";
    } else {
        greeting = "Chào buổi tối,";
    }

    const element = document.getElementById("greeting");

    if (element) {
        element.textContent = greeting;
    }
}


// current date
function loadCurrentDate() {
    const now = new Date();
    const days = [
        "Chủ Nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy"
    ];

    const dayName = days[now.getDay()];

    const day = String(now.getDate()).padStart(2, "0");

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const year = now.getFullYear();

    const element = document.getElementById("current-date");

    if (element) {
        element.textContent = `${dayName}, ${day}/${month}/${year}`;
    }
}

// username
function loadUserName() {

    const userName = localStorage.getItem("userName");

    if (!userName) {
        return;
    }

    // tên header
    const nameElement = document.getElementById("user-name");

    if (nameElement) {
        nameElement.textContent = userName;

    }

    // tên account
    const shortNameElement =
        document.getElementById("user-short-name");

    if (shortNameElement) {
        shortNameElement.textContent = userName;
    }

    // avatar
    const avatar = document.getElementById("user-avatar");

    if (avatar) {
        const parts = userName.trim().split(/\s+/);

        let initials = "";

        if (parts.length >= 2) {
            initials = parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
        } else {
            initials = parts[0].charAt(0);
        }

        avatar.textContent = initials.toUpperCase();
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const headerUser = document.getElementById("header-user");
    const dropdown = document.getElementById("user-dropdown");

    if (!headerUser || !dropdown) {
        console.log("Không tìm thấy dropdown");
        return;
    }

    headerUser.addEventListener("click", (event) => {

        event.stopPropagation();

        headerUser.classList.toggle("active");

    });

    dropdown.addEventListener("click", (event) => {

        event.stopPropagation();

    });

    document.addEventListener("click", () => {

        headerUser.classList.remove("active");

    });

});


// nav
async function loadSidebarStats() {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            logout();
            return;
        }

        const response =
            await fetch(
                "http://localhost:3000/api/home/summary",
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
            throw new Error("Không thể lấy thống kê");
        }

        const data = await response.json();

        const cvCount = data.cvCount || 0;

        const interviewCount = data.interviewCount || 0;

        // số lượng cv
        const cvElement =
            document.getElementById("cv-count");

        if (cvElement) {
            cvElement.textContent = `${cvCount} CV`;
        }

        // số lượng tbao
        const interviewElement = document.getElementById("interview-count");

        if (interviewElement) {
            interviewElement.textContent = `${interviewCount} lịch phỏng vấn`;
        }
    }
    catch (error) {
        console.error(
            "Lỗi load sidebar:",
            error
        );
    }
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
                "http://localhost:3000/api/cv/my-cvs",
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
            container.innerHTML = `
                <div class="empty-cv">
                    <h2>
                        Chưa có CV nào
                    </h2>
                    <p>
                        Bắt đầu bằng cách tạo bản CV
                        đầu tiên của bạn.
                    </p>
                    <button
                        type="button"
                        class="create-cv-btn"
                        onclick="goToCreateCV()"
                    >
                        <i class="fa-solid fa-plus"></i>
                        Tạo CV mới
                    </button>
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


// hiển thị cv
function createCVCard(cv) {

    const id =
        cv.id;

    const title =
        cv.title ||
        "CV chưa đặt tên";

    const name =
        cv.full_name ||
        "Chưa có tên";

    const position =
        cv.position ||
        "Chưa có vị trí";


    /*
     * Màu preview
     */

    const color = cv.primary_color || "#2f7867";

    return `
        <div class="cv-card">

            <!-- PREVIEW -->
            <div
                class="cv-preview"
                style="--cv-color: ${color};"
            >
                <div class="cv-preview-content">
                    <h3>
                        ${escapeHTML(name)}
                    </h3>
                    <p>
                        ${escapeHTML(position)}
                    </p>
                    <div class="preview-line"></div>
                    <div class="preview-line short"></div>
                    <div class="preview-line"></div>
                    <div class="preview-line medium"></div>
                </div>
            </div>

            <!-- FOOTER -->
            <div class="cv-card-footer">
                <div class="cv-title">
                    ${escapeHTML(title)}
                </div>
                <div class="cv-actions">

                    <!-- EDIT -->
                    <button
                        type="button"
                        title="Chỉnh sửa"
                        onclick="editCV(${id})"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <!-- DELETE -->
                    <button
                        type="button"
                        title="Xóa"
                        onclick="deleteCV(${id})"
                    >
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}


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
                `http://localhost:3000/api/cv/${id}`,
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


async function handleChangePassword(event) {
    event.preventDefault();

    try {
        const oldPassword = document.getElementById("current-password").value.trim();

        const newPassword = document.getElementById("new-password").value.trim();

        const confirmPassword = document.getElementById("confirm-password").value.trim();

        const userId = localStorage.getItem("userId");

        // validate
        if (!oldPassword || !newPassword || !confirmPassword) {
            alert("Vui lòng nhập đầy đủ");
            return;
        }

        if (newPassword.length < 8) {
            alert("Mật khẩu mới phải có ít nhất 8 ký tự");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp");
            return;
        }

        // Không cho mật khẩu mới giống mật khẩu cũ
        if (oldPassword === newPassword) {
            alert("Mật khẩu mới phải khác mật khẩu hiện tại");
            return;
        }

        // request
        const token = localStorage.getItem("token");

        const res = await fetch(
            "http://localhost:3000/api/auth/changepw",
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    userId,
                    oldPassword,
                    newPassword,
                    confirmPassword
                })
            }
        );


        const data = await res.json();

        // login = gg ko đổi mk
        if (data.isGoogle) {
            alert(
                "Tài khoản Google không thể đổi mật khẩu tại đây"
            );
            return;
        }

        if (!res.ok) {
            if (res.status === 401) {
                logout();
                return;
            }
            alert(data.message);
            return;
        }

        alert(
            data.message || "Đổi mật khẩu thành công"
        );


        // đóng popup
        const modal = document.getElementById("password-modal");

        if (modal) {
            modal.classList.remove("active");
        }


        // xóa dữ liệu form
        document.getElementById(
            "change-password-form"
        ).reset();

        if (typeof checkStrength === "function") {
            checkStrength("");
        }

    } catch (err) {
        console.error(
            "CHANGE PASSWORD ERROR:",
            err
        );

        alert(
            "Không thể kết nối đến máy chủ"
        );
    }
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