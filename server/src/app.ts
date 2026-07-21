import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { routes } from "./routes/index.js";
import { errorHandler, loginLimiter } from "./middleware/index.js";
import { swaggerSpec } from "./config/swagger.js";
import { config } from "./config/index.js";

export function createApp(): Express {
  const app = express();
  const isDev = config.nodeEnv !== "production";

  // ==========================================
  // 1. Helmet 安全头（最先注册）
  // ==========================================
  // 开发环境放行 unsafe-inline/eval（Swagger UI 需要）
  app.use(
    isDev
      ? helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:"],
              fontSrc: ["'self'", "data:"],
            },
          },
        })
      : helmet(),
  );

  // ==========================================
  // 2. trust proxy（Render 反向代理，须在 rate-limit 之前）
  // ==========================================
  app.set("trust proxy", 1);

  // ==========================================
  // 3. CORS — 白名单
  // ==========================================
  // 生产环境默认仅允许 Vercel 部署域名，开发环境默认允许本地前端
  const defaultOrigins = isDev
    ? ["http://localhost:10086", "http://localhost:3001"]
    : ["https://english-dictionary.vercel.app"];

  const ALLOWED_ORIGINS =
    config.corsOrigins.length > 0 ? config.corsOrigins : defaultOrigins;

  app.use(
    cors({
      origin: ALLOWED_ORIGINS,
      credentials: true,
    }),
  );

  // ==========================================
  // 4. 请求体解析 & 日志
  // ==========================================
  app.use(express.json());
  app.use(morgan(isDev ? "dev" : "combined"));

  // ==========================================
  // 5. Rate Limit（在路由之前）
  // ==========================================
  app.use("/api/v1/auth/login", loginLimiter);
  // aiLimiter 按用户限流，需在路由链中 authMiddleware 之后执行，
  // 因此在 ai.routes.ts 的 handler 链中应用，不在此处注册。

  // ==========================================
  // 6. Swagger API 文档
  // ==========================================
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "英语母语者词典 API 文档",
    }),
  );

  // 提供 JSON 格式的 OpenAPI spec（方便导入 Postman/Insomnia）
  app.get("/api/docs/json", (_req, res) => {
    res.json(swaggerSpec);
  });

  // ==========================================
  // 7. 健康检查
  // ==========================================
  app.get("/api/v1/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==========================================
  // 8. 路由挂载
  // ==========================================
  app.use("/api/v1", routes);

  // ==========================================
  // 9. 全局错误处理
  // ==========================================
  app.use(errorHandler);

  return app;
}
