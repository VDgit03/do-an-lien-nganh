import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { findUserByEmail, deleteOldOtp, createOtp, findValidOtp, updatePassword } from "../../models/forgotModel.js";

// send otp
export const forgotPasswordService =
async (email) => {

    if (!email) {

        throw new Error(
            "Vui lòng nhập email"
        );
    }

    const users =
        await findUserByEmail(email);

    if (users.length === 0) {

        throw new Error(
            "Email không tồn tại"
        );
    }

    const user = users[0];

    // google account
    if (
        !user.password ||
        user.password.trim() === ""
    ) {

        throw new Error(
            "Tài khoản này đăng nhập bằng Google nên không thể đổi mật khẩu"
        );
    }

    // xóa otp cũ
    await deleteOldOtp(user.id);

    // tạo otp
    const otp =
        Math.floor(
            100000 + Math.random() * 900000
        ).toString();

    const expiresAt =
        new Date(
            Date.now() + 5 * 60 * 1000
        );

    // lưu otp
    await createOtp(
        user.id,
        otp,
        expiresAt
    );

    // gửi mail
    const transporter =
        nodemailer.createTransport({

            service: "gmail",

            auth: {

                user:
                    process.env.MAIL_USER,

                pass:
                    process.env.MAIL_PASS
            }
        });

    await transporter.sendMail({
    from: "CV Studio",

    to: email,

    subject: "OTP Reset Password",

    html: `
        <div style="
            font-family: Arial;
            padding: 20px;
        ">
            <h2>Mã OTP đặt lại mật khẩu</h2>

            <h1>${otp}</h1>

            <p>OTP có hiệu lực trong 5 phút</p>
        </div>
    `
});

    return {
        message:
            "Đã gửi OTP"
    };
};


// verify otp
export const verifyOtpService =
async (
    email,
    otp
) => {

    const users =
        await findUserByEmail(email);

    if (users.length === 0) {

        throw new Error(
            "User không tồn tại"
        );
    }

    const user = users[0];

    const rows =
        await findValidOtp(
            user.id,
            otp
        );

    if (rows.length === 0) {

        throw new Error(
            "OTP không hợp lệ hoặc hết hạn"
        );
    }

    return {
        message:
            "OTP hợp lệ"
    };
};


// reset password
export const resetPasswordService =
async (
    email,
    otp,
    password
) => {

    const users =
        await findUserByEmail(email);

    if (users.length === 0) {

        throw new Error(
            "User không tồn tại"
        );
    }

    const user = users[0];

    const rows =
        await findValidOtp(
            user.id,
            otp
        );

    if (rows.length === 0) {

        throw new Error(
            "OTP không hợp lệ"
        );
    }

    const hashedPassword =
        await bcrypt.hash(
            password,
            10
        );

    await updatePassword(
        user.id,
        hashedPassword
    );

    await deleteOldOtp(user.id);

    return {
        message:
            "Đổi mật khẩu thành công"
    };
};

