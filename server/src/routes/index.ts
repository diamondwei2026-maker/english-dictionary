import { Router } from "express";
import type { Router as RouterType } from "express";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { wordbankRoutes } from "./wordbank.routes";
import { wordRoutes } from "./word.routes";

export const routes: RouterType = Router();

routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/wordbanks", wordbankRoutes);
routes.use("/words", wordRoutes);

// 兜底 404
routes.all("*", (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});
