import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as dashboardService from "../services/dashboard.service";

/**
 * GET /api/v1/admin/dashboard
 * 管理员专属 — 数据概览
 */
export const getDashboard = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const result = await dashboardService.getDashboard();
    res.json(result);
  }
);
