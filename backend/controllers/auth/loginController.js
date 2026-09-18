import { loginService } from "../../services/auth/loginService.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validate
    if (!email || !password) {
      return res.status(400).json({
        message: "Thiếu email hoặc mật khẩu",
      });
    }

    const result = await loginService(email, password);
    return res.json({
      message: "Đăng nhập thành công",
      token: result.token,
      user: result.user,
    });

  } catch (err) {
    return res.status(400).json({
      message: err.message,
    });
  }
};