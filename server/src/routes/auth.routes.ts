import { Router } from "express";
import type { Router as RouterType } from "express";
import { register, login } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);

export const authRoutes: RouterType = router;
