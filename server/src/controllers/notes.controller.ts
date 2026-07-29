import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as notesService from "../services/notes.service.js";

/**
 * GET /api/v1/notes
 * 获取当前用户的笔记。支持可选 ?wordId=xxx 过滤。
 */
export const list = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    const wordId = req.query.wordId as string | undefined;

    const notes = wordId
      ? await notesService.getNotesByWord(userId, wordId)
      : await notesService.getMyNotes(userId);

    res.json(notes);
  },
);

/**
 * POST /api/v1/notes
 * 创建一条笔记。
 */
export const create = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    const { wordId, content } = req.body;

    if (!wordId) {
      res.status(400).json({
        error: { code: "MISSING_WORD_ID", message: "缺少 wordId 参数" },
      });
      return;
    }
    if (!content) {
      res.status(400).json({
        error: { code: "MISSING_CONTENT", message: "缺少 content 参数" },
      });
      return;
    }

    const note = await notesService.createNote(userId, wordId, content);
    res.status(201).json(note);
  },
);

/**
 * DELETE /api/v1/notes/:id
 * 删除一条笔记。
 */
export const remove = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    await notesService.deleteNote(userId, req.params.id);
    res.json({ message: "笔记已删除" });
  },
);

/**
 * GET /api/v1/notes/public?wordId=xxx
 * 获取某单词下所有用户的笔记（公开，无需强制认证），按点赞数降序。
 * 使用 optionalAuth — 有 Token 时注入 user 用于前端判断已赞状态。
 */
export const listPublic = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const wordId = req.query.wordId as string | undefined;
    if (!wordId) {
      res.status(400).json({
        error: { code: "MISSING_WORD_ID", message: "缺少 wordId 参数" },
      });
      return;
    }
    const notes = await notesService.getPublicNotesByWord(wordId);
    res.json(notes);
  },
);

/**
 * POST /api/v1/notes/:id/like
 * 点赞切换（有则取消，无则添加）。
 */
export const toggleLike = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const userId = req.user!.userId;
    const result = await notesService.toggleLike(userId, req.params.id);
    res.json(result);
  },
);
