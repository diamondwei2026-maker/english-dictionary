import { request, getToken, removeToken } from "./request";
import { adaptWord } from "./adapters";
import type { Word } from "../data/types";

// ============================================================
// AI 词条生成 API 模块
// ============================================================

/** 后端单词响应格式（与 words.ts 共用结构） */
interface BackendWordResponse {
  _id: string;
  word: string;
  wordbankId: string;
  phonetic?: string;
  coreMeaning: string;
  coreExampleEn: string;
  coreExampleZh: string;
  physicalImageType: string;
  physicalImageDescription: string;
  extendedMeanings: Array<{
    _id: string;
    evolutionDescription: string;
    meaning: string;
    partOfSpeech: string;
    exampleEn: string;
    exampleZh: string;
  }>;
  collocations: string[];
}

// ============================================================
// 非流式接口
// ============================================================

/**
 * AI 词条生成 — 非流式。
 *
 * POST /api/v1/words/generate?force=true
 *
 * @param wordName   英文单词
 * @param wordbankId 所属词库 ID（24 位 hex ObjectId）
 * @param force      是否强制重新生成（已有单词传 true）
 * @returns 前端 Word 类型
 */
export async function generateWord(
  wordName: string,
  wordbankId: string,
  force = false,
): Promise<Word> {
  const query = force ? "?force=true" : "";
  const path = `/api/v1/words/generate${query}`;

  const res = await request<BackendWordResponse>(path, {
    method: "POST",
    data: { wordName, wordbankId },
  });

  return adaptWord(res);
}

// ============================================================
// 流式接口 (SSE)
// ============================================================

export interface GenerateWordStreamCallbacks {
  /** 思考阶段进度消息 */
  onThinking?: (message: string) => void;
  /** 内容字段更新，field 为字段名，value 为内容片段 */
  onContent?: (field: string, value: string) => void;
  /** 生成完成，返回完整 Word 对象 */
  onDone?: (word: Word) => void;
  /** 生成出错 */
  onError?: (code: string, message: string) => void;
}

/**
 * AI 词条生成 — SSE 流式。
 *
 * POST /api/v1/words/generate/stream?force=true
 *
 * 使用原生 fetch 读取 ReadableStream，Taro.request 不支持流式读取。
 *
 * @param wordName   英文单词
 * @param wordbankId 所属词库 ID
 * @param force      是否强制重新生成
 * @param callbacks  事件回调
 */
export async function generateWordStream(
  wordName: string,
  wordbankId: string,
  force: boolean,
  callbacks: GenerateWordStreamCallbacks,
): Promise<void> {
  const query = force ? "?force=true" : "";
  const url = `/api/v1/words/generate/stream${query}`;
  const token = getToken();

  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ wordName, wordbankId }),
    });

    // 非 200（校验失败等后端在 SSE 之前返回的普通 JSON 错误）
    // 抛出异常让调用方降级到非流式接口
    if (!response.ok) {
      let errorMsg = `请求失败 (${response.status})`;
      try {
        const errBody = await response.json();
        const apiErr = errBody?.error;
        if (apiErr?.message) errorMsg = apiErr.message;
      } catch {
        // ignore parse error
      }
      // 401 时清除 token（raw fetch 不经过 request.ts 拦截器）
      if (response.status === 401 && token) {
        removeToken();
      }
      throw new Error(errorMsg);
    }

    if (!response.body) {
      throw new Error("浏览器不支持流式读取");
    }

    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按 \n\n 分隔事件
      const parts = buffer.split("\n\n");
      // 最后一段是不完整的，保留到下一次
      buffer = parts.pop() || "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        const event = parseSSEEvent(trimmed);
        if (!event) continue;

        switch (event.type) {
          case "thinking":
            callbacks.onThinking?.(event.data?.message || "");
            break;
          case "content":
            callbacks.onContent?.(event.data?.field || "", event.data?.value || "");
            break;
          case "done": {
            const word = adaptWord(event.data as BackendWordResponse);
            callbacks.onDone?.(word);
            break;
          }
          case "error":
            callbacks.onError?.(event.data?.code || "SSE_ERROR", event.data?.message || "服务端错误");
            break;
        }
      }
    }

    // 刷新 TextDecoder 缓冲区中残留的不完整多字节字符
    buffer += decoder.decode();

    // 处理剩余 buffer（最后一条完整的 SSE 事件）
    const remaining = buffer.trim();
    if (remaining) {
      const event = parseSSEEvent(remaining);
      if (event && event.type === "done") {
        const word = adaptWord(event.data as BackendWordResponse);
        callbacks.onDone?.(word);
      } else if (event && event.type === "error") {
        callbacks.onError?.(event.data?.code || "SSE_ERROR", event.data?.message || "服务端错误");
      }
    }
  } catch (err) {
    // 传输层错误，重新抛出让调用方降级到非流式接口
    throw err;
  } finally {
    if (reader) {
      try {
        reader.cancel();
      } catch {
        // ignore cancel errors
      }
    }
  }
}

// ============================================================
// SSE 事件解析
// ============================================================

interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

function parseSSEEvent(raw: string): SSEEvent | null {
  const lines = raw.split("\n");
  let eventType = "";
  let dataStr = "";

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      eventType = line.slice(7).trim();
    } else if (line.startsWith("data: ")) {
      dataStr = line.slice(6);
    }
  }

  if (!eventType || !dataStr) return null;

  try {
    const data = JSON.parse(dataStr);
    return { type: eventType, data };
  } catch {
    return null;
  }
}
