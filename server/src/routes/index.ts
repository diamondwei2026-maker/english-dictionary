import { Router } from "express";
import type { Router as RouterType } from "express";
import { authRoutes } from "./auth.routes.js";
import { userRoutes } from "./user.routes.js";
import { wordbankRoutes } from "./wordbank.routes.js";
import { wordRoutes } from "./word.routes.js";
import { aiRoutes } from "./ai.routes.js";
import { dailyWordRoutes } from "./daily-word.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { notesRoutes } from "./notes.routes.js";

export const routes: RouterType = Router();

routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);
routes.use("/wordbanks", wordbankRoutes);
// aiRoutes 挂载在 /words/generate，须在 wordRoutes(/words 前缀) 之前注册
// 避免被 wordRoutes 的 catch-all 捕获
routes.use("/", aiRoutes);
routes.use("/words", wordRoutes);
routes.use("/daily-word", dailyWordRoutes);
routes.use("/admin/dashboard", dashboardRoutes);
routes.use("/notes", notesRoutes);

// 兜底 404
routes.all("*", (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});
