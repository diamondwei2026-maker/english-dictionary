import mongoose from "mongoose";
import { Word, WordBank, IWord, PHYSICAL_IMAGE_TYPES, PART_OF_SPEECH_TYPES } from "../models";
import { AppError } from "../utils/errors";
import { createLLMProvider } from "../providers/llm";
import type { LLMWordEntry } from "../providers/llm";

// === 工具函数 ===

function ensureValidId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", "无效的 ID 格式");
  }
}

/**
 * 检查数据库中单词是否已有完整词条内容
 */
function hasCompleteEntry(word: IWord): boolean {
  return (
    !!word.coreMeaning &&
    !!word.physicalImageDescription &&
    word.extendedMeanings.length > 0
  );
}

/**
 * 将 LLMWordEntry (snake_case) 映射为 IWord 创建数据 (camelCase)
 */
function mapLLMEntryToWordData(
  wordName: string,
  wordbankId: string,
  llmEntry: LLMWordEntry
): Record<string, unknown> {
  // 物理意象类型 — 转小写后校验
  const physicalImageType = llmEntry.physical_image.toLowerCase();
  if (
    !(PHYSICAL_IMAGE_TYPES as readonly string[]).includes(physicalImageType)
  ) {
    throw new AppError(
      502,
      "LLM_PARSE_ERROR",
      `AI 返回的物理意象类型 "${llmEntry.physical_image}" 不在有效枚举中。有效值: ${(PHYSICAL_IMAGE_TYPES as readonly string[]).join(", ")}`
    );
  }

  // 映射引申义数组
  const extendedMeanings = llmEntry.extended_meanings.map((em, index) => {
    const rawPos = em.part_of_speech;
    const pos = typeof rawPos === "string" ? rawPos.toLowerCase() : undefined;
    if (!pos || !(PART_OF_SPEECH_TYPES as readonly string[]).includes(pos)) {
      throw new AppError(
        502,
        "LLM_PARSE_ERROR",
        `AI 返回的词性 "${rawPos}" (extended_meanings[${index}]) 不在有效枚举中。有效值: ${(PART_OF_SPEECH_TYPES as readonly string[]).join(", ")}`
      );
    }

    return {
      evolutionDescription: em.evolution_description,
      meaning: em.meaning,
      partOfSpeech: pos,
      exampleEn: em.example_en,
      exampleZh: em.example_zh,
    };
  });

  return {
    word: wordName,
    wordbankId,
    phonetic: "",
    coreMeaning: llmEntry.core_meaning,
    coreExampleEn: llmEntry.core_example_en,
    coreExampleZh: llmEntry.core_example_zh,
    physicalImageType,
    physicalImageDescription: llmEntry.physical_image_description,
    extendedMeanings,
    collocations: llmEntry.collocations,
  };
}

// === 服务函数 ===

/**
 * AI 词条生成
 *
 * @param wordName  单词名
 * @param wordbankId 目标词库 ID
 * @param options.force 是否强制重新生成
 */
export async function generateWord(
  wordName: string,
  wordbankId: string,
  options: { force: boolean }
): Promise<IWord> {
  const { force } = options;

  // 1. 校验 wordbankId
  ensureValidId(wordbankId);

  // 2. 确认词库存在
  const wordbank = await WordBank.findById(wordbankId);
  if (!wordbank) {
    throw new AppError(404, "NOT_FOUND", "词库不存在");
  }

  // 3. 幂等性检查（非 force 模式）
  if (!force) {
    const existing = await Word.findOne({ wordbankId, word: wordName });
    if (existing && hasCompleteEntry(existing)) {
      throw new AppError(
        409,
        "CONFLICT",
        `单词 "${wordName}" 已有完整词条内容，使用 ?force=true 强制重新生成`
      );
    }
  }

  // 4. 调用 LLM
  const startedAt = Date.now();
  const provider = createLLMProvider("deepseek");
  const llmEntry = await provider.generateWordEntry(wordName);

  // 5. 映射结果
  const wordData = mapLLMEntryToWordData(wordName, wordbankId, llmEntry);

  // 6. 存储：使用 atomic upsert 避免 TOCTOU 竞态条件
  const word = await Word.findOneAndUpdate(
    { wordbankId, word: wordName },
    { $set: wordData },
    { new: true, upsert: true, runValidators: true }
  );

  const elapsedMs = Date.now() - startedAt;
  console.log(`[AI] Generated entry for "${wordName}" in ${elapsedMs}ms`);

  return word!;
}
