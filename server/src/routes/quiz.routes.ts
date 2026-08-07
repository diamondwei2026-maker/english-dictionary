import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, optionalAuth } from "../middleware/index.js";
import * as quizController from "../controllers/quiz.controller.js";

const router = Router();

// GET /quiz/questions — 获取题目（可选认证：已登录排除 24h 已答，未登录正常出题）
router.get("/questions", optionalAuth, quizController.getQuestions);

// POST /quiz/submit — 提交判分（可选认证：已登录保存记录，未登录仅判分）
router.post("/submit", optionalAuth, quizController.submitAnswer);

// GET /quiz/history — 答题历史（需认证）
router.get("/history", authMiddleware, quizController.getHistory);

// GET /quiz/stats — 训练统计（需认证）
router.get("/stats", authMiddleware, quizController.getStats);

export const quizRoutes: RouterType = router;
