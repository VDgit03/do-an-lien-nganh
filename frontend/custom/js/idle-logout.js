
(() => {
    const IDLE_TIMEOUT = 30 * 60 * 1000;
    const CHECK_INTERVAL = 10 * 1000;
    const LAST_ACTIVITY_KEY = "cvStudioLastActivity";

    const LOGIN_URL = "../../auth/index.html";

    // Chỉ chạy khi người dùng đã đăng nhập
    if (!localStorage.getItem("token")) return;

    let lastActivity = Date.now();
    localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivity));

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem(LAST_ACTIVITY_KEY);

        window.location.href = LOGIN_URL;
    };

    const updateActivity = () => {
        // Không ghi nhận hoạt động nếu token đã bị xóa
        if (!localStorage.getItem("token")) return;

        lastActivity = Date.now();
        localStorage.setItem(
            LAST_ACTIVITY_KEY,
            String(lastActivity)
        );
    };

    const activityEvents = [
        "click",
        "keydown",
        "scroll",
        "touchstart",
        "pointerdown"
    ];

    activityEvents.forEach(event => {
        document.addEventListener(event, updateActivity, {
            passive: true
        });
    });

    // Đồng bộ thời gian hoạt động giữa các tab
    window.addEventListener("storage", event => {
        if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
            lastActivity = Number(event.newValue);
        }

        if (event.key === "token" && !event.newValue) {
            window.location.href = LOGIN_URL;
        }
    });

    setInterval(() => {
        if (!localStorage.getItem("token")) {
            window.location.href = LOGIN_URL;
            return;
        }

        const storedActivity = Number(
            localStorage.getItem(LAST_ACTIVITY_KEY)
        );

        if (storedActivity && storedActivity > lastActivity) {
            lastActivity = storedActivity;
        }

        if (Date.now() - lastActivity >= IDLE_TIMEOUT) {
            logout();
        }
    }, CHECK_INTERVAL);
})();
