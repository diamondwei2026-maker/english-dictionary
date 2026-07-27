import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { validateGenerateWordInput } from "../validators/ai.validator.js";
import * as aiService from "../services/ai.service.js";
import * as aiStreamService from "../services/ai-stream.service.js";
import type { SSEChunk } from "../providers/llm.js";

/**
 * POST /api/v1/words/generate
 *
 * AI 词条生成 — 仅管理员可调用。
 * Query 参数: ?force=true 强制重新生成已存在的单词。
 */
export const generate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const input = validateGenerateWordInput(req.body);
    const force = req.query.force === "true";

    const wordData = await aiService.generateWord(input.wordName, input.wordbankId, {
      force,
    });

    // 不持久化，始终返回 200
    res.status(200).json(wordData);
  }
);

/**
 * POST /api/v1/words/generate/stream
 *
 * SSE 流式 AI 词条生成 — 仅管理员可调用。
 * Query 参数: ?force=true 强制重新生成已存在的单词。
 *
 * Response: text/event-stream
 * 事件序列: thinking → content* → done | error
 */
export const generateStream = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // SSE 事件写入辅助
    const sendEvent = (chunk: SSEChunk): void => {
      const lines = [
        `event: ${chunk.event}`,
        `data: ${JSON.stringify(chunk.data)}`,
        "", // SSE 分隔空行
      ];
      res.write(lines.join("\n"));
    };

    // 1. 校验输入（在设置 SSE headers 之前，校验失败仍返回普通 JSON 错误）
    const input = validateGenerateWordInput(req.body);
    const force = req.query.force === "true";

    try {
      // 2. 设置 SSE Headers
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // 禁用 nginx/Render 反向代理缓冲
      });

      // 3. 客户端断开连接时取消 LLM 请求
      req.on("close", () => {
        if (!res.writableEnded) {
          res.end();
        }
      });

      // 4. 迭代 AsyncGenerator，逐事件推送
      for await (const chunk of aiStreamService.generateWordStream(
        input.wordName,
        input.wordbankId,
        { force }
      )) {
        sendEvent(chunk);
      }
    } catch (err) {
      // 校验失败或未预期的错误，转为 SSE error 事件
      if (err instanceof AppError) {
        sendEvent({
          event: "error",
          data: { code: err.code, message: err.message },
        });
      } else {
        console.error("[AI Controller] Unexpected SSE error:", err);
        sendEvent({
          event: "error",
          data: { code: "INTERNAL_ERROR", message: "服务器内部错误" },
        });
      }
    } finally {
      // 5. 确保连接关闭
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
);

/**
 * POST /api/v1/words/regenerate-image
 *
 * AI 核心义图 SVG 再生 — 仅管理员可调用。
 * 仅根据物理意象描述重新生成 SVG 图片，不重新分析词条。
 */
export const regenerateImage = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { wordName, physicalImageDescription } = req.body as Record<string, unknown>;

    if (!wordName || typeof wordName !== "string" || wordName.trim().length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "单词名不能为空");
    }
    if (!physicalImageDescription || typeof physicalImageDescription !== "string") {
      throw new AppError(400, "VALIDATION_ERROR", "物理意象描述不能为空");
    }

    const result = await aiService.regenerateImage(
      wordName.trim(),
      physicalImageDescription,
    );

    res.status(200).json(result);
  }
);
