// xem mk
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


// đổi tab
function switchTab(tab) {
    const tabContainer = document.querySelector(".tab");
    const loginTab = document.getElementById("tab-login");
    const registerTab = document.getElementById("tab-register");

    if (tab === "forgot" || tab === "otp" || tab === "reset") {
        tabContainer.style.display = "none";
    } else {
        tabContainer.style.display = "grid";
    }

    loginTab.classList.toggle("active", tab === "login");
    registerTab.classList.toggle("active", tab === "register");

    let file = "";

    if (tab === "login") {
        file = "login.html";
    } else if (tab === "register") {
        file = "register.html";
    } else if (tab === "forgot") {
        file = "forgot.html";
    } else if (tab === "otp") {
        file = "otp.html";
    } else if (tab === "reset") {
        file = "reset.html";
    }

    fetch(file)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Không tìm thấy ${file}`);
            }
            return res.text();
        })
        .then(data => {
            document.getElementById("content").innerHTML = data;

            if (tab === "otp") {
                setTimeout(initOtpInputs, 0);
            }

            if (tab === "login") {
                setTimeout(initGoogle, 500);
            }
        })
        .catch(error => {
            console.error(error);

            document.getElementById("content").innerHTML =
                `<p style="color:red">${error.message}</p>`;
        });
}


// load mặc định
window.onload = () => switchTab('login');


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


// đki
async function handleRegister() {
    const form = document.getElementById("sec-register");
    const first_name = form.querySelector('[name="first_name"]').value.trim();
    const last_name = form.querySelector('[name="second_name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="pw"]').value.trim();
    const confirm = form.querySelector('[name="confirm"]').value.trim();

    const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            first_name,
            last_name,
            email,
            password,
            confirm,
        }),
    });

    const data = await res.json();

    if (res.ok) {
        alert(data.message);
        switchTab("login");
    } else {
        alert(data.message);
    }
}


// đăng nhập
async function handleLogin() {
    const form = document.getElementById("sec-login");

    const email =
        document.querySelector('[name="email"]').value.trim();

    const password =
        document.querySelector('[name="pw"]').value.trim();

    const res = await fetch(
        "http://localhost:3000/api/auth/login",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        }
    );

    const data = await res.json();
    if (data.token) {

        // lưu token
        localStorage.setItem(
            "token",
            data.token
        );

        // lưu ID
        localStorage.setItem(
            "userId",
            data.user.id
        );

        // lưu tên
        localStorage.setItem(
            "userName",
            `${data.user.first_name} ${data.user.last_name}`.trim()
        );

        // báo cho Home biết vừa đăng nhập
        sessionStorage.setItem(
            "loginSuccess",
            "true"
        );

        // chuyển sang Home
        window.location.href =
            "../custom/home/home.html";

    } else {
        alert(data.message);

    }
}


// tạo client id
function initGoogle() {
    const btn = document.getElementById("google-btn");

    if (!btn) {
        console.log("Không tìm thấy nút Google");
        return;
    }

    if (!window.google || !google.accounts) {
        console.log("Google SDK chưa load");
        setTimeout(initGoogle, 500);
        return;
    }

    const client = google.accounts.oauth2.initTokenClient({
        client_id:
            "413058009832-kfg2eqgimepmr6o0aae9j8bg3tjvie5n.apps.googleusercontent.com",

        scope: "openid email profile",

        callback: async (response) => {
            if (response.error) {
                console.error("Google Login Error:", response);
                return;
            }

            console.log("Google Access Token:", response.access_token);
            
            await handleGoogleLogin(response.access_token);
        }
    });

    btn.onclick = () => {
        client.requestAccessToken();
    };
}

// đăng nhập = gg
async function handleGoogleLogin(accessToken) {

    try {

        const res = await fetch(
            "http://localhost:3000/api/auth/google",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    token: accessToken
                })
            }
        );


        const data =
            await res.json();


        console.log(
            "Backend:",
            data
        );


        if (!res.ok) {

            console.error(
                "Google login thất bại:",
                data
            );

            return;
        }


        if (data.token) {

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "userId",
                data.user.id
            );


            const fullName = `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim();

            localStorage.setItem(
                "userName",
                fullName
            );


            console.log(
                "Tên đã lưu:",
                localStorage.getItem(
                    "userName"
                )
            );

            window.location.href =
                "../custom/home/home.html";
        }


    } catch (error) {

        console.error(
            "Lỗi đăng nhập Google:",
            error
        );
    }
}