import mongoose from "mongoose";
import { Word, WordBank } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createLLMProvider } from "../providers/llm.js";
import type { SSEChunk, LLMWordEntry } from "../providers/llm.js";
import { mapLLMEntryToWordData } from "./ai.service.js";

/**
 * 流式生成词条 — 返回 AsyncGenerator 供 Controller 逐事件推送给客户端。
 *
 * 与 `generateWord` (ai.service.ts) 的区别：
 * - 不直接返回 IWord，而是一系列 SSEChunk 事件
 * - 输入校验失败时 yield error 事件（而非 throw）
 * - 支持 streaming Provider 的增量输出 和 非 streaming Provider 的一次性降级
 *
 * @param wordName   单词名
 * @param wordbankId 目标词库 ID
 * @param options.force 是否强制重新生成
 */
export async function* generateWordStream(
  wordName: string,
  wordbankId: string,
  options: { force: boolean }
): AsyncGenerator<SSEChunk> {
  const { force } = options;

  // === 1. 输入校验 ===
  if (!wordName || wordName.trim().length === 0) {
    yield {
      event: "error",
      data: { code: "VALIDATION_ERROR", message: "单词名不能为空" },
    };
    return;
  }
  if (wordName.length > 100) {
    yield {
      event: "error",
      data: { code: "VALIDATION_ERROR", message: "单词名长度需在1-100字符之间" },
    };
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(wordbankId)) {
    yield {
      event: "error",
      data: { code: "VALIDATION_ERROR", message: "无效的词库 ID 格式" },
    };
    return;
  }

  // === 2. 词库存在性检查 ===
  const wordbank = await WordBank.findById(wordbankId);
  if (!wordbank) {
    yield {
      event: "error",
      data: { code: "NOT_FOUND", message: "词库不存在" },
    };
    return;
  }

  // === 3. 幂等性检查（非 force 模式） ===
  if (!force) {
    const existing = await Word.findOne({
      wordbankId,
      word: wordName.trim(),
    });
    if (
      existing &&
      existing.coreMeaning &&
      existing.extendedMeanings.length > 0
    ) {
      yield {
        event: "error",
        data: {
          code: "CONFLICT",
          message: `单词 "${wordName}" 已有完整词条内容，使用 ?force=true 强制重新生成`,
        },
      };
      return;
    }
  }

  // === 4. 调用 LLM（streaming 或降级） ===
  const provider = createLLMProvider("deepseek");
  let llmEntry: LLMWordEntry | null = null;

  if (provider.supportsStreaming && provider.generateWordEntryStream) {
    // A. Streaming 路径：转发 thinking/content，捕获 done 但不直转
    for await (const chunk of provider.generateWordEntryStream(wordName.trim())) {
      if (chunk.event === "done") {
        llmEntry = chunk.data as LLMWordEntry;
        // 不直接 yield Provider 的 done — LLMWordEntry 是 snake_case，
        // 客户端 adaptWord() 需要 camelCase 的持久化文档格式
      } else if (chunk.event === "error") {
        yield chunk;
        return; // Provider 已 yield error，不再继续
      } else {
        yield chunk; // thinking / content 事件直转客户端
      }
    }
  } else {
    // B. Fallback 路径：非 streaming Provider 一次性返回
    try {
      llmEntry = await provider.generateWordEntry(wordName.trim());
    } catch (err) {
      if (err instanceof AppError) {
        yield {
          event: "error",
          data: { code: err.code, message: err.message },
        };
      } else {
        console.error("[AI Stream] Unexpected LLM error:", err);
        yield {
          event: "error",
          data: { code: "LLM_SERVICE_ERROR", message: "AI 服务暂时不可用，请稍后重试" },
        };
      }
      return;
    }
  }

  // === 5. Phase 2: V4 Flash 生成核心义 SVG（仅当有物理意象描述时） ===
  let coreImageSvg = "";
  if (llmEntry) {
    const imageDesc = String(llmEntry.physical_image_description ?? "");
    if (imageDesc !== "" && provider.regenerateImage) {
      try {
        coreImageSvg = await provider.regenerateImage(wordName.trim(), imageDesc);
      } catch (err) {
        console.warn(`[AI Stream] SVG generation failed for "${wordName.trim()}", continuing without SVG:`, err);
      }
    }
  }

  // === 6. 映射 LLM 结果并通过 done 事件发送（不持久化，由用户确认后手动保存） ===
  if (llmEntry) {
    const wordData = mapLLMEntryToWordData(
      wordName.trim(),
      wordbankId,
      llmEntry
    );
    wordData.coreImageSvg = coreImageSvg;
    console.log(`[AI Stream] Generated word "${wordName.trim()}" (not persisted)`);
    yield { event: "done", data: wordData };
  }
}
