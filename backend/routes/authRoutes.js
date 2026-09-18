import express from "express";
import { register } from "../controllers/auth/registerController.js";
import { login } from "../controllers/auth/loginController.js";
import { googleLogin } from "../controllers/auth/googleController.js";
// // import { getUser } from "../controllers/custom/userController.js";
// // import { changePassword } from "../controllers/custom/changepwController.js";
const router = express.Router();

// đăng kí, đăng nhập
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

// // lấy tên
// router.get("/user/:id", getUser);

// // đổi mk
// router.put("/changepw", changePassword);
export default router;