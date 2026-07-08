import { request } from "./request";
import type { User } from "../data/types";
import { adaptUser, type BackendPagination } from "./adapters";

// ============================================================
// 用户 API 模块
// ============================================================

interface BackendUserResponse {
  _id: string;
  username: string;
  phone: string;
  role: "user" | "admin";
  learnedWords: string[];
  favoriteWords: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 用户列表（admin）
 * GET /api/v1/users（注：后端目前仅有 GET /api/v1/users/me，
 * 若 admin 用户列表接口尚未实现，则此函数返回空数组）
 *
 * TODO: 待后端实现 GET /api/v1/users (admin) 路由
 */
export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await request<{
      data: BackendUserResponse[];
      pagination?: BackendPagination;
    }>("/api/v1/users");
    return (res.data || []).map(adaptUser);
  } catch {
    // 后端路由未实现时静默返回空数组
    return [];
  }
}

/**
 * 当前用户信息
 * GET /api/v1/users/me
 */
export async function fetchCurrentUser(): Promise<User> {
  const res = await request<BackendUserResponse>("/api/v1/users/me");
  return adaptUser(res);
}
