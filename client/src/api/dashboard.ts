// ============================================================
// 管理后台 Dashboard API 模块 — 与 client/src/api/dashboard.ts 一致
// ============================================================

import { request } from "./request";

export interface DashboardResponse {
  wordbankCount: number;
  wordCount: number;
  userCount: number;
  newWordsTrend: Array<{ date: string; count: number }>;
  newUsersTrend: Array<{ date: string; count: number }>;
}

/**
 * 获取管理后台 Dashboard 数据概览
 * GET /api/v1/admin/dashboard
 */
export async function fetchDashboard(): Promise<DashboardResponse> {
  return request<DashboardResponse>("/api/v1/admin/dashboard");
}
