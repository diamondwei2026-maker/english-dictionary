import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/index.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

// GET /api/v1/admin/dashboard — 管理员专属
router.get("/", authMiddleware, adminMiddleware, getDashboard);

export const dashboardRoutes: RouterType = router;
