import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as dailyWordService from "../services/daily-word.service.js";

/**
 * GET /api/v1/daily-word
 * 公开接口，可选认证 — 登录用户获得个性化推荐
 */
export const getDailyWord = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const result = await dailyWordService.getDailyWord(req.user?.userId);
    res.json(result);
  }
);

/**
 * POST /api/v1/daily-word/pin
 * 管理员置顶今日一词
 */
export const pinDailyWord = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const result = await dailyWordService.pinDailyWord(
      req.body.wordId,
      req.user!.userId
    );
    res.json(result);
  }
);
