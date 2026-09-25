import {getDashboardSummary} from "../services/homeService.js";

export const getHomeSummaryController =
async (req, res) => {
    try {
        const userId = req.userId;
        const data = await getDashboardSummary(userId);
        
        res.json(data);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Không thể lấy thông tin thống kê"
        });
    }
};