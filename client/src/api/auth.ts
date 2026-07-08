import { request } from "./request";

// ============================================================
// 认证 API 模块
// ============================================================

/** 登录请求参数 */
export interface LoginParams {
  phone: string;
  password: string;
}

/** 注册请求参数 */
export interface RegisterParams {
  phone: string;
  password: string;
  username?: string;
}

/** 登录成功响应 */
export interface LoginResult {
  id: string;
  phone: string;
  username: string;
  role: "user" | "admin";
  token: string;
}

/** 注册成功响应 */
export interface RegisterResult {
  id: string;
  phone: string;
  username: string;
  role: "user" | "admin";
  createdAt: string;
}

/**
 * 手机号 + 密码登录。
 * POST /api/v1/auth/login
 */
export function login(params: LoginParams): Promise<LoginResult> {
  return request<LoginResult>("/api/v1/auth/login", {
    method: "POST",
    data: params as unknown as Record<string, unknown>,
  });
}

/**
 * 手机号注册。
 * POST /api/v1/auth/register
 *
 * 注意：注册成功不返回 token，需跳转登录页手动登录。
 */
export function register(params: RegisterParams): Promise<RegisterResult> {
  return request<RegisterResult>("/api/v1/auth/register", {
    method: "POST",
    data: params as unknown as Record<string, unknown>,
  });
}
