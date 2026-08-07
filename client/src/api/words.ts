// ============================================================
// 单词 API 模块 — 与 client/src/api/words.ts 一致
// ============================================================

import { request } from "./request";
import type { Word } from "../data/types";
import { adaptWord, adaptWordList, type BackendPagination } from "./adapters";

interface BackendWordResponse {
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

interface BackendWordListResponse {
  data: BackendWordResponse[];
  pagination: BackendPagination;
}

export interface CreateWordInput {
  word: string;
  wordbankId?: string;
  phonetic?: string;
  coreMeaning: string;
  coreExampleEn: string;
  coreExampleZh: string;
  physicalImageType: string;
  physicalImageDescription: string;
  coreImageSvg?: string;
  extendedMeanings: Array<{
    evolutionDescription: string;
    meaning: string;
    partOfSpeech: string;
    exampleEn: string;
    exampleZh: string;
  }>;
  collocations: string[];
}

export type UpdateWordInput = Partial<CreateWordInput>;

/**
 * 单词列表 / 搜索
 * GET /api/v1/words?page=1&pageSize=20&q=keyword&wordbank_id=xxx
 */
export async function fetchWords(params: {
  page?: number;
  pageSize?: number;
  q?: string;
  wordbankId?: string;
}): Promise<{ words: Word[]; total: number }> {
  const query: string[] = [];
  if (params.page) query.push(`page=${params.page}`);
  if (params.pageSize) query.push(`pageSize=${params.pageSize}`);
  if (params.q) query.push(`q=${encodeURIComponent(params.q)}`);
  if (params.wordbankId)
    query.push(`wordbank_id=${encodeURIComponent(params.wordbankId)}`);

  const path = `/api/v1/words${query.length ? "?" + query.join("&") : ""}`;
  const res = await request<BackendWordListResponse>(path);
  return adaptWordList(res);
}

/**
 * 单词详情
 * GET /api/v1/words/:id
 */
export async function fetchWordById(id: string): Promise<Word> {
  const res = await request<BackendWordResponse>(`/api/v1/words/${id}`);
  return adaptWord(res);
}

/**
 * 新增单词（admin）
 * POST /api/v1/words
 */
export async function createWord(data: CreateWordInput): Promise<Word> {
  const res = await request<BackendWordResponse>("/api/v1/words", {
    method: "POST",
    data: data as unknown as Record<string, unknown>,
  });
  return adaptWord(res);
}

/**
 * 编辑单词（admin）
 * PUT /api/v1/words/:id
 */
export async function updateWord(
  id: string,
  data: UpdateWordInput
): Promise<Word> {
  const res = await request<BackendWordResponse>(`/api/v1/words/${id}`, {
    method: "PUT",
    data: data as unknown as Record<string, unknown>,
  });
  return adaptWord(res);
}

/**
 * 删除单词（admin）
 * DELETE /api/v1/words/:id
 */
export async function deleteWord(id: string): Promise<void> {
  await request<{ message: string }>(`/api/v1/words/${id}`, {
    method: "DELETE",
  });
}

/** 单词详情（含用户相关状态） */
export interface WordDetail extends Word {
  isFavorited: boolean;
  learnCount: number;
}

/**
 * 单词详情（含当前用户的收藏状态和学习次数）。
 * GET /api/v1/words/:id
 */
export async function fetchWordDetail(id: string): Promise<WordDetail> {
  const raw = await request<
    BackendWordResponse & { isFavorited?: boolean; learnCount?: number }
  >(`/api/v1/words/${id}`);
  return {
    ...adaptWord(raw),
    isFavorited: raw.isFavorited ?? false,
    learnCount: raw.learnCount ?? 0,
  };
}
