import dotenv from "dotenv";

dotenv.config();

function parseIntSafe(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/english-dictionary",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  deepseekBaseUrl:
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",

  // 连接池配置
  dbMaxPoolSize: parseIntSafe(process.env.DB_MAX_POOL_SIZE, 10),
  dbIdleTimeoutMs: parseIntSafe(process.env.DB_IDLE_TIMEOUT_MS, 30000),
  dbConnectTimeoutMs: parseIntSafe(process.env.DB_CONNECT_TIMEOUT_MS, 10000),
};
