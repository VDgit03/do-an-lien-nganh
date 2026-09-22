import express from "express";
import { forgotPassword, verifyOtp, resetPassword } from "../controllers/auth/forgotController.js";
const router = express.Router();

// quên mk  
router.post("/forgot-password", forgotPassword);

// verify
router.post("/verify-otp",verifyOtp);

// reset
router.post("/reset-password",resetPassword);

export default router;