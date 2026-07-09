import { request } from "./request";
import type { Word } from "../data/types";
import { adaptWord } from "./adapters";

// ============================================================
// 今日一词 API 模块
// ============================================================

/** 后端 daily-word 返回的完整 Word 子文档结构（与 BackendWord 相同） */
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

/** 前端适配后的每日一词数据 */
export interface DailyWordResponse {
  word: Word | null;
  date: string;
  isPinned: boolean;
}

/**
 * 获取今日一词
 * GET /api/v1/daily-word
 *
 * 公开接口，已登录用户会获得个性化推荐。
 */
export async function fetchDailyWord(): Promise<DailyWordResponse> {
  const raw = await request<BackendDailyWordResponse>("/api/v1/daily-word");
  return {
    word: raw.word ? adaptWord(raw.word) : null,
    date: raw.date,
    isPinned: raw.isPinned,
  };
}
