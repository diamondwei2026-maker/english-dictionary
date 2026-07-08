import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validateGenerateWordInput } from "../validators/ai.validator";
import * as aiService from "../services/ai.service";

/**
 * POST /api/v1/words/generate
 *
 * AI 词条生成 — 仅管理员可调用。
 * Query 参数: ?force=true 强制重新生成已存在的单词。
 */
export const generate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const input = validateGenerateWordInput(req.body);
    const force = req.query.force === "true";

    const word = await aiService.generateWord(input.wordName, input.wordbankId, {
      force,
    });

    // force=true 时为更新操作返回 200，新建返回 201
    res.status(force ? 200 : 201).json(word);
  }
);
