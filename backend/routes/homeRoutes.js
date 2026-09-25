import express from "express";
import {getHomeSummaryController} from "../controllers/homeController.js";

const router = express.Router();

router.get("/summary", getHomeSummaryController);


export default router;