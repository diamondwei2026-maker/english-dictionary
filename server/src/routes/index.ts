import { Router } from "express";
import { authRoutes } from "./auth.routes";

export const routes = Router();

routes.use("/auth", authRoutes);
// 子路由占位（后续 Task 实现）
// routes.use("/wordbanks", wordbankRoutes);
// routes.use("/words", wordRoutes);
// routes.use("/users", userRoutes);

// 兜底 404
routes.all("*", (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});
