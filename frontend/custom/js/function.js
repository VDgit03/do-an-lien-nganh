function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");

    window.location.href = "../../auth/index.html";
}


// load nav
async function loadNav() {

    try {

        const response = await fetch("../nav.html");

        if (!response.ok) {
            throw new Error("Không thể tải nav.html");
        }

        const data = await response.text();

        const navContainer =
            document.getElementById("nav-container");

        if (!navContainer) {
            return;
        }

        // đưa nav vào HTML
        navContainer.innerHTML = data;

        // active menu
        setActiveNav();

        // sau khi nav đã tồn tại mới đếm
        await loadSidebarStats();

    } catch (error) {

        console.error(
            "Lỗi load nav:",
            error
        );

    }
}


// active nav
function setActiveNav() {

    const path =
        window.location.pathname;

    let currentPage = "";


    if (path.includes("/home/")) {

        currentPage = "home";

    }

    else if (path.includes("/cv/")) {

        currentPage = "cv";

    }

    else if (path.includes("/analysis/")) {

        currentPage = "analysis";

    }

    else if (path.includes("/interview/")) {

        currentPage = "interview";

    }


    document
        .querySelectorAll(".nav-item")
        .forEach((item) => {

            item.classList.remove("active");

            if (
                item.dataset.page ===
                currentPage
            ) {

                item.classList.add("active");

            }

        });

}


// count cv + interview

async function loadSidebarStats() {

    try {

        const token =
            localStorage.getItem("token");


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

            throw new Error(
                "Không thể lấy thống kê"
            );

        }


        const data =
            await response.json();


        console.log(
            "Dữ liệu thống kê:",
            data
        );

        const cvElement =
            document.getElementById(
                "cv-count"
            );


        if (cvElement) {

            cvElement.textContent =
                `${data.cvCount || 0} CV`;

        }

        const interviewElement =
            document.getElementById(
                "interview-count"
            );


        if (interviewElement) {

            interviewElement.textContent =
                `${data.interviewCount || 0} lịch phỏng vấn`;

        }

    } catch (error) {

        console.error(
            "Lỗi load sidebar:",
            error
        );

    }

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadNav();

    }
);


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
