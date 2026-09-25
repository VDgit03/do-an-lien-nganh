function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");

    window.location.href = "../../auth/index.html";
}

fetch("../nav.html")
    .then((response) => {
        if (!response.ok) {
            throw new Error("Không thể tải nav.html");
        }

        return response.text();
    })
    .then((data) => {
        document.getElementById("nav-container").innerHTML = data;

        setActiveNav();
    })
    .catch((error) => {
        console.error("Lỗi load nav:", error);
    });


function setActiveNav() {
    const path = window.location.pathname;

    let currentPage = "";

    if (path.includes("/home/")) {
        currentPage = "home";
    } else if (path.includes("/cv/")) {
        currentPage = "cv";
    } else if (path.includes("/analysis/")) {
        currentPage = "analysis";
    } else if (path.includes("/interview/")) {
        currentPage = "interview";
    }

    document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.remove("active");

        if (item.dataset.page === currentPage) {
            item.classList.add("active");
        }
    });
}


// popup đổi mk
document.addEventListener("DOMContentLoaded", () => {

    const changePasswordBtn = document.getElementById("change-password-btn");

    const passwordModal = document.getElementById("password-modal");

    const closePasswordModal = document.getElementById("close-password-modal");

    const cancelPassword = document.getElementById("cancel-password");

  const changePasswordForm = document.getElementById("change-password-form");

    if (!changePasswordBtn || !passwordModal) {
        return;
    }

    // mở popup
    changePasswordBtn.addEventListener("click", (event) => {

        event.stopPropagation();

        passwordModal.classList.add("active");

    });


    // đóng
    closePasswordModal.addEventListener("click", () => {
        passwordModal.classList.remove("active");

    });

    // hủy
    cancelPassword.addEventListener("click", () => {

        passwordModal.classList.remove("active");

    });

    // gửi
    changePasswordForm.addEventListener(
        "submit",
        handleChangePassword
    );

    // click ngoài popup
    passwordModal.addEventListener("click", (event) => {

        if (event.target === passwordModal) {

            passwordModal.classList.remove("active");

        }

    });

});


function togglePassword(el) {
    const wrapper = el.closest(".input");
    const pw = wrapper.querySelector("input");
    const icon = el.querySelector("i");

    if (pw.type === "password") {
        pw.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        pw.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}


// kiểm tra mk
function checkStrength(val) {
    const segs = ['s1','s2','s3','s4'].map(id => document.getElementById(id));
    const label = document.getElementById('strength-text');
    segs.forEach(s => { s.style.background = 'rgba(255,255,255,0.1)'; });
    if (!val) { label.textContent = ''; return; }
    let score = 0;
    if (val.length >= 8)  score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const colors  = ['#E24B4A','#EF9F27','#1D9E75','#4FAAFF'];
    const labels  = ['Rất yếu','Trung bình','Khá mạnh','Rất mạnh'];
    for (let i = 0; i < score; i++) segs[i].style.background = colors[Math.min(score-1,3)];
    label.textContent = labels[Math.min(score-1,3)];
    label.style.color = colors[Math.min(score-1,3)];
  }