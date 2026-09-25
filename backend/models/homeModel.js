import db from "../config/db.js";

export const countCVs = async (userId) => {

    const [rows] = await db.query(
        `
        SELECT COUNT(*) AS count
        FROM cvs
        WHERE user_id = ?
        `,
        [userId]
    );

    return rows[0].count;
};


export const countInterviews = async (userId) => {

    const [rows] = await db.query(
        `
        SELECT COUNT(*) AS count
        FROM interviews
        WHERE user_id = ?
        `,
        [userId]
    );

    return rows[0].count;
};