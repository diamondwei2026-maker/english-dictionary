import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, adminMiddleware } from "../middleware";
import { getDashboard } from "../controllers/dashboard.controller";

const router = Router();

// GET /api/v1/admin/dashboard — 管理员专属
router.get("/", authMiddleware, adminMiddleware, getDashboard);

export const dashboardRoutes: RouterType = router;
