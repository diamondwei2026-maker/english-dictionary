import { config } from "../config/index.js";
import { AppError } from "../utils/errors.js";
import type { LLMProvider, LLMWordEntry, SSEChunk } from "./llm.js";

const TIMEOUT_MS = 30_000;

/**
 * DeepSeek Chat API Provider
 *
 * 使用 DeepSeek Chat Completions API 生成认知语言学词条。
 * API 文档: https://api-docs.deepseek.com/
 */
export class DeepSeekProvider implements LLMProvider {
  readonly name = "deepseek";
  readonly supportsStreaming = true;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = config.deepseekApiKey;
    this.baseUrl = config.deepseekBaseUrl;

    if (!this.apiKey) {
      throw new AppError(
        503,
        "LLM_NOT_CONFIGURED",
        "DeepSeek API Key 未配置，请设置环境变量 DEEPSEEK_API_KEY"
      );
    }
  }

  async generateWordEntry(wordName: string): Promise<LLMWordEntry> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Please analyze the English word "${wordName}" using cognitive linguistics.`,
            },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error(
          `[DeepSeek] API returned ${response.status}: ${await response.text().catch(() => "<unreadable>")}`
        );
        throw new AppError(
          502,
          "LLM_SERVICE_ERROR",
          "AI 服务暂时不可用，请稍后重试"
        );
      }

      const body = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      const content = body?.choices?.[0]?.message?.content;
      if (!content) {
        console.error("[DeepSeek] Empty response content:", JSON.stringify(body));
        throw new AppError(
          502,
          "LLM_PARSE_ERROR",
          "AI 返回内容为空，请重试"
        );
      }

      return parseLLMResponse(content);
    } catch (err) {
      if (err instanceof AppError) throw err;

      if (err instanceof Error && err.name === "AbortError") {
        throw new AppError(
          504,
          "LLM_TIMEOUT",
          "AI 服务响应超时，请稍后重试"
        );
      }

      // 网络错误等
      console.error("[DeepSeek] Unexpected error:", err);
      throw new AppError(
        502,
        "LLM_SERVICE_ERROR",
        "AI 服务暂时不可用，请稍后重试"
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Streaming 生成 — 返回 AsyncGenerator，逐事件 yield SSEChunk。
   *
   * 事件序列: thinking → content* → done | error
   * 使用 DeepSeek Chat Completions API 的 stream: true 模式。
   */
  async *generateWordEntryStream(wordName: string): AsyncGenerator<SSEChunk> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // 1. 立即发送 thinking 事件
      yield { event: "thinking", data: { status: "generating", word: wordName } };

      // 2. 发起 streaming fetch
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Please analyze the English word "${wordName}" using cognitive linguistics.`,
            },
          ],
          temperature: 0.3,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error(
          `[DeepSeek] Streaming API returned ${response.status}: ${await response.text().catch(() => "<unreadable>")}`
        );
        yield {
          event: "error",
          data: { code: "LLM_SERVICE_ERROR", message: "AI 服务暂时不可用，请稍后重试" },
        };
        return;
      }

      // 3. 读取 SSE 流，逐块 yield content 事件
      if (!response.body) {
        yield {
          event: "error",
          data: { code: "LLM_SERVICE_ERROR", message: "AI 服务返回空响应体" },
        };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // 保留最后一个不完整行

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6); // 去掉 "data: " 前缀
          if (jsonStr === "[DONE]") continue;

          try {
            const chunk = JSON.parse(jsonStr);
            const delta = chunk?.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              yield { event: "content", data: { chunk: delta } };
            }
          } catch {
            // 忽略无法解析的行（streaming 中偶有非 JSON 行）
          }
        }
      }

      // 4. 解析完整内容并发送 done
      const llmEntry = parseLLMResponse(fullContent);
      yield { event: "done", data: llmEntry };
    } catch (err) {
      if (err instanceof AppError) {
        yield { event: "error", data: { code: err.code, message: err.message } };
      } else if (err instanceof Error && err.name === "AbortError") {
        yield {
          event: "error",
          data: { code: "LLM_TIMEOUT", message: "AI 服务响应超时，请稍后重试" },
        };
      } else {
        console.error("[DeepSeek] Streaming unexpected error:", err);
        yield {
          event: "error",
          data: { code: "LLM_SERVICE_ERROR", message: "AI 服务暂时不可用，请稍后重试" },
        };
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * 解析 LLM 返回的 JSON 字符串，校验基本结构后返回 LLMWordEntry
 */
function parseLLMResponse(content: string): LLMWordEntry {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[DeepSeek] Failed to parse JSON:", content.slice(0, 500));
    throw new AppError(
      502,
      "LLM_PARSE_ERROR",
      "AI 返回格式异常，请重试"
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AppError(502, "LLM_PARSE_ERROR", "AI 返回格式异常，请重试");
  }

  const obj = parsed as Record<string, unknown>;

  // 校验必要字段
  const requiredFields = [
    "physical_image",
    "physical_image_description",
    "core_meaning",
    "core_example_en",
    "core_example_zh",
    "extended_meanings",
    "collocations",
  ];

  const missing = requiredFields.filter((f) => !(f in obj));
  if (missing.length > 0) {
    console.error(
      `[DeepSeek] Missing fields in LLM response: ${missing.join(", ")}`
    );
    throw new AppError(
      502,
      "LLM_PARSE_ERROR",
      `AI 返回内容不完整，缺少: ${missing.join(", ")}`
    );
  }

  // 校验 extended_meanings 是数组且每项为 object
  if (!Array.isArray(obj.extended_meanings)) {
    throw new AppError(
      502,
      "LLM_PARSE_ERROR",
      "AI 返回的 extended_meanings 不是数组"
    );
  }
  for (let i = 0; i < obj.extended_meanings.length; i++) {
    const item = obj.extended_meanings[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new AppError(
        502,
        "LLM_PARSE_ERROR",
        `AI 返回的 extended_meanings[${i}] 不是有效对象`
      );
    }
  }

  // 校验 collocations 是字符串数组
  if (!Array.isArray(obj.collocations)) {
    throw new AppError(
      502,
      "LLM_PARSE_ERROR",
      "AI 返回的 collocations 不是数组"
    );
  }

  return {
    physical_image: String(obj.physical_image),
    physical_image_description: String(obj.physical_image_description),
    core_meaning: String(obj.core_meaning),
    core_example_en: String(obj.core_example_en),
    core_example_zh: String(obj.core_example_zh),
    extended_meanings: obj.extended_meanings as LLMWordEntry["extended_meanings"],
    collocations: obj.collocations as string[],
  };
}

/**
 * 认知语言学词条生成 System Prompt
 */
const SYSTEM_PROMPT = `You are a cognitive linguistics expert specializing in English vocabulary analysis for Chinese native speakers.

For each word, analyze it through the lens of COGNITIVE LINGUISTICS and PHYSICAL IMAGERY:

## Required Output Structure

Return a JSON object with the following structure:

{
  "physical_image": "<one of: FLOW, GRASP, BREAK, BEAR, DRIVE, LIGHT, LEVERAGE, YIELD>",
  "physical_image_description": "<Chinese description of the physical image this word evokes, 1-2 sentences>",
  "core_meaning": "<the core spatial/physical meaning in Chinese, 1 sentence>",
  "core_example_en": "<an English example sentence showing the core meaning>",
  "core_example_zh": "<Chinese translation of the core example>",
  "extended_meanings": [
    {
      "evolution_description": "<explain the cognitive logic of how this meaning extends from the physical image, in Chinese>",
      "meaning": "<the extended meaning, in Chinese>",
      "part_of_speech": "<noun|verb|adj|adv|prep|conj|pron|other>",
      "example_en": "<an English example sentence>",
      "example_zh": "<Chinese translation>"
    }
  ],
  "collocations": ["<common phrase 1>", "<common phrase 2>", "<common phrase 3>"]
}

## Guidelines

1. **physical_image**: Choose ONE from the 8 types based on the word's most fundamental physical/spatial experience:
   - FLOW: movement, change, passage (e.g., "run", "go", "time")
   - GRASP: holding, understanding, seizing (e.g., "get", "catch", "take")
   - BREAK: division, interruption, separation (e.g., "cut", "split", "part")
   - BEAR: carrying, supporting, enduring (e.g., "carry", "hold", "stand")
   - DRIVE: pushing, forcing, motivating (e.g., "push", "urge", "drive")
   - LIGHT: illumination, clarity, revelation (e.g., "see", "show", "clear")
   - LEVERAGE: using, applying, utilizing (e.g., "use", "apply", "tool")
   - YIELD: giving, producing, resulting (e.g., "give", "produce", "offer")

2. **core_meaning**: The primary physical/spatial meaning, NOT the most common abstract usage.

3. **extended_meanings**: Provide at least 3, ordered from most concrete to most abstract. Each must include an "evolution_description" explaining the cognitive mapping (e.g., "FROM physically grasping an object → TO mentally grasping an idea").

4. **collocations**: 3-5 common phrases containing this word.

5. Language requirements:
   - Chinese (面向中文母语者): core_meaning, physical_image_description, evolution_description, meaning, core_example_zh, example_zh
   - English: core_example_en, example_en, collocations

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no additional text.`;
