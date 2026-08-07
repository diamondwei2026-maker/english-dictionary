import mongoose from "mongoose";
import { Word, WordBank, QuizQuestion } from "../models/index.js";
import type { IWord, IQuizQuestion } from "../models/index.js";
import { config } from "../config/index.js";
import { AppError } from "../utils/errors.js";

// ============================================================
// 类型定义
// ============================================================

/** LLM 返回的单道题目（snake_case，匹配 AI JSON 响应） */
interface LLMQuizItem {
  prompt: string;
  hint: string;
  direction: "zh2en";
  reference: string;
  keywords: string[];
  analysis: string;
}

/** generateQuestionsForWordbank 返回统计 */
export interface QuizGenerationStats {
  wordbankId: string;
  generated: number;
  rejected: number;
  total: number;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 将 Word 文档压缩为 LLM prompt 所需的精简词条信息。
 * 只保留出题所需字段，避免 prompt 过长。
 */
function compactWordEntry(w: IWord): Record<string, unknown> {
  return {
    word: w.word,
    coreMeaning: w.coreMeaning,
    coreExampleEn: w.coreExampleEn,
    coreExampleZh: w.coreExampleZh,
    extendedMeanings: w.extendedMeanings.map((em) => ({
      meaning: em.meaning,
      partOfSpeech: em.partOfSpeech,
      exampleEn: em.exampleEn,
      exampleZh: em.exampleZh,
    })),
    collocations: w.collocations,
  };
}

/**
 * 校验 LLM 返回的单条题目是否符合 QuizQuestion 结构。
 * 返回 null 表示校验失败（调用方应记录日志并跳过该题）。
 */
function validateLLMQuizItem(
  item: unknown,
  index: number,
): LLMQuizItem | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    console.warn(`[QuizAI] Item ${index}: not a valid object`);
    return null;
  }

  const o = item as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof o.prompt !== "string" || o.prompt.trim().length === 0) {
    errors.push("prompt missing/empty");
  }
  if (typeof o.hint !== "string" || o.hint.trim().length === 0) {
    errors.push("hint missing/empty");
  }
  if (typeof o.reference !== "string" || o.reference.trim().length === 0) {
    errors.push("reference missing/empty");
  }
  if (!Array.isArray(o.keywords) || o.keywords.length === 0) {
    errors.push("keywords missing/empty");
  } else {
    const nonString = o.keywords.some((k) => typeof k !== "string");
    if (nonString) errors.push("keywords contains non-string values");
  }
  if (typeof o.analysis !== "string" || o.analysis.trim().length === 0) {
    errors.push("analysis missing/empty");
  }

  if (errors.length > 0) {
    console.warn(
      `[QuizAI] Item ${index}: validation failed — ${errors.join(", ")}`,
    );
    return null;
  }

  return {
    prompt: o.prompt as string,
    hint: o.hint as string,
    direction: "zh2en",
    reference: o.reference as string,
    keywords: o.keywords as string[],
    analysis: o.analysis as string,
  };
}

/**
 * 从 LLM 返回的原始文本中提取 JSON 数组。
 * 处理常见的 LLM 响应格式问题：markdown fences、多余文本。
 */
function extractJsonArray(raw: string): unknown[] | null {
  let content = raw.trim();

  // 去掉 markdown 代码围栏
  content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  // 尝试直接解析
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    // 有时 LLM 返回 { "questions": [...] }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.questions)) {
      return parsed.questions;
    }
    console.warn("[QuizAI] Parsed JSON is not an array and has no 'questions' key");
    return null;
  } catch {
    // 尝试提取 JSON 数组片段 [...]
    const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        console.warn("[QuizAI] Failed to parse extracted JSON array fragment");
      }
    }
    console.warn("[QuizAI] Failed to parse LLM response as JSON:", content.slice(0, 500));
    return null;
  }
}

// ============================================================
// System Prompt — 出题专用
// ============================================================

const QUIZ_SYSTEM_PROMPT = `You are an expert English vocabulary quiz creator for Chinese native speakers.

## Task
Given vocabulary entries (word, meanings, example sentences, collocations),
generate 3 "Chinese-to-English translation" quiz questions per word.

## Output Format
Return ONLY a JSON object with a "questions" array:
{
  "questions": [
    {
      "prompt": "A natural Chinese sentence that embeds the target English expression in context",
      "hint": "A minimal hint, e.g. 'flow · liquid moves continuously along a path'",
      "direction": "zh2en",
      "reference": "The correct English translation (complete sentence)",
      "keywords": ["key", "english", "words", ...],
      "analysis": "Explanation in Chinese — why this translation, common mistakes to avoid"
    }
  ]
}

## Quiz Design Principles
1. Each question focuses on ONE core expression (the word itself or a collocation)
2. The Chinese prompt MUST sound natural — NOT a literal translation
3. The analysis should explain the translation logic and point out common Chinese-speaker pitfalls
4. The hint should be concise — give directional clues, NOT the answer
5. Keywords: select 3-6 English words critical to the correct translation (used for scoring)
6. Prefer adapting the given example sentences as reference answers — they are guaranteed correct

## Language
- prompt, hint, analysis: Chinese
- reference, keywords: English

IMPORTANT: Return ONLY valid JSON. No markdown fences, no extra text.`;

// ============================================================
// 核心函数
// ============================================================

const TIMEOUT_MS = 90_000; // 题目批量生成比单词分析慢，给 90s
const QUESTIONS_PER_WORD = 3;

/**
 * 为指定词库自动生成 zh2en 训练题。
 *
 * - 从 WordBank 读取所有单词的完整词条信息
 * - 构建 batch prompt 调用 DeepSeek V4 Flash
 * - 解析 JSON → 逐题校验 → 批量 upsert 到 QuizQuestion
 * - 无 API Key 时静默跳过（不抛错，返回 0）
 *
 * @param wordbankId 词库 ID
 * @returns 生成统计 { wordbankId, generated, rejected, total }
 */
export async function generateQuestionsForWordbank(
  wordbankId: string,
): Promise<QuizGenerationStats> {
  // 1. 校验 wordbankId
  if (!mongoose.Types.ObjectId.isValid(wordbankId)) {
    throw new AppError(400, "INVALID_ID", "无效的词库 ID");
  }

  // 2. 确认词库存在
  const wordbank = await WordBank.findById(wordbankId);
  if (!wordbank) {
    throw new AppError(404, "NOT_FOUND", "词库不存在");
  }

  // 3. 获取单词列表
  const words = await Word.find({ wordbankId }).lean<IWord[]>();
  if (words.length === 0) {
    return { wordbankId, generated: 0, rejected: 0, total: 0 };
  }

  // 4. 无 API Key 时静默跳过
  if (!config.deepseekApiKey) {
    console.warn(
      "[QuizAI] DEEPSEEK_API_KEY not configured — skipping quiz generation",
    );
    return { wordbankId, generated: 0, rejected: 0, total: words.length };
  }

  // 5. 构建 User Prompt（含完整词条信息）
  const wordEntries = words.map(compactWordEntry);
  const userPrompt = [
    `Generate ${QUESTIONS_PER_WORD} Chinese-to-English translation quiz questions for each of the following ${wordEntries.length} English words.`,
    "",
    "## Vocabulary Data",
    JSON.stringify(wordEntries, null, 2),
    "",
    `Total questions expected: ${wordEntries.length * QUESTIONS_PER_WORD}`,
  ].join("\n");

  // 6. 调用 DeepSeek V4 Flash
  console.log(
    `[QuizAI] Generating questions for wordbank "${wordbank.name}" (${words.length} words, ~${words.length * QUESTIONS_PER_WORD} questions)...`,
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let rawContent: string;

  try {
    const response = await fetch(
      `${config.deepseekBaseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.deepseekApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          messages: [
            { role: "system", content: QUIZ_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "<unreadable>");
      console.error(
        `[QuizAI] DeepSeek API returned ${response.status}: ${errorBody}`,
      );
      throw new AppError(
        502,
        "LLM_SERVICE_ERROR",
        "AI 服务暂时不可用，请稍后重试",
      );
    }

    const body = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    rawContent = body?.choices?.[0]?.message?.content ?? "";

    if (!rawContent) {
      console.error("[QuizAI] Empty response content:", JSON.stringify(body));
      throw new AppError(502, "LLM_PARSE_ERROR", "AI 返回内容为空，请重试");
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AppError(504, "LLM_TIMEOUT", "AI 服务响应超时，请稍后重试");
    }
    console.error("[QuizAI] Unexpected error:", err);
    throw new AppError(502, "LLM_SERVICE_ERROR", "AI 服务暂时不可用，请稍后重试");
  } finally {
    clearTimeout(timeoutId);
  }

  // 7. 解析 + 校验 JSON
  const rawItems = extractJsonArray(rawContent);
  if (!rawItems || rawItems.length === 0) {
    throw new AppError(502, "LLM_PARSE_ERROR", "AI 返回的题目数组为空或格式异常");
  }

  const validItems: LLMQuizItem[] = [];
  let rejected = 0;
  for (let i = 0; i < rawItems.length; i++) {
    const validated = validateLLMQuizItem(rawItems[i], i);
    if (validated) {
      validItems.push(validated);
    } else {
      rejected++;
    }
  }

  if (validItems.length === 0) {
    throw new AppError(
      502,
      "LLM_PARSE_ERROR",
      `AI 返回的 ${rawItems.length} 道题全部校验失败，请重试`,
    );
  }

  // 8. 批量 Upsert（按 prompt + reference 去重）
  // 这里不关联 wordId/wordbankId，因为 QuizQuestion 与 Word 是弱关联
  // （LLM 按词条信息出题，但题目本身独立于具体 Word 文档）
  const operations = validItems.map((item) => ({
    updateOne: {
      filter: { prompt: item.prompt, reference: item.reference },
      update: {
        $setOnInsert: {
          prompt: item.prompt,
          hint: item.hint,
          direction: item.direction,
          reference: item.reference,
          keywords: item.keywords,
          analysis: item.analysis,
        },
      },
      upsert: true,
    },
  }));

  const result = await QuizQuestion.bulkWrite(operations, { ordered: false });
  const upserted = result.upsertedCount + (result.insertedCount ?? 0);

  console.log(
    `[QuizAI] Generated ${upserted} new questions for "${wordbank.name}" (${rejected} rejected, ${result.matchedCount} already existed)`,
  );

  return {
    wordbankId,
    generated: upserted,
    rejected,
    total: validItems.length,
  };
}
