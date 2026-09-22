
async function handleForgotPassword() {

    try {

        const email =
            document
            .getElementById("forgot-email")
            .value
            .trim();

        const res = await fetch(
            "http://localhost:3000/api/forget/forgot-password",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email
                })
            }
        );

        const data =
            await res.json();

        if (!res.ok) {

            alert(data.message);

            return;
        }

        localStorage.setItem(
            "reset_email",
            email
        );

        alert("Đã gửi OTP");

        switchTab("otp");

    } catch (err) {

        console.error(err);

        alert("Có lỗi xảy ra");
    }
}



async function handleVerifyOtp() {

    try {

        const email =
            localStorage.getItem(
                "reset_email"
            );

        const otp = Array
            .from(
                document.querySelectorAll(
                    ".otp-box"
                )
            )
            .map(input => input.value)
            .join("");

        if (otp.length !== 6) {

            alert("Vui lòng nhập đủ OTP");

            return;
        }

        const res = await fetch(
            "http://localhost:3000/api/forget/verify-otp",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email,
                    otp
                })
            }
        );

        const data =
            await res.json();

        if (!res.ok) {

            alert(data.message);

            return;
        }

        alert("OTP hợp lệ");

        localStorage.setItem( "reset_otp", otp );
        
        switchTab("reset");

    } catch (err) {

        console.error(err);

        alert("Có lỗi xảy ra");
    }
}


async function handleResetPassword() {

    try {

        const email =
            localStorage.getItem(
                "reset_email"
            );

        const otp = localStorage.getItem( "reset_otp" );

        const password =
            document
            .getElementById(
                "new-password"
            )
            .value
            .trim();

        const confirmPassword =
            document
            .getElementById(
                "confirm-password"
            )
            .value
            .trim();

        if (
            password !== confirmPassword
        ) {

            alert(
                "Mật khẩu không khớp"
            );

            return;
        }

        const res = await fetch(
            "http://localhost:3000/api/forget/reset-password",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    email,

                    otp,

                    password
                })
            }
        );

        const data =
            await res.json();

        if (!res.ok) {

            alert(data.message);

            return;
        }

        alert(
            "Đổi mật khẩu thành công"
        );

        // xóa local storage
        localStorage.removeItem(
            "reset_email"
        );
localStorage.removeItem( "reset_otp" );
        // về login
        switchTab("login");

    } catch (err) {

        console.error(err);

        alert("Có lỗi xảy ra");
    }
}



function initOtpInputs() {

    const otpInputs =
        document.querySelectorAll(
            ".otp-box"
        );

    otpInputs.forEach(
        (input, index) => {

            // nhập
            input.addEventListener(
                "input",
                (e) => {

                    e.target.value =
                        e.target.value
                        .replace(/\D/g, "");

                    // tự chuyển ô
                    if (
                        e.target.value &&
                        index <
                        otpInputs.length - 1
                    ) {

                        otpInputs[
                            index + 1
                        ].focus();
                    }

                    // tự verify
                    const otp =
                        Array
                        .from(
                            otpInputs
                        )
                        .map(
                            i => i.value
                        )
                        .join("");

                    if (
                        otp.length === 6
                    ) {

                        handleVerifyOtp();
                    }
                }
            );

            // backspace
            input.addEventListener(
                "keydown",
                (e) => {

                    if (
                        e.key ===
                        "Backspace" &&
                        !input.value &&
                        index > 0
                    ) {

                        otpInputs[
                            index - 1
                        ].focus();
                    }
                }
            );

            // paste
            input.addEventListener(
                "paste",
                (e) => {

                    e.preventDefault();

                    const pasted =
                        (
                            e.clipboardData ||
                            window.clipboardData
                        )
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6);

                    pasted
                        .split("")
                        .forEach(
                            (char, i) => {

                                if (
                                    otpInputs[i]
                                ) {

                                    otpInputs[
                                        i
                                    ].value =
                                        char;
                                }
                            }
                        );

                    if (
                        pasted.length === 6
                    ) {

                        handleVerifyOtp();
                    }
                }
            );
        }
    );

    // focus ô đầu
    if (otpInputs[0]) {

        otpInputs[0].focus();
    }
}
