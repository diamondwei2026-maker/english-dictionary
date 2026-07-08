import { Router } from "express";
import { authMiddleware } from "../middleware";
import { getMe } from "../controllers/user.controller";

const router = Router();

router.get("/me", authMiddleware, getMe);

export const userRoutes = router;
