import { config } from "../config/index.js";
import { generateQuestionsForWordbank } from "../services/quiz-ai.service.js";
import type { IWord } from "../models/Word.js";

/**
 * 为词库种子数据生成训练题。
 *
 * 优先调用 AI（DeepSeek）按 wordbank 维度批量生成；
 * API Key 未配置时静默跳过，不阻塞种子流程。
 *
 * @param words — Word documents already inserted in this seed run
 * @returns number of quiz questions generated (0 if skipped)
 */
export async function seedQuizQuestions(words: IWord[]): Promise<number> {
  if (!config.deepseekApiKey) {
    console.log(
      "[Seed] DEEPSEEK_API_KEY not configured — skipping quiz question generation.",
    );
    return 0;
  }

  // 从已插入的 Word 文档收集去重的 wordbankId
  const wordbankIds = [...new Set(words.map((w) => String(w.wordbankId)))];

  let totalGenerated = 0;
  for (const wordbankId of wordbankIds) {
    try {
      const stats = await generateQuestionsForWordbank(wordbankId);
      totalGenerated += stats.generated;
      console.log(
        `[Seed] Quiz questions for wordbank ${wordbankId}: ${stats.generated} generated, ${stats.rejected} rejected`,
      );
    } catch (err) {
      console.warn(
        `[Seed] AI quiz generation failed for wordbank ${wordbankId}, skipping:`,
        err,
      );
    }
  }

  console.log(`[Seed] Total quiz questions generated: ${totalGenerated}`);
  return totalGenerated;
}
