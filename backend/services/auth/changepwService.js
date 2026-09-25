import bcrypt from "bcrypt";

import { findUserById, updatePassword } from "../../models/authModel.js";

export const changePasswordService = async (
    userId,
    oldPassword,
    newPassword
) => {

    // tìm user
    const user =
        await findUserById(userId);
    if (!user) {
        throw new Error("User không tồn tại");
    }
    if (!user.password) {
        throw new Error("Tài khoản Google không thể đổi mật khẩu");
    }
    // kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(
            oldPassword,
            user.password
        );
    if (!isMatch) {
        throw new Error("Mật khẩu cũ không đúng");
    }

    // hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

    // old != new
    if (oldPassword === newPassword) {
        throw new Error(
            "Mật khẩu mới phải khác mật khẩu hiện tại"
        );
    }
    // update password
    await updatePassword(
        userId,
        hashedPassword
    );

    return {
        message: "Đổi mật khẩu thành công"
    };
};