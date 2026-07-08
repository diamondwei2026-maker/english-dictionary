import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
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
      id: user._id,
      phone: user.phone,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    });
  }
);
