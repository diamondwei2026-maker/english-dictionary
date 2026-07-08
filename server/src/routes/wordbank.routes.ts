import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, optionalAuth, adminMiddleware } from "../middleware";
import * as wordbankController from "../controllers/wordbank.controller";

const router = Router();

// 公开路由 — optionalAuth 使已登录 admin 可看到私有词库
router.get("/", optionalAuth, wordbankController.list);
router.get("/:id", wordbankController.getById);

// 管理员路由
router.post("/", authMiddleware, adminMiddleware, wordbankController.create);
router.put("/:id", authMiddleware, adminMiddleware, wordbankController.update);
router.delete("/:id", authMiddleware, adminMiddleware, wordbankController.remove);

export const wordbankRoutes: RouterType = router;
