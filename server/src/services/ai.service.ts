import { PHYSICAL_IMAGE_TYPES, PART_OF_SPEECH_TYPES } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createLLMProvider } from "../providers/llm.js";
import type { LLMWordEntry } from "../providers/llm.js";

/**
 * 将 LLMWordEntry (snake_case) 映射为 IWord 创建数据 (camelCase)
 */
export function mapLLMEntryToWordData(
  wordName: string,
  llmEntry: LLMWordEntry
): Record<string, unknown> {
  // 物理意象类型 — 转小写后校验（空字符串表示无物理意象）
  const rawType = llmEntry.physical_image?.toLowerCase?.() ?? "";
  let physicalImageType = "";
  if (rawType !== "") {
    if (
      !(PHYSICAL_IMAGE_TYPES as readonly string[]).includes(rawType)
    ) {
      throw new AppError(
        502,
        "LLM_PARSE_ERROR",
        `AI 返回的物理意象类型 "${llmEntry.physical_image}" 不在有效枚举中。有效值: ${(PHYSICAL_IMAGE_TYPES as readonly string[]).join(", ")}`
      );
    }
    physicalImageType = rawType;
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
    phonetic: llmEntry.phonetic,
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
 * @param wordName 单词名
 */
export async function generateWord(
  wordName: string
): Promise<Record<string, unknown>> {
  // Phase 1: V4 Pro 词条分析（不含 SVG）
  const startedAt = Date.now();
  const provider = createLLMProvider("deepseek");
  const llmEntry = await provider.generateWordEntry(wordName);

  // Phase 2: V4 Flash 生成核心义 SVG（仅当有物理意象描述时）
  let coreImageSvg = "";
  const imageDesc = String(llmEntry.physical_image_description ?? "");
  if (imageDesc !== "" && provider.regenerateImage) {
    try {
      coreImageSvg = await provider.regenerateImage(wordName, imageDesc);
    } catch (err) {
      console.warn(`[AI] SVG generation failed for "${wordName}", continuing without SVG:`, err);
    }
  }

  // 映射并合并结果（不持久化，由用户确认后手动保存）
  const wordData = mapLLMEntryToWordData(wordName, llmEntry);
  wordData.coreImageSvg = coreImageSvg;

  const elapsedMs = Date.now() - startedAt;
  console.log(`[AI] Generated entry for "${wordName}" in ${elapsedMs}ms (not persisted)`);

  return wordData;
}

/**
 * 仅重新生成核心义 SVG 图片 — 使用 V4 Pro 获得更好的视觉质量。
 *
 * @param wordName 单词名
 * @param physicalImageDescription 物理意象中文描述
 */
export async function regenerateImage(
  wordName: string,
  physicalImageDescription: string,
): Promise<{ coreImageSvg: string }> {
  const provider = createLLMProvider("deepseek");

  if (!provider.regenerateImage) {
    throw new AppError(
      501,
      "NOT_IMPLEMENTED",
      "当前 LLM Provider 不支持图片再生功能"
    );
  }

  const startedAt = Date.now();
  const svg = await provider.regenerateImage(wordName, physicalImageDescription);
  const elapsedMs = Date.now() - startedAt;
  console.log(`[AI] Regenerated SVG for "${wordName}" in ${elapsedMs}ms`);

  return { coreImageSvg: svg };
}
