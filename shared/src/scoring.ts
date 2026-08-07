// ============================================================
// 共享判分引擎 — 客户端 (quizEngine.ts) 与服务端 (quiz.service.ts) 的唯一来源
// ============================================================

// ── 类型 ─────────────────────────────────────────────────────

export interface ScoringInput {
  direction: "zh2en" | "en2zh";
  reference: string;
  keywords: string[];
  analysis: string;
  userInput: string;
}

export interface ScoringResult {
  correct: boolean;
  score: number;
  matched: string[];
  missing: string[];
  analysis: string;
}

// ── 工具函数 ─────────────────────────────────────────────────

export const normalize = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[.!?。！？]+$/g, "")
    .replace(/\s+/g, " ");

export const words = (value: string): string[] =>
  normalize(value).match(/[a-z]+(?:'[a-z]+)?/g) ?? [];

export const variantMatches = (keyword: string, input: string[]): boolean =>
  input.some(
    (word) =>
      word === keyword ||
      word.replace(/(s|es|ed|ing)$/, "") ===
        keyword.replace(/(s|es|ed|ing)$/, ""),
  );

export const lcs = (a: string[], b: string[]): number => {
  const table = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      table[i][j] =
        a[i - 1] === b[j - 1]
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
  return table[a.length][b.length];
};

export const shuffle = <T>(values: T[]): T[] => {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ── 判分主函数 ───────────────────────────────────────────────

/**
 * 对单题用户输入判分。
 *
 * - zh2en：关键词命中率 70% + LCS 序列相似度 30%
 * - en2zh：字符级重合度（预留）
 * - 空输入直接判错
 *
 * @param input 题干数据 + 用户输入
 * @returns 判分结果（correct、score、matched/missing、analysis）
 */
export function scoreAnswer(input: ScoringInput): ScoringResult {
  const { direction, reference, keywords, analysis, userInput } = input;

  // 空输入处理
  if (!normalize(userInput)) {
    return {
      correct: false,
      score: 0,
      matched: [],
      missing: keywords,
      analysis: `${analysis} 你还没有输入答案；参考表达：${reference}`,
    };
  }

  if (direction === "en2zh") {
    // 英译中：字符重合度
    const source = normalize(userInput);
    const ref = normalize(reference);
    const score = Math.round(
      ([...new Set(source)].filter((c) => ref.includes(c)).length /
        Math.max(ref.length, 1)) *
        100,
    );
    return {
      correct: score >= 70,
      score,
      matched: [],
      missing: [],
      analysis:
        score >= 70
          ? `表达正确。参考答案：${reference}`
          : `${analysis} 参考答案：${reference}`,
    };
  }

  // 中译英：关键词 + LCS
  const inputWords = words(userInput);
  const matched = keywords.filter((k) => variantMatches(k, inputWords));
  const missing = keywords.filter((k) => !matched.includes(k));

  const keywordScore = (matched.length / keywords.length) * 70;
  const referenceWords = words(reference);
  const sequenceScore =
    (lcs(inputWords, referenceWords) /
      Math.max(referenceWords.length, 1)) *
    30;
  const score = Math.round(keywordScore + sequenceScore);
  const correct = score >= 70;

  return {
    correct,
    score,
    matched,
    missing,
    analysis: correct
      ? `表达已经抓住了这句的核心意象。参考答案：${reference}`
      : `${analysis}${missing.length ? ` 建议补上：${missing.join("、")}。` : ""} 参考答案：${reference}`,
  };
}
