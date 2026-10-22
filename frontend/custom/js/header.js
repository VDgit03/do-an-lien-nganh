document.addEventListener("DOMContentLoaded", async () => {

    const headerContainer =
        document.getElementById("header-container");

    if (!headerContainer) {
        return;
    }

    try {

        /*
         * TẢI HEADER
         */

        const response =
            await fetch("../header.html");

        if (!response.ok) {

            throw new Error(
                `Không thể tải header.html: ${response.status}`
            );

        }

        const html =
            await response.text();

        headerContainer.innerHTML = html;


        /*
         * KHỞI TẠO HEADER
         */

        initHeader();

    } catch (error) {

        console.error(
            "Lỗi tải header:",
            error
        );

    }

});


/* =========================================
   INIT HEADER
========================================= */


function initHeader() {
    loadGreeting();
    loadCurrentDate();
    loadUserName();
    initDropdown();
    setupTheme();
    initChangePassword();
}



/* =========================================
   CHÀO
========================================= */

function loadGreeting() {

    const hour =
        new Date().getHours();

    let greeting;

    if (hour >= 5 && hour < 12) {

        greeting = "Chào buổi sáng,";

    } else if (hour >= 12 && hour < 18) {

        greeting = "Chào buổi chiều,";

    } else {

        greeting = "Chào buổi tối,";

    }

    const element =
        document.getElementById("greeting");

    if (element) {

        element.textContent =
            greeting;

    }

}


/* =========================================
   NGÀY
========================================= */

function loadCurrentDate() {

    const now =
        new Date();

    const days = [
        "Chủ Nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy"
    ];

    const dayName =
        days[now.getDay()];

    const day =
        String(now.getDate()).padStart(2, "0");

    const month =
        String(now.getMonth() + 1).padStart(2, "0");

    const year =
        now.getFullYear();

    const element =
        document.getElementById("current-date");

    if (element) {

        element.textContent =
            `${dayName}, ${day}/${month}/${year}`;

    }

}


/* =========================================
   TÊN USER
========================================= */

function loadUserName() {

    const userName =
        localStorage.getItem("userName");

    if (!userName) {
        return;
    }

    const nameElement =
        document.getElementById("user-name");

    if (nameElement) {

        nameElement.textContent =
            userName;

    }


    const shortNameElement =
        document.getElementById("user-short-name");

    if (shortNameElement) {

        shortNameElement.textContent =
            userName;

    }


    const avatar =
        document.getElementById("user-avatar");

    if (avatar) {

        const parts =
            userName
                .trim()
                .split(/\s+/);

        let initials = "";

        if (parts.length >= 2) {

            initials =
                parts[0].charAt(0) +
                parts[parts.length - 1].charAt(0);

        } else {

            initials =
                parts[0].charAt(0);

        }

        avatar.textContent =
            initials.toUpperCase();

    }

}


/* =========================================
   DROPDOWN
========================================= */

function initDropdown() {

    const headerUser =
        document.getElementById("header-user");

    const dropdown =
        document.getElementById("user-dropdown");

    if (!headerUser || !dropdown) {
        return;
    }


    headerUser.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            headerUser.classList.toggle(
                "active"
            );

        }
    );


    dropdown.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

        }
    );


    document.addEventListener(
        "click",
        () => {

            headerUser.classList.remove(
                "active"
            );

        }
    );

}


/* =========================================
   ĐỔI MẬT KHẨU
========================================= */

function initChangePassword() {

    const changePasswordBtn =
        document.getElementById(
            "change-password-btn"
        );

    const passwordModal =
        document.getElementById(
            "password-modal"
        );

    const closePasswordModal =
        document.getElementById(
            "close-password-modal"
        );

    const cancelPassword =
        document.getElementById(
            "cancel-password"
        );

    const changePasswordForm =
        document.getElementById(
            "change-password-form"
        );


    if (
        !changePasswordBtn ||
        !passwordModal
    ) {

        console.log(
            "Không tìm thấy modal đổi mật khẩu"
        );

        return;

    }


    /*
     * MỞ MODAL
     */

    changePasswordBtn.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            passwordModal.classList.add(
                "active"
            );

        }
    );


    /*
     * ĐÓNG BẰNG X
     */

    if (closePasswordModal) {

        closePasswordModal.addEventListener(
            "click",
            () => {

                closePasswordModalFn();

            }
        );

    }


    /*
     * HỦY
     */

    if (cancelPassword) {

        cancelPassword.addEventListener(
            "click",
            () => {

                closePasswordModalFn();

            }
        );

    }


    /*
     * CLICK RA NGOÀI
     */

    passwordModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                passwordModal
            ) {

                closePasswordModalFn();

            }

        }
    );


    /*
     * SUBMIT
     */

    if (changePasswordForm) {

        changePasswordForm.addEventListener(
            "submit",
            handleChangePassword
        );

    }

}


/* =========================================
   ĐÓNG MODAL
========================================= */

function closePasswordModalFn() {

    const modal =
        document.getElementById(
            "password-modal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "active"
    );

}


/* =========================================
   TOGGLE PASSWORD
========================================= */

function togglePassword(element) {

    const input =
        element.parentElement.querySelector(
            "input"
        );

    if (!input) {
        return;
    }

    const icon =
        element.querySelector("i");

    if (input.type === "password") {

        input.type = "text";

        icon.classList.remove(
            "fa-eye"
        );

        icon.classList.add(
            "fa-eye-slash"
        );

    } else {

        input.type = "password";

        icon.classList.remove(
            "fa-eye-slash"
        );

        icon.classList.add(
            "fa-eye"
        );

    }

}


/* =========================================
   KIỂM TRA ĐỘ MẠNH PASSWORD
========================================= */

function checkStrength(password) {

    const bars = [
        document.getElementById("s1"),
        document.getElementById("s2"),
        document.getElementById("s3"),
        document.getElementById("s4")
    ];

    const text =
        document.getElementById(
            "strength-text"
        );

    if (!text) {
        return;
    }


    let score = 0;


    if (password.length >= 8) {
        score++;
    }

    if (/[A-Z]/.test(password)) {
        score++;
    }

    if (/[0-9]/.test(password)) {
        score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }


    bars.forEach((bar) => {

        if (bar) {

            bar.classList.remove(
                "active"
            );

        }

    });


    if (!password) {

        text.textContent = "";

        return;

    }


    let label = "";


    if (score === 1) {

        label = "Yếu";

    } else if (score === 2) {

        label = "Trung bình";

    } else if (score === 3) {

        label = "Khá";

    } else {

        label = "Mạnh";

    }


    for (let i = 0; i < score; i++) {

        if (bars[i]) {

            bars[i].classList.add(
                "active"
            );

        }

    }


    text.textContent =
        label;

}


/* =========================================
   XỬ LÝ ĐỔI MẬT KHẨU
========================================= */

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
    



/* =========================================
   THEME SÁNG / TỐI
========================================= */

function setupTheme() {
    const themeButtons = document.querySelectorAll(".theme-option");

    // Khôi phục giao diện đã lưu
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);

    // Gắn sự kiện cho các nút trong header đã tải
    themeButtons.forEach((button) => {
        // Tránh gắn sự kiện nhiều lần
        if (button.dataset.themeInitialized === "true") {
            return;
        }

        button.dataset.themeInitialized = "true";

        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            const theme = button.dataset.theme;

            if (theme !== "light" && theme !== "dark") {
                return;
            }

            localStorage.setItem("theme", theme);
            applyTheme(theme);
        });
    });
}

function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");

    document.querySelectorAll(".theme-option").forEach((button) => {
        const isActive = button.dataset.theme === theme;

        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}
