import dotenv from "dotenv";

dotenv.config();

// 警告：生产环境必须设置 JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.warn(
    "[WARN] JWT_SECRET not set, using default 'dev-secret' — this is insecure in production"
  );
}

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
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  deepseekBaseUrl:
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",

  // 连接池配置
  dbMaxPoolSize: parseIntSafe(process.env.DB_MAX_POOL_SIZE, 10),
  dbIdleTimeoutMs: parseIntSafe(process.env.DB_IDLE_TIMEOUT_MS, 30000),
  dbConnectTimeoutMs: parseIntSafe(process.env.DB_CONNECT_TIMEOUT_MS, 10000),

  // 缓存配置
  cacheEnabled: process.env.CACHE_ENABLED !== "false", // 默认启用
  // TTL（秒）
  cacheTtlDailyWord: parseIntSafe(
    process.env.CACHE_TTL_DAILY_WORD,
    86400,
  ), // 一天
  cacheTtlWordbankList: parseIntSafe(
    process.env.CACHE_TTL_WORDBANK_LIST,
    300,
  ), // 5 分钟
  cacheTtlWordbankDetail: parseIntSafe(
    process.env.CACHE_TTL_WORDBANK_DETAIL,
    300,
  ),
  cacheTtlWordDetail: parseIntSafe(
    process.env.CACHE_TTL_WORD_DETAIL,
    600,
  ), // 10 分钟
  cacheTtlWordList: parseIntSafe(process.env.CACHE_TTL_WORD_LIST, 300),
};
