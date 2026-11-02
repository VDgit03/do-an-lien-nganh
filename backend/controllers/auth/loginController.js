import { loginService } from "../../services/auth/loginService.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate dữ liệu
        if (!email || !password) {
            return res.status(400).json({
                message: "Thiếu email hoặc mật khẩu",
            });
        }

        // 2. Xử lý nghiệp vụ đăng nhập
        const user = await loginService(email, password);

        // 3. Tạo JWT tại Controller
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "30m",
            }
        );

        // 4. Trả kết quả về frontend
        return res.status(200).json({
            message: "Đăng nhập thành công",
            token,
            user,
        });

    } catch (err) {
        return res.status(400).json({
            message: err.message,
        });
    }
};
