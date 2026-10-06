import db from "../../config/db.js";

import {
    createCV,
    createProfessionalSkill,
    createExperience,
    createEducation,
    createProject,
    createLanguage,
    createActivity,
    getCVsByUserId,
    getCVById,
    updateCV as updateCVModel,
    deleteCVById
} from "../../models/cvModel.js";

const cleanString = (value) => {

    if (value === undefined || value === null) {
        return null;
    }

    const result = String(value).trim();

    return result === "" ? null : result;
};

const validateLength = (
    value,
    max,
    fieldName
) => {

    if (
        value !== null &&
        value !== undefined &&
        value.length > max
    ) {
        throw new Error(
            `${fieldName} không được vượt quá ${max} ký tự`
        );
    }
};

const validateMainCV = (data) => {

    const title =
        cleanString(data.title);

    const fullName =
        cleanString(data.full_name);

    if (!title) {
        throw new Error(
            "Vui lòng nhập tên CV"
        );
    }

    if (!fullName) {
        throw new Error(
            "Vui lòng nhập họ và tên"
        );
    }


    const position =
        cleanString(data.position);

    const summary =
        cleanString(data.summary);

    const email =
        cleanString(data.email);

    const phone =
        cleanString(data.phone);

    const address =
        cleanString(data.address);

    const gitLink =
        cleanString(data.git_link);

    
    const softSkills =
        cleanString(data.soft_skills);


    const primaryColor =
        cleanString(data.primary_color)
        || "#2F7867";

    const template =
        cleanString(data.template)
        || "layout1";
        
    validateLength(
        title,
        150,
        "Tên CV"
    );

    validateLength(
        fullName,
        150,
        "Họ và tên"
    );

    validateLength(
        position,
        150,
        "Vị trí"
    );

    validateLength(
        summary,
        5000,
        "Tóm tắt bản thân"
    );

    validateLength(
        email,
        255,
        "Email"
    );

    validateLength(
        phone,
        30,
        "Số điện thoại"
    );

    validateLength(
        address,
        255,
        "Địa chỉ"
    );

    validateLength(
        gitLink,
        500,
        "GitHub"
    );

    validateLength(
        softSkills,
        2000,
        "Kỹ năng mềm"
    );

    if (email) {

        const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {

            throw new Error(
                "Email không hợp lệ"
            );
        }
    }


    return {

        title,

        full_name:
            fullName,

        position,

        summary,

        email,

        phone,

        address,

        git_link:
            gitLink,

        soft_skills:
            softSkills,

        primary_color:
            primaryColor,

        template
    };
};

const validateProfessionalSkills = (
    skills
) => {

    if (
        skills === undefined ||
        skills === null
    ) {
        return [];
    }

    if (!Array.isArray(skills)) {

        throw new Error(
            "Danh sách kỹ năng chuyên môn không hợp lệ"
        );
    }


    return skills
        .map((item) => {

            if (
                !item ||
                typeof item !== "object"
            ) {
                return null;
            }


            const skill = {

                position:
                    cleanString(
                        item.position
                    ),

                technologies:
                    cleanString(
                        item.technologies
                    )
            };


            const hasData =
                skill.position ||
                skill.technologies;


            if (!hasData) {
                return null;
            }


            validateLength(
                skill.position,
                150,
                "Tên nhóm kỹ năng chuyên môn"
            );

            validateLength(
                skill.technologies,
                2000,
                "Công nghệ"
            );


            return skill;

        })
        .filter(Boolean);
};

const validateExperiences = (
    experiences
) => {

    if (
        experiences === undefined ||
        experiences === null
    ) {
        return [];
    }

    if (!Array.isArray(experiences)) {

        throw new Error(
            "Danh sách kinh nghiệm không hợp lệ"
        );
    }


    return experiences
        .map((item) => {

            if (
                !item ||
                typeof item !== "object"
            ) {
                return null;
            }


            const experience = {

                position:
                    cleanString(
                        item.position
                    ),

                time_range:
                    cleanString(
                        item.time_range
                    ),

                company:
                    cleanString(
                        item.company
                    ),

                description:
                    cleanString(
                        item.description
                    )
            };


            const hasData =
                experience.position ||
                experience.time_range ||
                experience.company ||
                experience.description;


            if (!hasData) {
                return null;
            }


            validateLength(
                experience.position,
                150,
                "Vị trí kinh nghiệm"
            );

            validateLength(
                experience.time_range,
                100,
                "Thời gian kinh nghiệm"
            );

            validateLength(
                experience.company,
                200,
                "Tên công ty"
            );

            validateLength(
                experience.description,
                3000,
                "Mô tả kinh nghiệm"
            );


            return experience;

        })
        .filter(Boolean);
};

const validateEducations = (
    educations
) => {

    if (
        educations === undefined ||
        educations === null
    ) {
        return [];
    }

    if (!Array.isArray(educations)) {

        throw new Error(
            "Danh sách học vấn không hợp lệ"
        );
    }


    return educations
        .map((item) => {

            if (
                !item ||
                typeof item !== "object"
            ) {
                return null;
            }


            const education = {

                degree:
                    cleanString(
                        item.degree
                    ),

                time_range:
                    cleanString(
                        item.time_range
                    ),

                school:
                    cleanString(
                        item.school
                    ),

                gpa:
                    item.gpa === undefined ||
                    item.gpa === null ||
                    String(item.gpa).trim() === ""
                        ? null
                        : Number(item.gpa)
            };


            const hasData =
                education.degree ||
                education.time_range ||
                education.school ||
                education.gpa !== null;


            if (!hasData) {
                return null;
            }


            validateLength(
                education.degree,
                200,
                "Bằng cấp"
            );

            validateLength(
                education.time_range,
                100,
                "Thời gian học"
            );

            validateLength(
                education.school,
                200,
                "Trường học"
            );


            // ==========================================
            // GPA
            // ==========================================

            if (
                education.gpa !== null &&
                (
                    Number.isNaN(education.gpa) ||
                    education.gpa < 0 ||
                    education.gpa > 4
                )
            ) {

                throw new Error(
                    "GPA phải nằm trong khoảng từ 0 đến 4"
                );
            }


            return education;

        })
        .filter(Boolean);
};

const validateProjects = (
    projects
) => {

    if (
        projects === undefined ||
        projects === null
    ) {
        return [];
    }

    if (!Array.isArray(projects)) {

        throw new Error(
            "Danh sách dự án không hợp lệ"
        );
    }


    return projects
        .map((item) => {

            if (
                !item ||
                typeof item !== "object"
            ) {
                return null;
            }


            const project = {

                project_name:
                    cleanString(
                        item.project_name ??
                        item.name
                    ),

                technologies:
                    cleanString(
                        item.technologies
                    ),

                description:
                    cleanString(
                        item.description
                    )
            };


            const hasData =
                project.project_name ||
                project.technologies ||
                project.description;


            if (!hasData) {
                return null;
            }


            validateLength(
                project.project_name,
                200,
                "Tên dự án"
            );

            validateLength(
                project.technologies,
                2000,
                "Công nghệ dự án"
            );

            validateLength(
                project.description,
                3000,
                "Mô tả dự án"
            );


            return project;

        })
        .filter(Boolean);
};

const validateLanguages = (
    languages
) => {

    if (
        languages === undefined ||
        languages === null
    ) {
        return [];
    }

    if (!Array.isArray(languages)) {

        throw new Error(
            "Danh sách ngôn ngữ không hợp lệ"
        );
    }


    return languages
        .map((item) => {

            if (
                !item ||
                typeof item !== "object"
            ) {
                return null;
            }


            const language = {

                name:
                    cleanString(
                        item.name ??
                        item.language_name ??
                        item.language
                    ),

                level:
                    cleanString(
                        item.level ??
                        item.proficiency
                    )
            };


            const hasData =
                language.name ||
                language.level;


            if (!hasData) {
                return null;
            }


            validateLength(
                language.name,
                100,
                "Tên ngôn ngữ"
            );

            validateLength(
                language.level,
                100,
                "Trình độ ngôn ngữ"
            );


            return language;

        })
        .filter(Boolean);
};

const validateActivities = (
    activities
) => {

    if (
        activities === undefined ||
        activities === null
    ) {
        return [];
    }

    if (!Array.isArray(activities)) {

        throw new Error(
            "Danh sách hoạt động không hợp lệ"
        );
    }


    return activities
        .map((item) => {

            if (
                !item ||
                typeof item !== "object"
            ) {
                return null;
            }


            const activity = {

                activity_name:
                    cleanString(
                        item.activity_name ??
                        item.name
                    ),

                activity_year:
                    cleanString(
                        item.activity_year ??
                        item.year
                    ),

                description:
                    cleanString(
                        item.description
                    )
            };


            const hasData =
                activity.activity_name ||
                activity.activity_year ||
                activity.description;


            if (!hasData) {
                return null;
            }


            validateLength(
                activity.activity_name,
                200,
                "Tên hoạt động"
            );

            validateLength(
                activity.activity_year,
                100,
                "Thời gian hoạt động"
            );

            validateLength(
                activity.description,
                3000,
                "Mô tả hoạt động"
            );


            return activity;

        })
        .filter(Boolean);
};

export const createCVService = async (
    userId,
    data
) => {

    if (!userId) {

        throw new Error(
            "Không xác định được người dùng"
        );
    }


    if (
        !data ||
        typeof data !== "object"
    ) {

        throw new Error(
            "Dữ liệu CV không hợp lệ"
        );
    }

    const mainCV =
        validateMainCV(data);

    const professionalSkills =
        validateProfessionalSkills(
            data.professional_skills
        );

    const experiences =
        validateExperiences(
            data.experiences
        );

    const educations =
        validateEducations(
            data.educations
        );

    const projects =
        validateProjects(
            data.projects
        );

    const languages =
        validateLanguages(
            data.languages
        );

    const activities =
        validateActivities(
            data.activities
        );

    const [users] =
        await db.execute(
            `
            SELECT id
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [userId]
        );


    if (users.length === 0) {

        throw new Error(
            "Tài khoản không tồn tại. Vui lòng đăng nhập lại."
        );
    }

    const connection =
        await db.getConnection();


    try {

        await connection.beginTransaction();

        const cvId =
            await createCV(
                connection,
                {
                    user_id: userId,
                    ...mainCV
                }
            );

        for (
            const skill
            of professionalSkills
        ) {

            await createProfessionalSkill(
                connection,
                cvId,
                skill
            );
        }

        for (
            const experience
            of experiences
        ) {

            await createExperience(
                connection,
                cvId,
                experience
            );
        }

        for (
            const education
            of educations
        ) {

            await createEducation(
                connection,
                cvId,
                education
            );
        }

        for (
            const project
            of projects
        ) {

            await createProject(
                connection,
                cvId,
                project
            );
        }

        for (
            const language
            of languages
        ) {

            await createLanguage(
                connection,
                cvId,
                language
            );
        }

        for (
            const activity
            of activities
        ) {

            await createActivity(
                connection,
                cvId,
                activity
            );
        }


        await connection.commit();


        return {

            id: cvId,

            ...mainCV,

            professional_skills:
                professionalSkills,

            experiences,

            educations,

            projects,

            languages,

            activities
        };


    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();
    }
};

export const getMyCVsService = async (
    userId
) => {

    if (!userId) {

        throw new Error(
            "Không xác định được người dùng"
        );
    }


    return await getCVsByUserId(
        userId
    );
};

export const getCVByIdService = async (
    id,
    userId
) => {

    if (!id) {

        throw new Error(
            "Thiếu ID CV"
        );
    }


    if (!userId) {

        throw new Error(
            "Không xác định được người dùng"
        );
    }


    const cv =
        await getCVById(
            id,
            userId
        );


    if (!cv) {

        throw new Error(
            "CV không tồn tại hoặc bạn không có quyền truy cập"
        );
    }


    return cv;
};

export const updateCVService = async (
    id,
    userId,
    data
) => {

    if (!id) {

        throw new Error(
            "Thiếu ID CV"
        );
    }


    if (!userId) {

        throw new Error(
            "Không xác định được người dùng"
        );
    }


    if (
        !data ||
        typeof data !== "object"
    ) {

        throw new Error(
            "Dữ liệu CV không hợp lệ"
        );
    }

    const mainCV =
        validateMainCV(data);

    const professionalSkills =
        validateProfessionalSkills(
            data.professional_skills
        );

    const experiences =
        validateExperiences(
            data.experiences
        );

    const educations =
        validateEducations(
            data.educations
        );

    const projects =
        validateProjects(
            data.projects
        );

    const languages =
        validateLanguages(
            data.languages
        );

    const activities =
        validateActivities(
            data.activities
        );

    const cv =
        await getCVById(
            id,
            userId
        );


    if (!cv) {

        throw new Error(
            "CV không tồn tại hoặc bạn không có quyền cập nhật"
        );
    }

    await updateCVModel(
        id,
        userId,
        {

            ...mainCV,

            professional_skills:
                professionalSkills,

            experiences,

            educations,

            projects,

            languages,

            activities
        }
    );

    return await getCVById(
        id,
        userId
    );
};

export const deleteCVService = async (
    id,
    userId
) => {

    if (!id) {

        throw new Error(
            "Thiếu ID CV"
        );
    }


    if (!userId) {

        throw new Error(
            "Không xác định được người dùng"
        );
    }


    const result =
        await deleteCVById(
            id,
            userId
        );


    if (
        result.affectedRows === 0
    ) {

        throw new Error(
            "CV không tồn tại hoặc bạn không có quyền xóa"
        );
    }


    return {

        message:
            "Xóa CV thành công"
    };
};
