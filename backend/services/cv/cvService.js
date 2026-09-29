import db from "../../config/db.js";

import {
    createCV,
    createExperience,
    createEducation,
    createLanguage,
    getCVsByUserId,
    getCVById,
    updateCV as updateCVModel,
    deleteCVById
} from "../../models/cvModel.js";

// clean chuỗi
const cleanString = (value) => {

    if (value === undefined || value === null) {
        return null;
    }

    const result = String(value).trim();

    return result === "" ? null : result;
};


// validate độ dài
const validateLength = (
    value,
    max,
    fieldName
) => {

    if (value !== null && value.length > max) {
        throw new Error(
            `${fieldName} không được vượt quá ${max} ký tự`
        );
    }
};


// validate cv
const validateMainCV = (data) => {

    const title = cleanString(data.title);

    const fullName = cleanString(data.full_name);

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

    const position = cleanString(data.position);

    const summary = cleanString(data.summary);

    const skills = cleanString(data.skills);

    const softSkills = cleanString(data.soft_skills);

    const email = cleanString(data.email);

    const phone = cleanString(data.phone);

    const address = cleanString(data.address);


    const primaryColor = cleanString(data.primary_color) || "#2F7867";


    const template = cleanString(data.template) || "layout1";

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
        skills,
        1000,
        "Kỹ năng chuyên môn"
    );

    validateLength(
        softSkills,
        1000,
        "Kỹ năng mềm"
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

    if (email) {

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            throw new Error(
                "Email không hợp lệ"
            );
        }
    }

    return {

        title,
        full_name: fullName,
        position,
        summary,
        skills,
        soft_skills: softSkills,
        email,
        phone,
        address,
        primary_color: primaryColor,
        template

    };
};


// validate experience
const validateExperiences = (
    experiences
) => {

    if (experiences === undefined || experiences === null) {
        return [];
    }

    if (!Array.isArray(experiences)) {
        throw new Error(
            "Danh sách kinh nghiệm không hợp lệ"
        );
    }

    return experiences
        .map((item) => {

            if (!item || typeof item !== "object") {
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


// validate education
const validateEducations = (
    educations
) => {

    if ( educations === undefined || educations === null) {
        return [];
    }

    if (!Array.isArray(educations)) {
        throw new Error(
            "Danh sách học vấn không hợp lệ"
        );
    }


    return educations
        .map((item) => {

            if (!item || typeof item !== "object") {
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
                    )

            };


            const hasData =
                education.degree ||
                education.time_range ||
                education.school;


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


            return education;

        })
        .filter(Boolean);
};


// validate language
const validateLanguages = (
    languages
) => {

    if (languages === undefined || languages === null) {
        return [];
    }

    if (!Array.isArray(languages)) {
        throw new Error(
            "Danh sách ngôn ngữ không hợp lệ"
        );
    }


    return languages
        .map((item) => {

            if (!item || typeof item !== "object") {
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


// tạo cv
export const createCVService = async (
    userId,
    data
) => {

    if (!userId) {
        throw new Error(
            "Không xác định được người dùng"
        );
    }


    if (!data || typeof data !== "object") {
        throw new Error(
            "Dữ liệu CV không hợp lệ"
        );
    }

    const mainCV = validateMainCV(data);

    const experiences = validateExperiences(data.experiences);

    const educations = validateEducations(data.educations);

    const languages = validateLanguages(data.languages);


   // ktra user
    const [users] = await db.execute(
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

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const cvId = await createCV(
            connection,
            {
                user_id: userId,
                ...mainCV
            }
        );

        for (const experience of experiences) {
            await createExperience(
                connection,
                cvId,
                experience
            );
        }

        for (const education of educations) {
            await createEducation(
                connection,
                cvId,
                education
            );
        }

        for (const language of languages) {
            await createLanguage(
                connection,
                cvId,
                language
            );
        }

        await connection.commit();

        return {

            id: cvId,

            ...mainCV,

            experiences,

            educations,

            languages

        };

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }
};


// lấy cv
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


// lấy cv id
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


    const cv = await getCVById(
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


// update cv
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


    if (!data || typeof data !== "object") {
        throw new Error(
            "Dữ liệu CV không hợp lệ"
        );
    }

    //validate
    const mainCV = validateMainCV(data);

    const experiences = validateExperiences(data.experiences);

    const educations = validateEducations(data.educations);

    const languages = validateLanguages(data.languages);

    const cv = await getCVById(
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
            experiences,
            educations,
            languages
        }
    );

    return await getCVById(
        id,
        userId
    );
};


// xóa cv
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


    const result = await deleteCVById(
        id,
        userId
    );

    if (result.affectedRows === 0) {
        throw new Error(
            "CV không tồn tại hoặc bạn không có quyền xóa"
        );
    }

    return {
        message: "Xóa CV thành công"
    };
};