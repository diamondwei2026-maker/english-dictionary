import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  validateCreateWordBankInput,
  validateUpdateWordBankInput,
} from "../validators/wordbank.validator";
import * as wordbankService from "../services/wordbank.service";

export const list = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize as string, 10) || 20)
    );
    const isAdmin = req.user?.role === "admin";

    const result = await wordbankService.listWordbanks({ page, pageSize, isAdmin });

    res.json({
      data: result.data,
      pagination: result.pagination,
    });
  }
);

export const getById = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { wordbank, wordCount } = await wordbankService.getWordBankById(
      req.params.id
    );

    res.json({
      ...wordbank.toJSON(),
      wordCount,
    });
  }
);

export const create = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const input = validateCreateWordBankInput(req.body);
    const wordbank = await wordbankService.createWordBank(input);

    res.status(201).json(wordbank);
  }
);

export const update = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const input = validateUpdateWordBankInput(req.body);
    const wordbank = await wordbankService.updateWordBank(req.params.id, input);

    res.json(wordbank);
  }
);

export const remove = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    await wordbankService.deleteWordBank(req.params.id);

    res.json({ message: "词库已删除" });
  }
);
