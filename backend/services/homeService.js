import {countCVs, countInterviews} from "../models/homeModel.js";


export const getDashboardSummary = async (userId) => {

    const cvCount = await countCVs(userId);

    const interviewCount = await countInterviews(userId);

    return {
        cvCount,
        interviewCount
    };
};