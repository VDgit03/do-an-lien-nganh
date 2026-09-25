import express from "express";
import { register } from "../controllers/auth/registerController.js";
import { login } from "../controllers/auth/loginController.js";
import { googleLogin } from "../controllers/auth/googleController.js";
import { changePassword } from "../controllers/auth/changepwController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// đăng kí, đăng nhập
router.post("/register", register);

router.post("/login", login);

router.post("/google", googleLogin);

// đổi mật khẩu
router.put("/changepw", authMiddleware,changePassword);

export default router;