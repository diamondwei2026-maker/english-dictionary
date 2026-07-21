import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/index.js";
import { getMe, listUsers } from "../controllers/user.controller.js";
import {
  getStats,
  getFavorites,
  getLearningRecords,
} from "../controllers/learning.controller.js";

const router = Router();

// 管理员 — 用户列表（必须在 /me 之前注册，避免 :id 误匹配）
router.get("/", authMiddleware, adminMiddleware, listUsers);
router.get("/me", authMiddleware, getMe);
router.get("/stats", authMiddleware, getStats);
router.get("/favorites", authMiddleware, getFavorites);
router.get("/learning-records", authMiddleware, getLearningRecords);

export const userRoutes: RouterType = router;
