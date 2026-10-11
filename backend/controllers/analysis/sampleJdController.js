import { getSampleJd } from "../../services/analysis/sampleJdService.js";
import { AnalysisError } from "../../services/analysis/analysisService.js";
 
// GET /api/analysis/sample-jd?role=network&level=intern
export const sampleJd = async (req, res) => {
    try {
        const role = String(req.query.role ?? "").trim().toLowerCase();
        const level = String(req.query.level ?? "fresher").trim().toLowerCase();
        const data = await getSampleJd(role, level);
 
        return res.status(200).json({ success: true, data });
    } catch (error) {
        const status = error instanceof AnalysisError ? error.statusCode : 500;
 
        return res.status(status).json({
            success: false,
            message:
                error instanceof AnalysisError
                    ? error.message
                    : "Không lấy được JD mẫu"
        });
    }
};
 