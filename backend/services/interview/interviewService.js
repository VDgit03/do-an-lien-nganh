import {
    getInterviewsByUserId,
    getInterviewById as getInterviewByIdModel,
    createInterview as createInterviewModel,
    updateInterview as updateInterviewModel,
    deleteInterview as deleteInterviewModel
} from "../../models/interviewModel.js";

const cleanString = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const result = String(value).trim();

    return result === "" ? null : result;
};

const isValidDate = (value) => {
    if (!value) {
        return false;
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const isValidTime = (value) => {
    if (!value) {
        return false;
    }

    return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
};

const isValidInterviewType = (value) => {
    return value === "online" || value === "offline";
};


export const getInterviews = async (userId) => {
    if (!userId) {
        throw new Error("Không xác định được người dùng.");
    }

    return await getInterviewsByUserId(userId);
};

export const getInterviewById = async (id, userId) => {
    if (!id) {
        throw new Error("ID lịch phỏng vấn không hợp lệ.");
    }

    const interview = await getInterviewByIdModel(id, userId);

    if (!interview) {
        const error = new Error("Không tìm thấy lịch phỏng vấn.");
        error.status = 404;
        throw error;
    }

    return interview;
};


export const createInterview = async (userId, data) => {

    if (!userId) {
        throw new Error("Không xác định được người dùng.");
    }

    const company = cleanString(data.company);
    const position = cleanString(data.position);
    const interviewDate = cleanString(data.interview_date);
    const startTime = cleanString(data.start_time);
    const interviewType = cleanString(data.interview_type);

    if (!company) {
        throw new Error("Vui lòng nhập tên công ty.");
    }

    if (!interviewDate) {
        throw new Error("Vui lòng chọn ngày phỏng vấn.");
    }

    if (!startTime) {
        throw new Error("Vui lòng chọn giờ phỏng vấn.");
    }

    if (!interviewType) {
        throw new Error("Vui lòng chọn hình thức phỏng vấn.");
    }

    if (!isValidDate(interviewDate)) {
        throw new Error("Ngày phỏng vấn không hợp lệ.");
    }

    if (!isValidTime(startTime)) {
        throw new Error("Giờ phỏng vấn không hợp lệ.");
    }

    if (!isValidInterviewType(interviewType)) {
        throw new Error(
            "Hình thức phỏng vấn phải là online hoặc offline."
        );
    }

    const cvId =
        data.cv_id === undefined ||
        data.cv_id === null ||
        data.cv_id === ""
            ? null
            : Number(data.cv_id);

    const reminderEnabled =
        data.reminder_enabled === true ||
        data.reminder_enabled === 1 ||
        data.reminder_enabled === "1";

    let reminderMinutes =
        Number(data.reminder_minutes);

    if (
        !Number.isInteger(reminderMinutes) ||
        reminderMinutes < 0
    ) {
        reminderMinutes = 300;
    }

    let interviewLink = null;
    let location = null;

    if (interviewType === "online") {
        interviewLink = cleanString(data.interview_link);
    }

    if (interviewType === "offline") {
        location = cleanString(data.location);
    }

    const note = cleanString(data.note);

    const interviewId = await createInterviewModel({
        user_id: userId,
        cv_id: cvId,
        company,
        position,
        interview_date: interviewDate,
        start_time: startTime,
        interview_type: interviewType,
        interview_link: interviewLink,
        location,
        note,
        reminder_enabled: reminderEnabled,
        reminder_minutes: reminderMinutes
    });

    return await getInterviewById(
        interviewId,
        userId
    );
};

export const updateInterview = async (
    id,
    userId,
    data
) => {

    if (!id) {
        throw new Error("ID lịch phỏng vấn không hợp lệ.");
    }

    const company = cleanString(data.company);
    const position = cleanString(data.position);
    const interviewDate = cleanString(data.interview_date);
    const startTime = cleanString(data.start_time);
    const interviewType = cleanString(data.interview_type);

    if (!company) {
        throw new Error("Vui lòng nhập tên công ty.");
    }

    if (!interviewDate) {
        throw new Error("Vui lòng chọn ngày phỏng vấn.");
    }

    if (!startTime) {
        throw new Error("Vui lòng chọn giờ phỏng vấn.");
    }

    if (!interviewType) {
        throw new Error("Vui lòng chọn hình thức phỏng vấn.");
    }

    if (!isValidDate(interviewDate)) {
        throw new Error("Ngày phỏng vấn không hợp lệ.");
    }

    if (!isValidTime(startTime)) {
        throw new Error("Giờ phỏng vấn không hợp lệ.");
    }

    if (!isValidInterviewType(interviewType)) {
        throw new Error(
            "Hình thức phỏng vấn phải là online hoặc offline."
        );
    }

    const cvId =
        data.cv_id === undefined ||
        data.cv_id === null ||
        data.cv_id === ""
            ? null
            : Number(data.cv_id);

    const reminderEnabled =
        data.reminder_enabled === true ||
        data.reminder_enabled === 1 ||
        data.reminder_enabled === "1";

    let reminderMinutes =
        Number(data.reminder_minutes);

    if (
        !Number.isInteger(reminderMinutes) ||
        reminderMinutes < 0
    ) {
        reminderMinutes = 300;
    }

    let interviewLink = null;
    let location = null;

    if (interviewType === "online") {
        interviewLink = cleanString(data.interview_link);
    }

    if (interviewType === "offline") {
        location = cleanString(data.location);
    }

    const note = cleanString(data.note);

    let status = cleanString(data.status);

    if (
        status !== "scheduled" &&
        status !== "completed" &&
        status !== "cancelled"
    ) {
        status = "scheduled";
    }

    await getInterviewById(id, userId);
    
    const result = await updateInterviewModel(
        id,
        userId,
        {
            cv_id: cvId,
            company,
            position,
            interview_date: interviewDate,
            start_time: startTime,
            interview_type: interviewType,
            interview_link: interviewLink,
            location,
            note,
            reminder_enabled: reminderEnabled,
            reminder_minutes: reminderMinutes,
            status
        }
    );

    if (result.affectedRows === 0) {
        const error = new Error(
            "Không thể cập nhật lịch phỏng vấn."
        );

        error.status = 400;

        throw error;
    }

    return await getInterviewById(
        id,
        userId
    );
};

export const deleteInterview = async (
    id,
    userId
) => {

    if (!id) {
        throw new Error("ID lịch phỏng vấn không hợp lệ.");
    }

    // CHECK EXIST
    await getInterviewById(
        id,
        userId
    );

    const result =
        await deleteInterviewModel(
            id,
            userId
        );

    if (result.affectedRows === 0) {
        const error = new Error(
            "Không thể xóa lịch phỏng vấn."
        );

        error.status = 400;

        throw error;
    }

    return true;
};