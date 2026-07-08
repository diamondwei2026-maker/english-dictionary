# Coding Prompt — Task 4.2: SSE 流式响应支持

> 关联设计: [task.md](./task.md) | [test-cases.md](./test-cases.md)

---

## 1. 任务目标

为 AI 词条生成增加 `POST /api/v1/words/generate/stream` SSE 端点，让前端能实时看到 LLM 生成进度（逐块输出），替代当前的纯等待模式。同时扩展 LLM Provider 接口以支持 streaming，并为不支持的 Provider 提供降级方案。

---

## 2. 技术上下文

- **语言/运行时**: TypeScript + Node.js 18+（Express 4.21）
- **Provider**: DeepSeek Chat API（`/v1/chat/completions`，支持 `stream: true`）
- **规范约束**: ADR 分层架构（Controller → Service → Provider）；RESTful + SSE
- **认证**: `authMiddleware` + `adminMiddleware`（与现有 `/words/generate` 一致）

### 涉及文件

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `server/src/services/ai-stream.service.ts` | SSE 流式生成服务 |
| 修改 | `server/src/providers/llm.ts` | LLMProvider 接口扩展（streaming） |
| 修改 | `server/src/providers/deepseek.ts` | DeepSeek streaming 实现 |
| 修改 | `server/src/controllers/ai.controller.ts` | 新增 `generateStream` handler |
| 修改 | `server/src/routes/ai.routes.ts` | 注册新 SSE 路由 |

---

## 3. 实现要求

### 3.1 (修改) `server/src/providers/llm.ts` — 接口扩展

**修改位置**: `LLMProvider` 接口 & `createLLMProvider` 工厂

**新增内容**:

```typescript
// SSE 事件数据载体——从 Provider 层输出到 Service 层
export interface SSEChunk {
  event: "thinking" | "content" | "done" | "error";
  data: unknown;
}

export interface LLMProvider {
  readonly name: string;
  readonly supportsStreaming: boolean; // ← 新增属性
  generateWordEntry(wordName: string): Promise<LLMWordEntry>;
  // 可选：streaming 方法，不支持 streaming 的 Provider 不实现
  generateWordEntryStream?(wordName: string): AsyncGenerator<SSEChunk>;
}
```

**注意**:
- `supportsStreaming` 必须是同步属性（`boolean`），不要用异步检测
- `generateWordEntryStream` 用 `?` 标记可选——降级逻辑在 Service 层处理

---

### 3.2 (修改) `server/src/providers/deepseek.ts` — Streaming 实现

**修改位置**: `DeepSeekProvider` 类

**新增内容**:

1. **`supportsStreaming`** = `true`（DeepSeek API 原生支持 `stream: true`）

2. **`generateWordEntryStream` 方法** — AsyncGenerator 实现：

```typescript
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
        messages: [/* 复用现有 system + user messages */],
        temperature: 0.3,
        stream: true, // ← 关键：开启 streaming
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      // 非 200 → error 事件
      yield { event: "error", data: { code: "LLM_SERVICE_ERROR", message: "AI 服务暂时不可用，请稍后重试" } };
      return;
    }

    // 3. 读取 SSE 流，逐块 yield content 事件
    const reader = response.body!.getReader();
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

    // 4. 解析完整内容，校验结构，发送 done
    const llmEntry = parseLLMResponse(fullContent);
    yield { event: "done", data: llmEntry };

  } catch (err) {
    // 5. 错误处理 → error 事件
    if (err instanceof Error && err.name === "AbortError") {
      yield { event: "error", data: { code: "LLM_TIMEOUT", message: "AI 服务响应超时，请稍后重试" } };
    } else if (!(err instanceof AppError)) {
      yield { event: "error", data: { code: "LLM_SERVICE_ERROR", message: "AI 服务暂时不可用，请稍后重试" } };
    } else {
      yield { event: "error", data: { code: (err as AppError).code, message: (err as AppError).message } };
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**关键细节**:
- **Buffer 处理**: SSE 流的分行处理用 `buffer` 变量暂存不完整行。DeepSeek SSE 格式为 `data: {...}\n\n`
- **`[DONE]` 标记**: DeepSeek 流结束时会发 `data: [DONE]`，需跳过
- **System Prompt**: 复用现有 `SYSTEM_PROMPT` 常量，不要复制
- **`parseLLMResponse`**: 复用现有函数（已校验 requiredFields + extended_meanings/collocations 数组）
- **超时**: 复用现有 `TIMEOUT_MS`（30000ms）
- **AbortController**: 连接中断时 `reader` 的 `read()` 会 reject，catch 中判断 `AbortError`

---

### 3.3 (新建) `server/src/services/ai-stream.service.ts` — 流式服务

**职责**: 编排 streaming 流程——校验输入、调用 Provider、降级处理、映射结果、存储

```typescript
import mongoose from "mongoose";
import { Word, WordBank, IWord } from "../models";
import { AppError } from "../utils/errors";
import { createLLMProvider, SSEChunk, LLMWordEntry } from "../providers/llm";

/**
 * 流式生成词条——返回 AsyncGenerator 供 Controller 消费。
 * 与 `generateWord` 的区别：不返回 IWord，而是一系列 SSEChunk 事件。
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
    yield { event: "error", data: { code: "VALIDATION_ERROR", message: "单词名不能为空" } };
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(wordbankId)) {
    yield { event: "error", data: { code: "VALIDATION_ERROR", message: "无效的词库 ID 格式" } };
    return;
  }

  // === 2. 词库存在性检查 ===
  const wordbank = await WordBank.findById(wordbankId);
  if (!wordbank) {
    yield { event: "error", data: { code: "NOT_FOUND", message: "词库不存在" } };
    return;
  }

  // === 3. 幂等性检查（非 force） ===
  if (!force) {
    const existing = await Word.findOne({ wordbankId, word: wordName.trim() });
    if (existing && existing.coreMeaning && existing.extendedMeanings.length > 0) {
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
    // A. Streaming 路径：逐事件转发
    for await (const chunk of provider.generateWordEntryStream(wordName.trim())) {
      yield chunk;
      if (chunk.event === "done") {
        llmEntry = chunk.data as LLMWordEntry;
      }
      if (chunk.event === "error") {
        return; // Provider 已 yield error，直接结束
      }
    }
  } else {
    // B. Fallback 路径：非 streaming Provider 降级
    try {
      llmEntry = await provider.generateWordEntry(wordName.trim());
      yield { event: "done", data: llmEntry };
    } catch (err) {
      if (err instanceof AppError) {
        yield { event: "error", data: { code: err.code, message: err.message } };
      } else {
        yield { event: "error", data: { code: "LLM_SERVICE_ERROR", message: "AI 服务暂时不可用" } };
      }
      return;
    }
  }

  // === 5. 存储结果（异步，不阻塞 SSE 流） ===
  if (llmEntry) {
    try {
      const wordData = mapLLMEntryToWordData(wordName.trim(), wordbankId, llmEntry);
      await Word.findOneAndUpdate(
        { wordbankId, word: wordName.trim() },
        { $set: wordData },
        { new: true, upsert: true, runValidators: true }
      );
    } catch (err) {
      console.error("[AI Stream] Failed to persist generated word:", err);
      // 存储失败不重新 yield error——done 已经发了
    }
  }
}
```

**关键设计决策**:

- **`mapLLMEntryToWordData` 复用**: 从 `ai.service.ts` 中提取为共享工具函数（或直接在 `ai-stream.service.ts` 中 import）——如果原函数未 export，需在 `ai.service.ts` 中 `export` 它
- **输入校验前置**: 在 Service 层校验（而非全在 Controller），因为 streaming 下校验失败也需要通过 SSE error 事件返回
- **存储容错**: llmEntry 持久化失败不阻塞已发出的 `done` 事件——前端已收到完整词条数据
- **`generateWordStream` vs `generateWord`**: 两者不互相调用，保持独立；它们共享 `mapLLMEntryToWordData` 工具函数

**⚠️ 对 `server/src/services/ai.service.ts` 的微调**: 将 `mapLLMEntryToWordData` 函数改为 `export`：

```typescript
// 从
function mapLLMEntryToWordData(...)
// 改为
export function mapLLMEntryToWordData(...)
```

---

### 3.4 (修改) `server/src/controllers/ai.controller.ts` — SSE Handler

**新增内容**: 在 `generate` handler 之后添加 `generateStream` handler

```typescript
import { SSEChunk } from "../providers/llm";

/**
 * POST /api/v1/words/generate/stream
 *
 * SSE 流式 AI 词条生成 — 仅管理员可调用。
 * Query 参数: ?force=true 强制重新生成已存在的单词。
 *
 * Response: text/event-stream
 * 事件类型: thinking → content* → done | error
 */
export const generateStream = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // 1. 校验输入（复用现有 validator——校验失败会 throw，自动转为 error 事件）
    const input = validateGenerateWordInput(req.body);
    const force = req.query.force === "true";

    // 2. 设置 SSE Headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",   // 禁用 nginx 缓冲（部署在反向代理后时有意义）
    });

    // 3. 发送 SSE 事件的辅助函数
    const sendEvent = (chunk: SSEChunk): void => {
      const lines = [
        `event: ${chunk.event}`,
        `data: ${JSON.stringify(chunk.data)}`,
        "",  // SSE 分隔空行
      ];
      res.write(lines.join("\n"));
    };

    // 4. 迭代 AsyncGenerator，逐事件推送
    try {
      for await (const chunk of aiStreamService.generateWordStream(
        input.wordName,
        input.wordbankId,
        { force }
      )) {
        sendEvent(chunk);
      }
    } finally {
      // 5. 确保连接关闭
      res.end();
    }
  }
);
```

**关键细节**:
- **`writeHead` 而非 `setHeader`**: SSE 协议要求 `200` + stream 模式，`writeHead` 一次性设置避免后续 `setHeader` 报错
- **`X-Accel-Buffering: no`**: Render/Nginx 反向代理默认缓冲，此 header 禁用——生产部署关键
- **`res.write` 行尾**: SSE 规范要求 `\n`（LF），Express 内部已正确处理
- **`finally` 中 `res.end()`**: 无论正常结束还是中途异常（包括客户端断开），确保连接释放
- **与现有 `validateGenerateWordInput` 兼容**: 校验失败会 throw `AppError`，但 SSE 模式下不能通过 `errorHandler` 中间件处理——需要在 `generateStream` 顶层 try-catch，转为 SSE error 事件后 `res.end()`

**⚠️ 特殊错误处理——Validator 抛出的 AppError 转 SSE error 事件**:

在 `generateStream` 的 try-catch 中增加顶层兜底：

```typescript
try {
  const input = validateGenerateWordInput(req.body);
  // ... rest
} catch (err) {
  if (err instanceof AppError) {
    sendEvent({ event: "error", data: { code: err.code, message: err.message } });
  } else {
    sendEvent({ event: "error", data: { code: "INTERNAL_ERROR", message: "服务器内部错误" } });
  }
  res.end();
}
```

将 validate+设置 headers 的逻辑包在 try-catch 内，非生成过程的错误也以 SSE error 事件形式返回。

---

### 3.5 (修改) `server/src/routes/ai.routes.ts` — 注册路由

**修改内容**: 在现有路由后新增 SSE 端点

```typescript
// 现有路由
router.post("/words/generate", authMiddleware, adminMiddleware, aiController.generate);

// 新增：SSE 流式生成
router.post("/words/generate/stream", authMiddleware, adminMiddleware, aiController.generateStream);
```

**注意**: 路由顺序很重要——`"/words/generate/stream"` 是固定路径，必须在 Express 中先于可能的通配路由注册。当前 `aiRoutes` 已挂载到 `/`（在 `routes/index.ts` 中 `routes.use("/", aiRoutes)` 在 `routes.use("/words", wordRoutes)` 之前），顺序没问题。

---

## 4. Provider 端 SSE 格式参考

DeepSeek streaming 响应的原始格式（每行一个 SSE 帧）：

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1720000000,"model":"deepseek-chat","choices":[{"index":0,"delta":{"content":"FLOW"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1720000000,"model":"deepseek-chat","choices":[{"index":0,"delta":{"content":"\n\n"},"finish_reason":null}]}

data: [DONE]
```

- `delta.content` 即增量文本块
- 流结束标志为 `data: [DONE]`
- `finish_reason` 在最后一块为 `"stop"`
- 不需要校验 `finish_reason`，只累加 `delta.content` 即可

---

## 5. 代码规范要求

- **命名**: 函数用 camelCase，接口/类用 PascalCase，文件用 kebab-case
- **异步**: 使用 `async/await` + `for await...of`（不直接用 Promise.then）
- **错误处理**: 业务错误用 `AppError`（from `../utils/errors`），SSE 中转为 error 事件；编程错误由 `asyncHandler` 兜底
- **日志**: Streaming 路径中的异常用 `console.error` 记录（带 `[AI Stream]` 前缀）
- **类型安全**: 禁止 `any`，未知类型用 `unknown` + 类型守卫
- **不要引入新依赖**: Express 原生支持 SSE（`res.write` / `res.end`），不需要 `express-sse` 等第三方包
- **复用现有代码**: `SYSTEM_PROMPT`、`parseLLMResponse`、`TIMEOUT_MS` 从 `deepseek.ts` 导出复用（如当前未 export，请改为 export）
- **导入 `ai-stream.service.ts` 时命名**: `import * as aiStreamService from "../services/ai-stream.service"`

---

## 6. 测试映射

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 测试用例 | 覆盖要求 |
|----------|---------|
| TC-001 | SSE Content-Type + Cache-Control + Connection headers 正确 |
| TC-002 | thinking → content → done 事件序列完整 |
| TC-003 | 无 Token → 401（普通 JSON，非 SSE） |
| TC-004 | 非 Admin → 403 |
| TC-005 | SSE 事件格式 `event:\ndata:\n\n` 符合 RFC |
| TC-006 | streaming 模式产生多个 content chunk |
| TC-007 | thinking 在 content 之前 |
| TC-008 | 长单词大响应不截断 |
| TC-009 | 非 streaming Provider 降级：仅一个 done 事件 |
| TC-010 | 降级数据字段与非流式接口一致 |
| TC-011 | 空 wordName → SSE error 事件 |
| TC-012 | 无效 wordbankId → SSE error 事件 |
| TC-013 | LLM API 故障 → SSE error 事件 |
| TC-014 | 客户端断开 → 服务端不崩溃 |
| TC-015 | LLM 超时 → SSE error 事件 |
| TC-016 | 100 字符单词名正常处理 |
| TC-017 | 并发 3 连接独立隔离 |
| TC-018 | 多义词大响应完整输出 |

---

## 7. 注意事项

- **`res.writeHead` vs `res.setHeader`**: SSE 场景必须用 `writeHead`——一旦调用 `res.write()` 后 `setHeader` 会抛异常
- **客户端断开检测**: 用 `req.on("close", () => { ... })` 触发 AbortController.abort()，确保 LLM 请求也被取消，避免浪费 Token
- **不要缓冲 SSE 输出**: Express 默认不缓冲（无 compression），但如果未来加了 `compression` 中间件，需要对 `/stream` 端点禁用压缩
- **DeepSeek `response_format` 与 `stream` 冲突**: DeepSeek 在 `stream: true` 时可能不支持 `response_format: { type: "json_object" }`——需要改为在 System Prompt 中强调"返回 JSON"，并在 `parseLLMResponse` 中做容错解析（如果流式输出中混入 markdown code fence）
- **异步生成器错误传播**: `for await...of` 循环中如果 generator 内部 throw，异常会传播到循环外——确保 Provider 内部的 catch 将所有错误转为 `yield { event: "error" }`
- **内存管理**: streaming 模式下 `fullContent` 变量会累积完整 LLM 输出（用于最终 `parseLLMResponse`）——对于正常长度（<10KB）的 JSON 完全没问题；万一 LLM 异常输出超长文本，`parseLLMResponse` 中的 JSON.parse 会因截断而失败，此时 yield error 事件即可

---

## 8. 验收自检清单

完成后逐项确认：

- [ ] `POST /api/v1/words/generate/stream` 可访问，返回 `200` + `content-type: text/event-stream`
- [ ] cURL / 浏览器可看到逐行 SSE 输出
- [ ] `thinking` 事件最先触发
- [ ] 多个 `content` 事件包含增量 chunk
- [ ] `done` 事件 data 为完整词条 JSON（与 `/words/generate` 结构一致）
- [ ] 强制生成 `?force=true` 生效
- [ ] 无效输入返回 `event: error`（而非 400 JSON）
- [ ] 客户端断开连接不导致服务端崩溃
- [ ] 未 Token / 非管理员返回 401/403（普通 JSON，不进 SSE）
- [ ] 不使用 `any` 类型
- [ ] 无新增 npm 依赖
- [ ] 不破坏现有 `/words/generate` 功能
