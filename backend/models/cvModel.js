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
            email,
            phone,
            address,
            git_link,
            soft_skills,
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
            data.email ?? null,
            data.phone ?? null,
            data.address ?? null,
            data.git_link ?? null,
            data.soft_skills ?? null,
            data.primary_color ?? "#2F7867",
            data.template ?? "layout1"
        ]
    );

    return result.insertId;
};


// lấy cv theo id

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
            email,
            phone,
            address,
            git_link,
            soft_skills,
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

export const createProfessionalSkill = async (
    connection,
    cvId,
    skill
) => {

    await connection.execute(
        `
        INSERT INTO cv_professional_skills
        (
            cv_id,
            position,
            technologies
        )
        VALUES (?, ?, ?)
        `,
        [
            cvId,
            skill.position ?? null,
            skill.technologies ?? null
        ]
    );
};

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
            school,
            gpa
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            cvId,
            education.degree ?? null,
            education.time_range ?? null,
            education.school ?? null,
            education.gpa ?? null
        ]
    );
};

export const createProject = async (
    connection,
    cvId,
    project
) => {

    await connection.execute(
        `
        INSERT INTO cv_projects
        (
            cv_id,
            project_name,
            technologies,
            description
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            cvId,
            project.project_name ?? null,
            project.technologies ?? null,
            project.description ?? null
        ]
    );
};

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
            language.name ??
            language.language_name ??
            null,

            language.level ?? null
        ]
    );
};

export const createActivity = async (
    connection,
    cvId,
    activity
) => {

    await connection.execute(
        `
        INSERT INTO cv_activities
        (
            cv_id,
            activity_name,
            activity_year,
            description
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            cvId,
            activity.activity_name ??
            activity.name ??
            null,

            activity.activity_year ??
            activity.year ??
            null,

            activity.description ?? null
        ]
    );
};

export const getCVById = async (
    id,
    userId
) => {

    // --------------------------------------------------
    // CV
    // --------------------------------------------------

    const [cvRows] = await db.query(
        `
        SELECT
            id,
            user_id,
            title,
            full_name,
            position,
            summary,
            email,
            phone,
            address,
            git_link,
            soft_skills,
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

    const [professionalSkills] =
        await db.query(
            `
            SELECT
                id,
                position,
                technologies
            FROM cv_professional_skills
            WHERE cv_id = ?
            ORDER BY id ASC
            `,
            [id]
        );

    const [experiences] =
        await db.query(
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

    const [educations] =
        await db.query(
            `
            SELECT
                id,
                degree,
                time_range,
                school,
                gpa
            FROM cv_educations
            WHERE cv_id = ?
            ORDER BY id ASC
            `,
            [id]
        );

    const [projects] =
        await db.query(
            `
            SELECT
                id,
                project_name,
                technologies,
                description
            FROM cv_projects
            WHERE cv_id = ?
            ORDER BY id ASC
            `,
            [id]
        );

    const [languages] =
        await db.query(
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

    const [activities] =
        await db.query(
            `
            SELECT
                id,
                activity_name,
                activity_year,
                description
            FROM cv_activities
            WHERE cv_id = ?
            ORDER BY id ASC
            `,
            [id]
        );

    return {

        ...cv,

        professional_skills:
            professionalSkills,

        experiences:
            experiences,

        educations:
            educations,

        projects:
            projects,

        languages:
            languages,

        activities:
            activities

    };
};

export const updateCV = async (
    id,
    userId,
    data
) => {

    const connection =
        await db.getConnection();


    try {

        await connection.beginTransaction();

        const [result] =
            await connection.execute(
                `
                UPDATE cvs
                SET
                    title = ?,
                    full_name = ?,
                    position = ?,
                    summary = ?,
                    email = ?,
                    phone = ?,
                    address = ?,
                    git_link = ?,
                    soft_skills = ?,
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
                    data.email ?? null,
                    data.phone ?? null,
                    data.address ?? null,
                    data.git_link ?? null,
                    data.soft_skills ?? null,
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
            DELETE FROM cv_professional_skills
            WHERE cv_id = ?
            `,
            [id]
        );

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
            DELETE FROM cv_projects
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

        await connection.execute(
            `
            DELETE FROM cv_activities
            WHERE cv_id = ?
            `,
            [id]
        );

        for (
            const skill
            of data.professional_skills || []
        ) {

            await connection.execute(
                `
                INSERT INTO cv_professional_skills
                (
                    cv_id,
                    position,
                    technologies
                )
                VALUES (?, ?, ?)
                `,
                [
                    id,
                    skill.position ?? null,
                    skill.technologies ?? null
                ]
            );
        }

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
                    school,
                    gpa
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    id,
                    education.degree ?? null,
                    education.time_range ?? null,
                    education.school ?? null,
                    education.gpa === ""
                        ? null
                        : education.gpa ?? null
                ]
            );
        }

        for (
            const project
            of data.projects || []
        ) {

            await connection.execute(
                `
                INSERT INTO cv_projects
                (
                    cv_id,
                    project_name,
                    technologies,
                    description
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    id,
                    project.project_name ?? null,
                    project.technologies ?? null,
                    project.description ?? null
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
                    language.name ??
                    language.language_name ??
                    null,

                    language.level ?? null
                ]
            );
        }

        for (
            const activity
            of data.activities || []
        ) {

            await connection.execute(
                `
                INSERT INTO cv_activities
                (
                    cv_id,
                    activity_name,
                    activity_year,
                    description
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    id,
                    activity.activity_name ??
                    activity.name ??
                    null,

                    activity.activity_year ??
                    activity.year ??
                    null,

                    activity.description ?? null
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

export const deleteCVById = async (
    id,
    userId
) => {

    const [result] =
        await db.query(
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
