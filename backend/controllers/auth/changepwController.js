import { changePasswordService } from "../../services/auth/changepwService.js";

export const changePassword = async (req, res) => {
    try {
        const {
            oldPassword,
            newPassword,
            confirmPassword
        } = req.body;

        // validate
        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ"
            });
        }

        // xác nhận mật khẩu
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Mật khẩu xác nhận không khớp"
            });
        }

        // độ dài mật khẩu
        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "Mật khẩu tối thiểu 8 ký tự"
            });
        }

        // ID lấy từ JWT
        const userId = req.user.id;

        const result = await changePasswordService(
            userId,
            oldPassword,
            newPassword
        );

        return res.status(200).json(result);

    } catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err);

        return res.status(400).json({
            message: err.message
        });
    }
};