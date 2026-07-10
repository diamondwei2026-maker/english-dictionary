import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as learningService from "../services/learning.service.js";
import * as favoriteService from "../services/favorite.service.js";

// ============================================================
// 学习与收藏控制器
// ============================================================

/**
 * POST /api/v1/words/:id/learn
 */
export const learn = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const result = await learningService.recordLearn(
      req.user!.userId,
      req.params.id,
    );
    res.json(result);
  },
);

/**
 * POST /api/v1/words/:id/favorite
 */
export const favorite = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const result = await favoriteService.favoriteWord(
      req.user!.userId,
      req.params.id,
    );
    res.status(201).json(result);
  },
);

/**
 * DELETE /api/v1/words/:id/favorite
 */
export const unfavorite = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const result = await favoriteService.unfavoriteWord(
      req.user!.userId,
      req.params.id,
    );
    res.json(result);
  },
);

/**
 * GET /api/v1/user/learning-records
 */
export const getLearningRecords = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize as string, 10) || 20),
    );
    const result = await learningService.getUserLearningRecords(
      req.user!.userId,
      page,
      pageSize,
    );
    res.json(result);
  },
);

/**
 * GET /api/v1/user/stats
 */
export const getStats = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const stats = await learningService.getUserStats(req.user!.userId);
    res.json(stats);
  },
);

/**
 * GET /api/v1/user/favorites
 */
export const getFavorites = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize as string, 10) || 20),
    );
    const result = await favoriteService.getUserFavorites(
      req.user!.userId,
      page,
      pageSize,
    );
    res.json(result);
  },
);
