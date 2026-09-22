
import db from "../config/db.js";

// tìm user theo email
export const findUserByEmail =
async (email) => {

    const [rows] = await db.query(
        `
        SELECT *
        FROM users
        WHERE email = ?
        `,
        [email]
    );

    return rows;
};

// xóa otp cũ
export const deleteOldOtp =
async (userId) => {

    await db.query(
        `
        DELETE FROM password_resets
        WHERE user_id = ?
        `,
        [userId]
    );
};

// lưu otp
export const createOtp =
async (
    userId,
    otp,
    expiresAt
) => {

    await db.query(
        `
        INSERT INTO password_resets
        (user_id, otp, expires_at)
        VALUES (?, ?, ?)
        `,
        [userId, otp, expiresAt]
    );
};

// kiểm tra otp
export const findValidOtp =
async (
    userId,
    otp
) => {

    const [rows] = await db.query(
        `
        SELECT *
        FROM password_resets
        WHERE user_id = ?
        AND otp = ?
        AND expires_at > NOW()
        `,
        [userId, otp]
    );

    return rows;
};

// update password
export const updatePassword =
async (
    userId,
    password
) => {

    await db.query(
        `
        UPDATE users
        SET password = ?
        WHERE id = ?
        `,
        [password, userId]
    );
};

