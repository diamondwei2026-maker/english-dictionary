import { request } from "./request";

// ============================================================
// 学习记录 API 模块
// ============================================================

/**
 * 记录学习某单词。
 * POST /api/v1/words/:id/learn
 */
export async function recordLearn(
  wordId: string,
): Promise<{ learnCount: number; lastLearnedAt: string }> {
  return request(`/api/v1/words/${wordId}/learn`, { method: "POST" });
}

/**
 * 获取用户学习记录列表。
 * GET /api/v1/user/learning-records?page=1&pageSize=20
 */
export async function fetchLearningRecords(params: {
  page?: number;
  pageSize?: number;
}): Promise<{
  data: Array<{
    wordId: string;
    word: string;
    coreMeaning: string;
    phonetic: string;
    learnCount: number;
    lastLearnedAt: string | null;
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}> {
  const query: string[] = [];
  if (params.page) query.push(`page=${params.page}`);
  if (params.pageSize) query.push(`pageSize=${params.pageSize}`);
  const path = `/api/v1/user/learning-records${
    query.length ? "?" + query.join("&") : ""
  }`;
  return request(path);
}

export interface UserStats {
  totalWordsLearned: number;
  totalLearningDays: number;
  todayLearnedCount: number;
}

/**
 * 获取用户学习统计。
 * GET /api/v1/user/stats
 */
export async function fetchUserStats(): Promise<UserStats> {
  return request("/api/v1/user/stats");
}
