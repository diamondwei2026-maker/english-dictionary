import { AppError } from "../utils/errors";

/**
 * LLM 返回的词条结构化数据（snake_case，匹配 AI 响应 JSON）
 */
export interface LLMWordEntry {
  physical_image: string;
  physical_image_description: string;
  core_meaning: string;
  core_example_en: string;
  core_example_zh: string;
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
 * LLM Provider 统一接口
 */
export interface LLMProvider {
  readonly name: string;
  generateWordEntry(wordName: string): Promise<LLMWordEntry>;
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
      // 动态 import 避免循环依赖，确保 config 已初始化
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { DeepSeekProvider } = require("./deepseek");
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
