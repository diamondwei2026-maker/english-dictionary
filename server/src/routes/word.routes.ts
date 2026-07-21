import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, optionalAuth, adminMiddleware } from "../middleware/index.js";
import * as wordController from "../controllers/word.controller.js";

const router = Router();

// 学习与收藏（需登录，须在 /:id 之前注册）
router.post("/:id/learn", authMiddleware, wordController.learn);
router.post("/:id/favorite", authMiddleware, wordController.favorite);
router.delete("/:id/favorite", authMiddleware, wordController.unfavorite);

// 公开路由 — optionalAuth 使 admin 可看到私有词库的单词
router.get("/", optionalAuth, wordController.list);
router.get("/:id", optionalAuth, wordController.getById);

// 管理员路由
router.post("/", authMiddleware, adminMiddleware, wordController.create);
router.put("/:id", authMiddleware, adminMiddleware, wordController.update);
router.delete("/:id", authMiddleware, adminMiddleware, wordController.remove);

export const wordRoutes: RouterType = router;
