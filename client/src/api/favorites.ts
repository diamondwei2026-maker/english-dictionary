import { request } from "./request";
import { adaptWord } from "./adapters";
import type { Word } from "../data/types";

// ============================================================
// 收藏 API 模块
// ============================================================

/**
 * 收藏单词。
 * POST /api/v1/words/:id/favorite
 */
export async function favoriteWord(
  wordId: string,
): Promise<{ favorited: boolean }> {
  return request(`/api/v1/words/${wordId}/favorite`, { method: "POST" });
}

/**
 * 取消收藏。
 * DELETE /api/v1/words/:id/favorite
 */
export async function unfavoriteWord(
  wordId: string,
): Promise<{ favorited: boolean }> {
  return request(`/api/v1/words/${wordId}/favorite`, { method: "DELETE" });
}

interface BackendFavoriteWord {
  _id: string;
  word: string;
  wordbankId: string;
  phonetic?: string;
  coreMeaning: string;
  coreExampleEn: string;
  coreExampleZh: string;
  physicalImageType: string;
  physicalImageDescription: string;
  extendedMeanings: Array<{
    _id: string;
    evolutionDescription: string;
    meaning: string;
    partOfSpeech: string;
    exampleEn: string;
    exampleZh: string;
  }>;
  collocations: string[];
}

/**
 * 获取用户收藏列表（分页）。
 * GET /api/v1/user/favorites?page=1&pageSize=20
 */
export async function fetchFavorites(params: {
  page?: number;
  pageSize?: number;
}): Promise<{
  data: Word[];
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
  const path = `/api/v1/user/favorites${
    query.length ? "?" + query.join("&") : ""
  }`;

  const res = await request<{
    data: BackendFavoriteWord[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }>(path);

  return {
    data: (res.data || []).map((w) => adaptWord(w as any)),
    pagination: res.pagination,
  };
}
