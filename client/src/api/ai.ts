// ============================================================
// AI 词条生成 API 模块 — 与 client/src/api/ai.ts 一致
// ============================================================

import { request } from "./request";
import { getToken, removeToken } from "@/store/user";
import { adaptWord } from "./adapters";
import type { Word } from "../data/types";

interface BackendWordResponse {
  _id?: string;
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
 * POST /api/v1/words/generate
 */
export async function generateWord(
  wordName: string
): Promise<Word> {
  const res = await request<BackendWordResponse>("/api/v1/words/generate", {
    method: "POST",
    data: { wordName },
  });

  return adaptWord(res);
}

// ============================================================
// 核心义图 SVG 再生
// ============================================================

interface RegenerateImageResponse {
  coreImageSvg: string;
}

/**
 * AI 核心义图 SVG 再生 — 仅根据物理意象描述重新生成 SVG。
 * POST /api/v1/words/regenerate-image
 */
export async function regenerateImage(
  wordName: string,
  physicalImageDescription: string
): Promise<RegenerateImageResponse> {
  const res = await request<RegenerateImageResponse>("/api/v1/words/regenerate-image", {
    method: "POST",
    data: { wordName, physicalImageDescription },
  });
  return res;
}

// ============================================================
// 流式接口 (SSE)
// ============================================================

export interface GenerateWordStreamCallbacks {
  onThinking?: (message: string) => void;
  onContent?: (field: string, value: string) => void;
  onDone?: (word: Word) => void;
  onError?: (code: string, message: string) => void;
}

/**
 * AI 词条生成 — SSE 流式。
 * POST /api/v1/words/generate/stream
 *
 * H5 端使用 fetch + ReadableStream；小程序端不支持 ReadableStream，
 * 调用方应捕获异常并降级到非流式 generateWord()。
 */
export async function generateWordStream(
  wordName: string,
  callbacks: GenerateWordStreamCallbacks
): Promise<void> {
  const url = "/api/v1/words/generate/stream";
  const token = getToken();

  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ wordName }),
    });

    if (!response.ok) {
      let errorMsg = `请求失败 (${response.status})`;
      try {
        const errBody = await response.json();
        const apiErr = errBody?.error;
        if (apiErr?.message) errorMsg = apiErr.message;
      } catch {
        // ignore parse error
      }
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

      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        const event = parseSSEEvent(trimmed);
        if (!event) continue;

        const d = event.data as Record<string, any>;
        switch (event.type) {
          case "thinking":
            callbacks.onThinking?.(String(d?.message || ""));
            break;
          case "content":
            callbacks.onContent?.(
              String(d?.field || ""),
              String(d?.value || "")
            );
            break;
          case "done": {
            const word = adaptWord(d as BackendWordResponse);
            callbacks.onDone?.(word);
            break;
          }
          case "error":
            callbacks.onError?.(
              String(d?.code || "SSE_ERROR"),
              String(d?.message || "服务端错误")
            );
            break;
        }
      }
    }

    buffer += decoder.decode();

    const remaining = buffer.trim();
    if (remaining) {
      const event = parseSSEEvent(remaining);
      if (event && event.type === "done") {
        const word = adaptWord(event.data as unknown as BackendWordResponse);
        callbacks.onDone?.(word);
      } else if (event && event.type === "error") {
        const ed = event.data as Record<string, any>;
        callbacks.onError?.(
          String(ed?.code || "SSE_ERROR"),
          String(ed?.message || "服务端错误")
        );
      }
    }
  } catch (err) {
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
