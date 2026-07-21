// ============================================================
// 今日一词 API 模块 — 与 client/src/api/daily-word.ts 一致
// ============================================================

import { request } from "./request";
import type { Word } from "../data/types";
import { adaptWord } from "./adapters";

interface BackendDailyWord {
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

interface BackendDailyWordResponse {
  word: BackendDailyWord | null;
  date: string;
  isPinned: boolean;
}

export interface DailyWordResponse {
  word: Word | null;
  date: string;
  isPinned: boolean;
}

/**
 * 获取今日一词
 * GET /api/v1/daily-word
 */
export async function fetchDailyWord(): Promise<DailyWordResponse> {
  const raw = await request<BackendDailyWordResponse>("/api/v1/daily-word");
  return {
    word: raw.word ? adaptWord(raw.word) : null,
    date: raw.date,
    isPinned: raw.isPinned,
  };
}
