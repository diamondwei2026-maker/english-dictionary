import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, adminMiddleware, aiLimiter } from "../middleware/index.js";
import * as aiController from "../controllers/ai.controller.js";

const router = Router();

// AI 词条生成 — 仅管理员
// 挂载到基路径 /，实际路径为 /api/v1/words/generate
// aiLimiter 在 authMiddleware 之后执行，使 keyGenerator 可读取 req.user.userId
router.post(
  "/words/generate",
  authMiddleware,
  adminMiddleware,
  aiLimiter,
  aiController.generate,
);

// AI 词条生成 SSE 流式 — 仅管理员
router.post(
  "/words/generate/stream",
  authMiddleware,
  adminMiddleware,
  aiLimiter,
  aiController.generateStream,
);

export const aiRoutes: RouterType = router;
