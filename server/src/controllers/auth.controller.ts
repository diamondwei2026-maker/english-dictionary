import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateRegisterInput, validateLoginInput } from "../validators/auth.validator.js";
import * as authService from "../services/auth.service.js";

export const register = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const input = validateRegisterInput(req.body);
    const user = await authService.register(input);

    res.status(201).json({
      id: user._id,
      phone: user.phone,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    });
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const input = validateLoginInput(req.body);
    const { user, token } = await authService.login(input);

    res.json({
      id: user._id,
      phone: user.phone,
      username: user.username,
      role: user.role,
      token,
    });
  }
);
