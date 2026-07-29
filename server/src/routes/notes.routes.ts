import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, optionalAuth } from "../middleware/index.js";
import * as notesController from "../controllers/notes.controller.js";

const router = Router();

// 所有笔记路由都需要登录
router.get("/", authMiddleware, notesController.list);
router.post("/", authMiddleware, notesController.create);
router.delete("/:id", authMiddleware, notesController.remove);

// 公开社区笔记（可选认证，有 Token 时注入 user）
router.get("/public", optionalAuth, notesController.listPublic);

// 点赞切换（需登录）
router.post("/:id/like", authMiddleware, notesController.toggleLike);

export const notesRoutes: RouterType = router;
