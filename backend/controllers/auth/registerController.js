import { registerService } from "../../services/auth/registerService.js";

export const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password, confirm } = req.body;

    // check thiếu dữ liệu
    if (!first_name || !last_name || !email || !password || !confirm) {
      return res.status(400).json({
        message: "Thiếu thông tin",
      });
    }

    // check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Email không hợp lệ",
      });
    }

    // check password length
    if (password.length < 8) {
      return res.status(400).json({
        message: "Mật khẩu phải từ 8 ký tự trở lên",
      });
    }

    // check confirm password
    if (password !== confirm) {
      return res.status(400).json({
        message: "Mật khẩu không khớp",
      });
    }

    // gọi service
    const newUser = await registerService({
      first_name,
      last_name,
      email,
      password,
    });

    return res.status(201).json({
      message: "Đăng ký thành công",
      user: newUser,
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi server",
    });
  }
};