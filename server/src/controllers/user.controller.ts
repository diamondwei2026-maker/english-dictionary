import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models";

export const getMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const user = await User.findById(req.user!.userId).select("-passwordHash");
    if (!user) {
      res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "用户不存在" },
      });
      return;
    }
    res.json({
      _id: user._id,
      id: user._id,
      phone: user.phone,
      username: user.username,
      role: user.role,
      learnedWords: user.learnedWords,
      favoriteWords: user.favoriteWords,
      createdAt: user.createdAt,
    });
  }
);

/**
 * GET /api/v1/users — 管理员分页查询所有用户
 */
export const listUsers = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize as string, 10) || 20)
    );

    const [data, total] = await Promise.all([
      User.find({})
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      User.countDocuments({}),
    ]);

    res.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
);
