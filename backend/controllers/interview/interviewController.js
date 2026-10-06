import {
    getInterviews as getInterviewsService,
    getInterviewById as getInterviewByIdService,
    createInterview as createInterviewService,
    updateInterview as updateInterviewService,
    deleteInterview as deleteInterviewService
} from "../../services/interview/interviewService.js";


// ======================================================
// GET ALL
// GET /api/interviews
// ======================================================

export const getInterviews = async (req, res) => {

    try {

        const userId = req.user.id;

        const interviews =
            await getInterviewsService(userId);

        return res.status(200).json({
            interviews
        });

    } catch (error) {

        console.error(
            "GET INTERVIEWS ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            message:
                error.message ||
                "Không thể lấy danh sách lịch phỏng vấn."
        });
    }
};


// ======================================================
// GET ONE
// GET /api/interviews/:id
// ======================================================

export const getInterviewById = async (
    req,
    res
) => {

    try {

        const userId = req.user.id;

        const { id } = req.params;

        const interview =
            await getInterviewByIdService(
                id,
                userId
            );

        return res.status(200).json({
            interview
        });

    } catch (error) {

        console.error(
            "GET INTERVIEW ERROR:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            message:
                error.message ||
                "Không thể lấy lịch phỏng vấn."
        });
    }
};


// ======================================================
// CREATE
// POST /api/interviews
// ======================================================

export const createInterview = async (
    req,
    res
) => {

    try {

        const userId = req.user.id;

        const interview =
            await createInterviewService(
                userId,
                req.body
            );

        return res.status(201).json({
            message:
                "Tạo lịch phỏng vấn thành công.",
            interview
        });

    } catch (error) {

        console.error(
            "CREATE INTERVIEW ERROR:",
            error
        );

        return res.status(
            error.status || 400
        ).json({
            message:
                error.message ||
                "Không thể tạo lịch phỏng vấn."
        });
    }
};


// ======================================================
// UPDATE
// PUT /api/interviews/:id
// ======================================================

export const updateInterview = async (
    req,
    res
) => {

    try {

        const userId = req.user.id;

        const { id } = req.params;

        const interview =
            await updateInterviewService(
                id,
                userId,
                req.body
            );

        return res.status(200).json({
            message:
                "Cập nhật lịch phỏng vấn thành công.",
            interview
        });

    } catch (error) {

        console.error(
            "UPDATE INTERVIEW ERROR:",
            error
        );

        return res.status(
            error.status || 400
        ).json({
            message:
                error.message ||
                "Không thể cập nhật lịch phỏng vấn."
        });
    }
};


// ======================================================
// DELETE
// DELETE /api/interviews/:id
// ======================================================

export const deleteInterview = async (
    req,
    res
) => {

    try {

        const userId = req.user.id;

        const { id } = req.params;

        await deleteInterviewService(
            id,
            userId
        );

        return res.status(200).json({
            message:
                "Xóa lịch phỏng vấn thành công."
        });

    } catch (error) {

        console.error(
            "DELETE INTERVIEW ERROR:",
            error
        );

        return res.status(
            error.status || 400
        ).json({
            message:
                error.message ||
                "Không thể xóa lịch phỏng vấn."
        });
    }
};