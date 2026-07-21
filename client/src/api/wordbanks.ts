// ============================================================
// 词库 API 模块 — 与 client/src/api/wordbanks.ts 一致
// ============================================================

import { request } from "./request";
import type { Word, WordLibrary } from "../data/types";
import {
  adaptWordbank,
  adaptWordbankList,
  adaptWordList,
  type BackendPagination,
} from "./adapters";

interface BackendWordbankResponse {
  _id: string;
  name: string;
  slug: string;
  description: string;
  cover_image: string;
  gradient: string;
  is_public: boolean;
  wordCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendWordbankListResponse {
  data: BackendWordbankResponse[];
  pagination: BackendPagination;
}

/**
 * 词库列表
 * GET /api/v1/wordbanks?page=1&pageSize=20
 */
export async function fetchWordbanks(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{ libraries: WordLibrary[]; total: number }> {
  const query: string[] = [];
  if (params?.page) query.push(`page=${params.page}`);
  if (params?.pageSize) query.push(`pageSize=${params.pageSize}`);

  const path = `/api/v1/wordbanks${query.length ? "?" + query.join("&") : ""}`;
  const res = await request<BackendWordbankListResponse>(path);
  return adaptWordbankList(res);
}

/**
 * 词库详情
 * GET /api/v1/wordbanks/:id
 */
export async function fetchWordbankById(id: string): Promise<WordLibrary> {
  const res = await request<BackendWordbankResponse>(
    `/api/v1/wordbanks/${id}`
  );
  return adaptWordbank(res, res.wordCount);
}

/**
 * 词库下单词列表
 * GET /api/v1/wordbanks/:id/words?page=1&pageSize=20
 */
export async function fetchWordsByWordbank(
  id: string,
  params?: { page?: number; pageSize?: number }
): Promise<{ words: Word[]; total: number }> {
  const query: string[] = [];
  if (params?.page) query.push(`page=${params.page}`);
  if (params?.pageSize) query.push(`pageSize=${params.pageSize}`);

  const qs = query.length ? "?" + query.join("&") : "";
  const res = await request<{
    data: Array<{
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
    }>;
    pagination: BackendPagination;
  }>(`/api/v1/wordbanks/${id}/words${qs}`);
  return adaptWordList(res);
}

/**
 * 新增词库（admin）
 * POST /api/v1/wordbanks
 */
export async function createWordbank(data: {
  name: string;
  description?: string;
}): Promise<WordLibrary> {
  const slug =
    data.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "") ||
    `wb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const res = await request<BackendWordbankResponse>("/api/v1/wordbanks", {
    method: "POST",
    data: {
      name: data.name,
      slug,
      description: data.description || data.name,
    } as unknown as Record<string, unknown>,
  });
  return adaptWordbank(res, 0);
}

/**
 * 编辑词库（admin）
 * PUT /api/v1/wordbanks/:id
 */
export async function updateWordbank(
  id: string,
  data: { name?: string; description?: string }
): Promise<WordLibrary> {
  const res = await request<BackendWordbankResponse>(
    `/api/v1/wordbanks/${id}`,
    {
      method: "PUT",
      data: data as unknown as Record<string, unknown>,
    }
  );
  return adaptWordbank(res, res.wordCount);
}

/**
 * 删除词库（admin）
 * DELETE /api/v1/wordbanks/:id
 */
export async function deleteWordbank(id: string): Promise<void> {
  await request<{ message: string }>(`/api/v1/wordbanks/${id}`, {
    method: "DELETE",
  });
}
