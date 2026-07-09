import { request } from "./request";

// ============================================================
// 管理后台 Dashboard API 模块
// ============================================================

/** Dashboard 概览数据 */
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
 *
 * 需要管理员权限。
 */
export async function fetchDashboard(): Promise<DashboardResponse> {
  return request<DashboardResponse>("/api/v1/admin/dashboard");
}
