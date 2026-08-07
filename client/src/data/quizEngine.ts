// ============================================================
// Quiz Engine — 训练答题核心逻辑
// Ported from figma/src/app/data/quizEngine.ts
//
// 评分算法统一来自 @english-dict/shared。
// 题目从后端 QuizQuestion 集合获取，不足时自动触发 AI 生成。
// ============================================================

import type { QuizDirection, QuizItem, QuizResult } from './types';
import { fetchQuestions, submitAnswer } from '@/api/quiz';
import { scoreAnswer } from '@english-dict/shared';

// ── 导出函数 ─────────────────────────────────────────────────

/**
 * 生成一轮测验题目（10 题）。
 * - API-first：从后端 QuizQuestion 集合获取
 * - 后端题库不足时自动触发 AI 生成（对前端透明）
 */
export async function generateQuiz(
  direction: QuizDirection,
  wordId?: string
): Promise<QuizItem[]> {
  const items = await fetchQuestions(direction, wordId);
  return items;
}

/**
 * 评判用户输入。
 * - API-first：优先调用后端判分（已登录用户自动保存记录）
 * - 降级：API 不可用时回退本地判分（算法与后端一致，均来自 @english-dict/shared）
 * - 中译英 (zh2en)：关键词命中率 70% + LCS 序列相似度 30%
 * - 英译中 (en2zh)：字符重合度
 * - 空输入直接判错
 */
export async function judgeAnswer(
  item: QuizItem,
  userInput: string,
  direction: QuizDirection
): Promise<QuizResult> {
  try {
    const result = await submitAnswer(item.id, userInput);
    return result;
  } catch (error) {
    console.warn("Quiz API submit failed, falling back to local judge:", error);
  }

  // ── 降级：本地判分（共享评分引擎）──
  return scoreAnswer({
    direction,
    reference: item.reference,
    keywords: item.keywords,
    analysis: item.analysis,
    userInput,
  });
}

// ── Re-export: history & stats（供其他页面使用）─────────────
export { fetchHistory, fetchStats } from '@/api/quiz';
