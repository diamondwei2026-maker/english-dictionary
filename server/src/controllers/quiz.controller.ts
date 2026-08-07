import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as quizService from "../services/quiz.service.js";
import { generateQuestionsForWordbank } from "../services/quiz-ai.service.js";
import {
  validateGetQuestionsQuery,
  validateSubmitAnswerBody,
  validateHistoryQuery,
  validateGenerateBody,
} from "../validators/quiz.validator.js";

// ============================================================
// GET /quiz/questions — 获取题目（可选认证）
// ============================================================

export const getQuestions = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { direction, wordId, difficulty } = validateGetQuestionsQuery(req.query);
    const userId = req.user?.userId;

    const questions = await quizService.generateQuiz(
      direction as "zh2en" | "en2zh",
      wordId,
      userId,
      undefined,
      difficulty,
    );

    res.json({ data: questions });
  },
);

// ============================================================
// POST /quiz/generate — AI 出题（需认证，限流）
// ============================================================

export const generateQuestions = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { wordbankId } = validateGenerateBody(req.body);

    const stats = await generateQuestionsForWordbank(wordbankId);

    res.json(stats);
  },
);

// ============================================================
// POST /quiz/submit — 提交判分（可选认证）
// ============================================================

export const submitAnswer = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { questionId, userInput } = validateSubmitAnswerBody(req.body);
    const userId = req.user?.userId;

    const result = await quizService.judgeAnswer(questionId, userInput, userId);

    res.json(result);
  },
);

// ============================================================
// GET /quiz/history — 答题历史（需认证）
// ============================================================

export const getHistory = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { page, limit } = validateHistoryQuery(req.query);
    const userId = req.user!.userId;

    const result = await quizService.getHistory(userId, page, limit);

    res.json({ data: result.data, pagination: result.pagination });
  },
);

// ============================================================
// GET /quiz/stats — 训练统计（需认证）
// ============================================================

export const getStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;

    const result = await quizService.getStats(userId);

    res.json(result);
  },
);
