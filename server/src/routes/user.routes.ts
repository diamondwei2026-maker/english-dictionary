import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "../middleware";
import { getMe } from "../controllers/user.controller";
import {
  getStats,
  getFavorites,
  getLearningRecords,
} from "../controllers/learning.controller";

const router = Router();

router.get("/me", authMiddleware, getMe);
router.get("/stats", authMiddleware, getStats);
router.get("/favorites", authMiddleware, getFavorites);
router.get("/learning-records", authMiddleware, getLearningRecords);

export const userRoutes: RouterType = router;
