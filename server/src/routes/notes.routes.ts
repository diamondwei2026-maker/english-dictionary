import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "../middleware/index.js";
import * as notesController from "../controllers/notes.controller.js";

const router = Router();

// 所有笔记路由都需要登录
router.get("/", authMiddleware, notesController.list);
router.post("/", authMiddleware, notesController.create);
router.delete("/:id", authMiddleware, notesController.remove);

export const notesRoutes: RouterType = router;
