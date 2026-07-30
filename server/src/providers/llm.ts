import { AppError } from "../utils/errors.js";
import { DeepSeekProvider } from "./deepseek.js";

/**
 * LLM 返回的词条结构化数据（snake_case，匹配 AI 响应 JSON）
 */
export interface LLMWordEntry {
  phonetic: string;
  physical_image: string;
  physical_image_description: string;
  core_meaning: string;
  core_example_en: string;
  core_example_zh: string;
  core_image_svg?: string;
  extended_meanings: Array<{
    evolution_description: string;
    meaning: string;
    part_of_speech: string;
    example_en: string;
    example_zh: string;
  }>;
  collocations: string[];
}

/**
 * SSE 流式响应的单个事件载体
 *
 * 事件类型:
 * - thinking: LLM 开始处理，data 为 { status, word }
 * - content:  增量文本块，data 为 { chunk }
 * - done:     生成完成，data 为完整的 LLMWordEntry
 * - error:    生成失败，data 为 { code, message }
 */
export interface SSEChunk {
  event: "thinking" | "content" | "done" | "error";
  data: unknown;
}

/**
 * LLM Provider 统一接口
 *
 * 新增 supportsStreaming + generateWordEntryStream(可选) 支持流式输出。
 * 不支持 streaming 的 Provider 将 supportsStreaming 设为 false，
 * 降级逻辑由 Service 层处理。
 */
export interface LLMProvider {
  readonly name: string;
  /** Provider 是否支持流式输出（同步属性） */
  readonly supportsStreaming: boolean;
  /** 非流式生成（所有 Provider 必须实现） */
  generateWordEntry(wordName: string): Promise<LLMWordEntry>;
  /** 流式生成（可选 — 仅 supportsStreaming=true 的 Provider 实现） */
  generateWordEntryStream?(wordName: string): AsyncGenerator<SSEChunk>;
  /** 仅再生核心义 SVG 图片（可选） */
  regenerateImage?(wordName: string, physicalImageDescription: string): Promise<string>;
}

/**
 * 支持的 LLM Provider 类型
 */
export type LLMProviderType = "deepseek" | string;

/**
 * Provider 工厂 — 根据 type 创建对应 Provider 实例
 */
export function createLLMProvider(type: LLMProviderType): LLMProvider {
  switch (type) {
    case "deepseek": {
      return new DeepSeekProvider();
    }
    default:
      throw new AppError(
        500,
        "LLM_PROVIDER_UNKNOWN",
        `未知的 LLM Provider: ${type}`
      );
  }
}
