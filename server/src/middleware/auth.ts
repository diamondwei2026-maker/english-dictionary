import { Request, Response, NextFunction } from "express";
import { TokenExpiredError } from "jsonwebtoken";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../utils/errors";

/**
 * 从 Authorization Header 提取 Bearer Token。
 * 返回 null 表示无 Token 或格式错误。
 */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] || null;
}

/** 强制认证中间件 — 无/无效/过期 Token 均返回 401 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);
    if (!token) {
      return next(
        new AppError(
          401,
          "UNAUTHORIZED",
          "未提供认证令牌，请在 Authorization Header 中使用 Bearer <token>"
        )
      );
    }
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return next(
        new AppError(401, "TOKEN_EXPIRED", "令牌已过期，请重新登录")
      );
    }
    return next(new AppError(401, "INVALID_TOKEN", "令牌无效或签名错误"));
  }
}

/** 可选认证中间件 — Token 存在则解析挂载 req.user，不存在或无效则静默放行 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    req.user = undefined;
    return next();
  }
  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, role: payload.role };
  } catch {
    req.user = undefined; // 静默失败，不阻断请求
  }
  next();
}

/** 管理员权限中间件 — 必须在 authMiddleware 之后使用 */
export function adminMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError(403, "FORBIDDEN", "权限不足，需要管理员权限"));
  }
  next();
}
