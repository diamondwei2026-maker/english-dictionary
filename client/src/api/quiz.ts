// ============================================================
// Quiz API 模块 — 封装训练答题相关 API 调用
// ============================================================

import { request } from "./request";
import type { QuizItem, QuizDirection } from "../data/types";

// ── 后端响应接口 ─────────────────────────────────────────────

interface BackendQuizQuestion {
  _id: string;
  prompt: string;
  hint: string;
  direction: "zh2en" | "en2zh";
  reference: string;
  keywords: string[];
  analysis: string;
  wordId?: string;
  wordbankId?: string;
  glossary?: {
    verbs: { word: string; meaning: string }[];
    nouns: { word: string; meaning: string }[];
  };
}

interface FetchQuestionsResponse {
  data: BackendQuizQuestion[];
}

interface SubmitAnswerResponse {
  correct: boolean;
  score: number;
  matched: string[];
  missing: string[];
  analysis: string;
  attemptSaved?: boolean;
}

interface HistoryItem {
  questionId: string;
  prompt: string;
  direction: string;
  userInput: string;
  score: number;
  correct: boolean;
  reference: string;
  submittedAt: string;
}

interface FetchHistoryResponse {
  data: HistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface FetchStatsResponse {
  totalQuestions: number;
  correctRate: number;
  recentTrend: number[];
}

// ── Adapter ──────────────────────────────────────────────────

/** 适配后端题目 → 前端 QuizItem（_id → id） */
function adaptQuizItem(raw: BackendQuizQuestion): QuizItem {
  return {
    id: raw._id,
    wordId: raw.wordId,
    direction: raw.direction,
    prompt: raw.prompt,
    hint: raw.hint,
    reference: raw.reference,
    keywords: raw.keywords,
    analysis: raw.analysis,
    glossary: raw.glossary,
  };
}

// ── 导出函数 ─────────────────────────────────────────────────

/**
 * 获取训练题目。
 * GET /api/v1/quiz/questions?direction=zh2en&wordId=xxx
 */
export async function fetchQuestions(
  direction: QuizDirection,
  wordId?: string
): Promise<QuizItem[]> {
  let url = `/api/v1/quiz/questions?direction=${encodeURIComponent(direction)}`;
  if (wordId) {
    url += `&wordId=${encodeURIComponent(wordId)}`;
  }

  const res = await request<FetchQuestionsResponse>(url);
  return res.data.map(adaptQuizItem);
}

/**
 * 提交答案并获取判分结果。
 * POST /api/v1/quiz/submit
 */
export function submitAnswer(
  questionId: string,
  userInput: string
): Promise<SubmitAnswerResponse> {
  return request<SubmitAnswerResponse>("/api/v1/quiz/submit", {
    method: "POST",
    data: { questionId, userInput } as unknown as Record<string, unknown>,
  });
}

/**
 * 获取已登录用户的答题历史。
 * GET /api/v1/quiz/history?page=1&limit=20
 */
export function fetchHistory(
  page: number = 1,
  limit: number = 20
): Promise<FetchHistoryResponse> {
  return request<FetchHistoryResponse>(
    `/api/v1/quiz/history?page=${page}&limit=${limit}`
  );
}

/**
 * 获取已登录用户的训练统计。
 * GET /api/v1/quiz/stats
 */
export function fetchStats(): Promise<FetchStatsResponse> {
  return request<FetchStatsResponse>("/api/v1/quiz/stats");
}
