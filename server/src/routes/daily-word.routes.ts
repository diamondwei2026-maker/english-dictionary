import { Router } from "express";
import type { Router as RouterType } from "express";
import { optionalAuth, authMiddleware, adminMiddleware } from "../middleware";
import {
  getDailyWord,
  pinDailyWord,
} from "../controllers/daily-word.controller.js";

const router = Router();

// GET /api/v1/daily-word — 公开接口，可选认证
router.get("/", optionalAuth, getDailyWord);

// POST /api/v1/daily-word/pin — 管理员置顶
router.post("/pin", authMiddleware, adminMiddleware, pinDailyWord);

export const dailyWordRoutes: RouterType = router;
