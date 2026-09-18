import { findUserByEmail } from "../../models/authModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginService = async (email, password) => {
  
  // 1. tìm user
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Email không tồn tại");
  }

  // 2. so sánh password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Sai mật khẩu");
  }

  // 3. tạo token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET, 
    { expiresIn: "30s" }
  );

  // 4. trả về
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