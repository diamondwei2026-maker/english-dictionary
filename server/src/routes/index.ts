import { Router } from "express";

export const routes = Router();

// 子路由占位（后续 Task 实现）
// routes.use("/auth", authRoutes);
// routes.use("/wordbanks", wordbankRoutes);
// routes.use("/words", wordRoutes);
// routes.use("/users", userRoutes);

// 兜底 404
routes.all("*", (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});
