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
  private readonly proApiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = config.deepseekApiKey;
    this.proApiKey = config.deepseekProApiKey;
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
          "Authorization": `Bearer ${this.proApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-v4-pro",
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
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
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

  /**
   * 仅再生核心义 SVG 图片 — 使用 V4 Flash 保证低延迟。
   *
   * @param wordName 单词名（用于提示上下文）
   * @param physicalImageDescription 物理意象中文描述
   * @returns 安全清洗后的 SVG 字符串
   */
  async regenerateImage(
    wordName: string,
    physicalImageDescription: string
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT_SVG_ONLY },
            {
              role: "user",
              content: [
                `Word: "${wordName}"`,
                `Physical image description: ${physicalImageDescription}`,
                "",
                "Generate an SVG diagram that illustrates this word's physical image.",
              ].join("\n"),
            },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error(
          `[DeepSeek V4 Pro] SVG API returned ${response.status}: ${await response.text().catch(() => "<unreadable>")}`
        );
        throw new AppError(
          502,
          "LLM_SERVICE_ERROR",
          "AI 图片服务暂时不可用，请稍后重试"
        );
      }

      const body = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };

      const content = body?.choices?.[0]?.message?.content;
      if (!content) {
        throw new AppError(502, "LLM_PARSE_ERROR", "AI 返回内容为空，请重试");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("[DeepSeek V4 Pro] Failed to parse SVG JSON:", content.slice(0, 500));
        throw new AppError(502, "LLM_PARSE_ERROR", "AI 返回格式异常，请重试");
      }

      const obj = parsed as Record<string, unknown>;
      const rawSvg = obj?.core_image_svg;
      if (!rawSvg || typeof rawSvg !== "string") {
        throw new AppError(502, "LLM_PARSE_ERROR", "AI 未返回有效的 SVG 图片");
      }

      const svg = sanitizeSvg(rawSvg);
      if (!svg) {
        throw new AppError(502, "LLM_PARSE_ERROR", "AI 返回的 SVG 图片无效");
      }

      console.log(`[DeepSeek V4 Pro] Generated SVG for "${wordName}" (${svg.length} chars)`);
      return svg;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new AppError(504, "LLM_TIMEOUT", "AI 图片服务响应超时，请稍后重试");
      }
      console.error("[DeepSeek V4 Pro] Unexpected error:", err);
      throw new AppError(502, "LLM_SERVICE_ERROR", "AI 图片服务暂时不可用，请稍后重试");
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
    physical_image: typeof obj.physical_image === "string" ? obj.physical_image : "",
    physical_image_description: typeof obj.physical_image_description === "string" ? obj.physical_image_description : "",
    core_meaning: String(obj.core_meaning),
    core_example_en: String(obj.core_example_en),
    core_example_zh: String(obj.core_example_zh),
    extended_meanings: obj.extended_meanings as LLMWordEntry["extended_meanings"],
    collocations: obj.collocations as string[],
  };
}

/**
 * SVG 安全清洗 — 移除潜在 XSS 风险标签/属性
 */
function sanitizeSvg(raw: string): string {
  let result = raw.trim();

  // 移除 markdown 代码围栏（如果 LLM 不小心包了）
  result = result.replace(/^```(?:svg|html|xml)?\s*/i, "").replace(/\s*```$/i, "");

  // 移除 <script>...</script>
  result = result.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  // 移除 on* 事件属性
  result = result.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, "");
  result = result.replace(/\s+on\w+\s*=\s*'[^']*'/gi, "");
  // 移除 <foreignObject>...</foreignObject>
  result = result.replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject\s*>/gi, "");

  // 校验结果包含有效 SVG 标签
  if (!/<svg\b/i.test(result)) {
    console.warn("[DeepSeek] SVG sanitization failed — no valid <svg> tag found");
    return "";
  }

  return result;
}

/**
 * SVG 专用再生 System Prompt — 精简版，仅生成 SVG 图片
 */
const SYSTEM_PROMPT_SVG_ONLY = `You are an educational diagram designer for a cognitive linguistics English dictionary app for Chinese native speakers.

Given a word and its physical image description, generate a clean SVG illustration.

## Output Format

Return ONLY a JSON object:
{ "core_image_svg": "<svg>...</svg>" }

## SVG Requirements

- viewBox="0 0 400 220"
- Background rect with rx="16" rounded corners, light pastel fill
- 2-4 muted, harmonious colors — no neon, no high saturation
- Clean geometric shapes and simple line art — diagram-like (educational), NOT artistic illustration
- 1-2 Chinese labels in 10-11px sans-serif font
- Clear, uncluttered design suitable for a language learning app
- The SVG must visually represent the given physical image description

IMPORTANT: Return ONLY valid JSON. The SVG must be valid XML. No markdown fences around the SVG.`;

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

0. **Decide whether the word has a physical/spatial image schema at all**:
   - If the word's core meaning is rooted in bodily experience (action, perception, motion, force, contact with objects), choose one of the 8 types below. Provide a meaningful physical_image_description in Chinese (1-2 sentences).
   - If the word is purely functional, relational, or abstract with NO bodily-spatial grounding — prepositions that express correspondence rather than force (e.g., "for", "of"), conjunctions (e.g., "if", "because", "although"), articles, pure function words — set physical_image to "" (empty string) and physical_image_description to "" (empty string).
   - **CRITICAL**: An empty string IS the correct answer for function words. DO NOT invent a physical metaphor where none exists. Forcing a false image (e.g., classifying "for" as DRIVE) produces actively misleading pedagogy.

1. **physical_image**: Choose ONE from the 8 types based on the word's most fundamental physical/spatial experience (skip this step if the word has no physical image — see rule 0):
   - FLOW: movement, change, passage (e.g., "run", "go", "time")
   - GRASP: holding, understanding, seizing (e.g., "get", "catch", "take")
   - BREAK: division, interruption, separation (e.g., "cut", "split", "part")
   - BEAR: carrying, supporting, enduring (e.g., "carry", "hold", "stand")
   - DRIVE: pushing, forcing, motivating (e.g., "push", "urge", "drive")
   - LIGHT: illumination, clarity, revelation (e.g., "see", "show", "clear")
   - LEVERAGE: using, applying, utilizing (e.g., "use", "apply", "tool")
   - YIELD: giving, producing, resulting (e.g., "give", "produce", "offer")

2. **core_meaning**: For words with a physical image, describe the primary physical/spatial meaning — NOT the most common abstract usage. For function words without a physical image, describe the word's core relational/functional logic in Chinese (e.g., "for" = "以某事物为目标，建立朝向它的对应关联关系").

3. **extended_meanings**: Provide at least 3, ordered from most concrete to most abstract. Each must include an "evolution_description" explaining the cognitive mapping (e.g., "FROM physically grasping an object → TO mentally grasping an idea").

4. **collocations**: 3-5 common phrases containing this word.

5. Language requirements:
   - Chinese (面向中文母语者): core_meaning, physical_image_description, evolution_description, meaning, core_example_zh, example_zh
   - English: core_example_en, example_en, collocations

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no additional text.`;
