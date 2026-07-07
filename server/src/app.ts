import express, { Express, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { routes } from "./routes";
import { errorHandler } from "./middleware";

export function createApp(): Express {
  const app = express();

  // CORS — 开发环境允许前端 localhost:10086
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://english-dictionary.vercel.app"]
          : ["http://localhost:10086", "http://localhost:3001"],
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(morgan("dev"));

  // 健康检查
  app.get("/api/v1/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 路由挂载
  app.use("/api/v1", routes);

  // 全局错误处理
  app.use(errorHandler);

  return app;
}
