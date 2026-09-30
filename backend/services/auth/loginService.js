import { findUserByEmail } from "../../models/authModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginService = async (email, password) => {
    // 1. Tìm user
    const user = await findUserByEmail(email);

    if (!user) {
        throw new Error("Email không tồn tại");
    }

    // 2. Kiểm tra tài khoản Google
    if (!user.password) {
        throw new Error(
            "Tài khoản này đăng nhập bằng Google. Vui lòng chọn Đăng nhập bằng Google."
        );
    }

    // 3. Kiểm tra password
    if (!password) {
        throw new Error("Vui lòng nhập mật khẩu");
    }

    // 4. So sánh password
    const isMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!isMatch) {
        throw new Error("Sai mật khẩu");
    }

    // 5. Tạo token
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );

    // 6. Trả về
    return {
        token,

        user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
        },
    };
};