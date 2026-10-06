import db from "../config/db.js";

// ======================================================
// GET ALL INTERVIEWS BY USER
// ======================================================

export const getInterviewsByUserId = async (userId) => {
    const [rows] = await db.execute(
        `
        SELECT
            id,
            user_id,
            cv_id,
            company,
            position,
            DATE_FORMAT(interview_date, '%Y-%m-%d') AS interview_date,
            TIME_FORMAT(start_time, '%H:%i') AS start_time,
            interview_type,
            interview_link,
            location,
            note,
            reminder_enabled,
            reminder_minutes,
            reminder_sent,
            reminder_sent_at,
            status,
            created_at,
            updated_at
        FROM interviews
        WHERE user_id = ?
        ORDER BY interview_date ASC, start_time ASC
        `,
        [userId]
    );

    return rows;
};


// ======================================================
// GET ONE INTERVIEW
// ======================================================

export const getInterviewById = async (id, userId) => {
    const [rows] = await db.execute(
        `
        SELECT
            id,
            user_id,
            cv_id,
            company,
            position,
            DATE_FORMAT(interview_date, '%Y-%m-%d') AS interview_date,
            TIME_FORMAT(start_time, '%H:%i') AS start_time,
            interview_type,
            interview_link,
            location,
            note,
            reminder_enabled,
            reminder_minutes,
            reminder_sent,
            reminder_sent_at,
            status,
            created_at,
            updated_at
        FROM interviews
        WHERE id = ?
        AND user_id = ?
        LIMIT 1
        `,
        [id, userId]
    );

    return rows[0] || null;
};


// ======================================================
// CREATE INTERVIEW
// ======================================================

export const createInterview = async (data) => {
    const {
        user_id,
        cv_id,
        company,
        position,
        interview_date,
        start_time,
        interview_type,
        interview_link,
        location,
        note,
        reminder_enabled,
        reminder_minutes
    } = data;

    const [result] = await db.execute(
        `
        INSERT INTO interviews
        (
            user_id,
            cv_id,
            company,
            position,
            interview_date,
            start_time,
            interview_type,
            interview_link,
            location,
            note,
            reminder_enabled,
            reminder_minutes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            user_id,
            cv_id,
            company,
            position,
            interview_date,
            start_time,
            interview_type,
            interview_link,
            location,
            note,
            reminder_enabled,
            reminder_minutes
        ]
    );

    return result.insertId;
};


// ======================================================
// UPDATE INTERVIEW
// ======================================================

export const updateInterview = async (id, userId, data) => {
    const {
        cv_id,
        company,
        position,
        interview_date,
        start_time,
        interview_type,
        interview_link,
        location,
        note,
        reminder_enabled,
        reminder_minutes,
        status
    } = data;

    const [result] = await db.execute(
        `
        UPDATE interviews
        SET
            cv_id = ?,
            company = ?,
            position = ?,
            interview_date = ?,
            start_time = ?,
            interview_type = ?,
            interview_link = ?,
            location = ?,
            note = ?,
            reminder_enabled = ?,
            reminder_minutes = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND user_id = ?
        `,
        [
            cv_id,
            company,
            position,
            interview_date,
            start_time,
            interview_type,
            interview_link,
            location,
            note,
            reminder_enabled,
            reminder_minutes,
            status,
            id,
            userId
        ]
    );

    return result;
};


// ======================================================
// DELETE INTERVIEW
// ======================================================

export const deleteInterview = async (id, userId) => {
    const [result] = await db.execute(
        `
        DELETE FROM interviews
        WHERE id = ?
        AND user_id = ?
        `,
        [id, userId]
    );

    return result;
};