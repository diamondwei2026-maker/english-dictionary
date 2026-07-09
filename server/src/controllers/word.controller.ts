import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  validateCreateWordInput,
  validateUpdateWordInput,
} from "../validators/word.validator";
import * as wordService from "../services/word.service";
import { UserFavorite, LearningRecord } from "../models";

export const list = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize as string, 10) || 20)
    );
    const wordbankId = req.query.wordbank_id as string | undefined;
    const q = req.query.q as string | undefined;
    const isAdmin = req.user?.role === "admin";

    const result = await wordService.listWords({ page, pageSize, wordbankId, q, isAdmin });

    res.json({
      data: result.data,
      pagination: result.pagination,
    });
  }
);

export const getById = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const isAdmin = req.user?.role === "admin";
    const word = await wordService.getWordById(req.params.id, isAdmin);

    // 附加当前用户相关的收藏和学习状态
    let isFavorited = false;
    let learnCount = 0;
    if (req.user?.userId) {
      const [fav, lr] = await Promise.all([
        UserFavorite.findOne({ userId: req.user.userId, wordId: req.params.id }),
        LearningRecord.findOne({ userId: req.user.userId, wordId: req.params.id }),
      ]);
      isFavorited = !!fav;
      learnCount = lr?.learnCount ?? 0;
    }

    res.json({ ...word.toObject(), isFavorited, learnCount });
  }
);

export const create = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const input = validateCreateWordInput(req.body);
    const word = await wordService.createWord(input);

    res.status(201).json(word);
  }
);

export const update = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const input = validateUpdateWordInput(req.body);
    const word = await wordService.updateWord(req.params.id, input);

    res.json(word);
  }
);

export const remove = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    await wordService.deleteWord(req.params.id);

    res.json({ message: "单词已删除" });
  }
);

export const getByWordbank = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize as string, 10) || 20)
    );

    const isAdmin = req.user?.role === "admin";

    const result = await wordService.getWordsByWordbankId(req.params.id, {
      page,
      pageSize,
      isAdmin,
    });

    res.json({
      data: result.data,
      pagination: result.pagination,
    });
  }
);

export { learn, favorite, unfavorite } from "./learning.controller";
