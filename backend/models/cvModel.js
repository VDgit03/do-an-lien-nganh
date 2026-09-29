import db from "../config/db.js";

// tạo cv
export const createCV = async (
    connection,
    data
) => {

    const [result] = await connection.execute(
        `
        INSERT INTO cvs
        (
            user_id,
            title,
            full_name,
            position,
            summary,
            skills,
            soft_skills,
            email,
            phone,
            address,
            primary_color,
            template
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.user_id ?? null,
            data.title ?? null,
            data.full_name ?? null,
            data.position ?? null,
            data.summary ?? null,
            data.skills ?? null,
            data.soft_skills ?? null,
            data.email ?? null,
            data.phone ?? null,
            data.address ?? null,
            data.primary_color ?? "#2F7867",
            data.template ?? "layout1"
        ]
    );

    return result.insertId;
};


// lấy cv user
export const getCVsByUserId = async (
    userId
) => {

    const [rows] = await db.query(
        `
        SELECT
            id,
            title,
            full_name,
            position,
            summary,
            skills,
            soft_skills,
            email,
            phone,
            address,
            primary_color,
            template,
            created_at,
            updated_at
        FROM cvs
        WHERE user_id = ?
        ORDER BY updated_at DESC
        `,
        [userId]
    );

    return rows;
};


// experience
export const createExperience = async (
    connection,
    cvId,
    experience
) => {

    await connection.execute(
        `
        INSERT INTO cv_experiences
        (
            cv_id,
            position,
            time_range,
            company,
            description
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            cvId,
            experience.position ?? null,
            experience.time_range ?? null,
            experience.company ?? null,
            experience.description ?? null
        ]
    );
};


// education
export const createEducation = async (
    connection,
    cvId,
    education
) => {

    await connection.execute(
        `
        INSERT INTO cv_educations
        (
            cv_id,
            degree,
            time_range,
            school
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            cvId,
            education.degree ?? null,
            education.time_range ?? null,
            education.school ?? null
        ]
    );
};


// language
export const createLanguage = async (
    connection,
    cvId,
    language
) => {

    await connection.execute(
        `
        INSERT INTO cv_languages
        (
            cv_id,
            language_name,
            level
        )
        VALUES (?, ?, ?)
        `,
        [
            cvId,
            language.name ?? null,
            language.level ?? null
        ]
    );
};


// xóa cv
export const deleteCVById = async (
    id,
    userId
) => {

    const [result] = await db.query(
        `
        DELETE FROM cvs
        WHERE id = ?
        AND user_id = ?
        `,
        [
            id,
            userId
        ]
    );

    return result;
};


// lấy cv id
export const getCVById = async (
    id,
    userId
) => {

    // cv
    const [cvRows] = await db.query(
        `
        SELECT
            id,
            user_id,
            title,
            full_name,
            position,
            summary,
            skills,
            soft_skills,
            email,
            phone,
            address,
            primary_color,
            template,
            created_at,
            updated_at
        FROM cvs
        WHERE id = ?
        AND user_id = ?
        LIMIT 1
        `,
        [
            id,
            userId
        ]
    );

    if (cvRows.length === 0) {
        return null;
    }

    const cv = cvRows[0];

    // experience
    const [experiences] = await db.query(
        `
        SELECT
            id,
            position,
            time_range,
            company,
            description
        FROM cv_experiences
        WHERE cv_id = ?
        ORDER BY id ASC
        `,
        [id]
    );

    // education
    const [educations] = await db.query(
        `
        SELECT
            id,
            degree,
            time_range,
            school
        FROM cv_educations
        WHERE cv_id = ?
        ORDER BY id ASC
        `,
        [id]
    );

    // language
    const [languages] = await db.query(
        `
        SELECT
            id,
            language_name AS name,
            level
        FROM cv_languages
        WHERE cv_id = ?
        ORDER BY id ASC
        `,
        [id]
    );

    return {
        ...cv,
        experiences,
        educations,
        languages
    };
};


// update cv
export const updateCV = async (
    id,
    userId,
    data
) => {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const [result] = await connection.execute(
            `
            UPDATE cvs
            SET
                title = ?,
                full_name = ?,
                position = ?,
                summary = ?,
                skills = ?,
                soft_skills = ?,
                email = ?,
                phone = ?,
                address = ?,
                primary_color = ?,
                template = ?,
                updated_at = NOW()
            WHERE id = ?
            AND user_id = ?
            `,
            [
                data.title ?? null,
                data.full_name ?? null,
                data.position ?? null,
                data.summary ?? null,
                data.skills ?? null,
                data.soft_skills ?? null,
                data.email ?? null,
                data.phone ?? null,
                data.address ?? null,
                data.primary_color ?? "#2F7867",
                data.template ?? "layout1",
                id,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            throw new Error(
                "CV không tồn tại hoặc bạn không có quyền cập nhật"
            );
        }


        await connection.execute(
            `
            DELETE FROM cv_experiences
            WHERE cv_id = ?
            `,
            [id]
        );

        await connection.execute(
            `
            DELETE FROM cv_educations
            WHERE cv_id = ?
            `,
            [id]
        );

        await connection.execute(
            `
            DELETE FROM cv_languages
            WHERE cv_id = ?
            `,
            [id]
        );


        for (
            const experience
            of data.experiences || []
        ) {

            await connection.execute(
                `
                INSERT INTO cv_experiences
                (
                    cv_id,
                    position,
                    time_range,
                    company,
                    description
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    id,
                    experience.position ?? null,
                    experience.time_range ?? null,
                    experience.company ?? null,
                    experience.description ?? null
                ]
            );
        }

        for (
            const education
            of data.educations || []
        ) {

            await connection.execute(
                `
                INSERT INTO cv_educations
                (
                    cv_id,
                    degree,
                    time_range,
                    school
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    id,
                    education.degree ?? null,
                    education.time_range ?? null,
                    education.school ?? null
                ]
            );
        }

        for (
            const language
            of data.languages || []
        ) {

            await connection.execute(
                `
                INSERT INTO cv_languages
                (
                    cv_id,
                    language_name,
                    level
                )
                VALUES (?, ?, ?)
                `,
                [
                    id,
                    language.name ?? null,
                    language.level ?? null
                ]
            );
        }

        await connection.commit();

        return true;

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }
};