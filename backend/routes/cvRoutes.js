import express from "express";

import {
    createCV,
    getMyCVs,
    getCVById,
    updateCV,
    deleteCV
} from "../controllers/cv/cvController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";


const router = express.Router();


// tạo cv
router.post("/", authMiddleware, createCV);

// lấy cv 
router.get("/my-cvs", authMiddleware, getMyCVs);

// lấy cv id
router.get("/:id", authMiddleware, getCVById);

// update cv

router.put("/:id", authMiddleware, updateCV);

// xóa cv
router.delete("/:id", authMiddleware, deleteCV);

export default router;