import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, adminMiddleware } from "../middleware";
import * as aiController from "../controllers/ai.controller";

const router = Router();

// AI 词条生成 — 仅管理员
// 挂载到基路径 /，实际路径为 /api/v1/words/generate
router.post(
  "/words/generate",
  authMiddleware,
  adminMiddleware,
  aiController.generate
);

export const aiRoutes: RouterType = router;
