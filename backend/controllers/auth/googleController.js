import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { loginWithGoogle } from "../../services/auth/googleService.js";

dotenv.config();
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Thiếu Google token"
      });
    }

    const user = await loginWithGoogle(token);
    
    const appToken =
      jwt.sign(
        {
          id: user.id,
          email: user.email
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d"
        }
      );


    return res.status(200).json({
      success: true,
      message: "Đăng nhập Google thành công",

      token: appToken,

      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      }
    });

  } catch (err) {

    console.error(
      "Google Login Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Google login failed"
    });
  }
};