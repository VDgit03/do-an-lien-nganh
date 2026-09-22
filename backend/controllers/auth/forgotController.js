import { forgotPasswordService, verifyOtpService, resetPasswordService } from "../../services/auth/forgotService.js";

// forgot
export const forgotPassword = async (
    req,
    res
) => {

    try {
        const result = await forgotPasswordService(req.body.email);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(400).json({
            message: err.message
        });
    }
};


// verify
export const verifyOtp = async (
    req,
    res
) => {
    try {
        const {
            email,
            otp
        } = req.body;

        const result = await verifyOtpService(
                email,
                otp
            );
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(400).json({
            message: err.message
        });
    }
};

// reset
export const resetPassword = async (
    req,
    res
) => {
    try {
        const {
            email,
            otp,
            password
        } = req.body;
        const result = await resetPasswordService(
                email,
                otp,
                password
            );
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(400).json({
            message: err.message
        });
    }
};

