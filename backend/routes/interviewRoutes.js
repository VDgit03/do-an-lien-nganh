import express from "express";

import {authMiddleware}
    from "../middlewares/authMiddleware.js";

import {
    getInterviews,
    getInterviewById,
    createInterview,
    updateInterview,
    deleteInterview
} from "../controllers/interview/interviewController.js";

const router = express.Router();

router.get("/", authMiddleware, getInterviews);

router.get("/:id", authMiddleware, getInterviewById);

router.post("/", authMiddleware, createInterview);

router.put("/:id", authMiddleware, updateInterview);

router.delete("/:id", authMiddleware, deleteInterview);


export default router;