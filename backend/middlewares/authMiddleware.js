import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Chưa đăng nhập"
            });

        }


        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                message: "Token không hợp lệ"
            });

        }


        const token = parts[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        req.userId = decoded.id;

        if (!req.userId) {
            return res.status(401).json({
                message:
                    "Không tìm thấy ID người dùng trong token"
            });

        }

        next();

    } catch (error) {

        console.error(
            "JWT error:",
            error
        );

        return res.status(401).json({
            message:
                "Token không hợp lệ hoặc đã hết hạn"
        });

    }

};