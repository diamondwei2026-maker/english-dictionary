// ============================================================
// 用户 API 模块 — 与 client/src/api/users.ts 一致
// ============================================================

import { request } from "./request";
import type { User } from "../data/types";
import { adaptUser, type BackendPagination } from "./adapters";

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
 * GET /api/v1/users
 */
export async function fetchUsers(): Promise<User[]> {
  try {
    const res = await request<{
      data: BackendUserResponse[];
      pagination?: BackendPagination;
    }>("/api/v1/users");
    return (res.data || []).map(adaptUser);
  } catch {
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
