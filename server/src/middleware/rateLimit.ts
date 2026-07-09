import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { config } from "../config";

function rateLimitMessage(msg: string) {
  return {
    error: {
      code: "RATE_LIMIT",
      message: msg,
    },
  };
}

// 登录接口限流：LOGIN_RATE_MAX 次/分钟/IP（默认 10）
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.loginRateMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("登录请求过于频繁，请稍后再试"),
});

// AI 生成接口限流：AI_RATE_MAX 次/分钟/用户（默认 10）
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.aiRateMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("AI 生成请求过于频繁，请稍后再试"),
  keyGenerator: (req) => {
    // authMiddleware 注入 req.user = { userId, role }，需在路由链中 authMiddleware 之后使用
    const userId = (req as any).user?.userId;
    if (userId) return userId;
    // 未认证则回退到 IP（使用 ipKeyGenerator 正确处理 IPv4/IPv6）
    return ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");
  },
});
