# Coding Prompt — Task 4.1: AI 词条生成 API 与 LLM Provider

> 生成日期：2026-07-08

---

## 1. 任务目标

实现 `POST /api/v1/words/generate` 接口，接入 DeepSeek LLM 自动生成符合认知语言学要求的英语词条，包含物理意象、核心义、引申义链、例句和常见搭配。通过抽象 LLM Provider 层支持未来切换模型。

---

## 2. 技术上下文

- **运行时/框架**: Node.js 18+ / Express + TypeScript
- **数据库**: MongoDB Atlas（Mongoose ODM）
- **AI 服务**: DeepSeek API（`https://api.deepseek.com/v1`）
- **已有依赖**: `dotenv`, `express`, `mongoose`；无需新增 npm 包
- **涉及文件**:

| 动作 | 路径 | 说明 |
|------|------|------|
| 新建 | `server/src/providers/llm.ts` | LLM Provider 接口抽象 + 工厂函数 |
| 新建 | `server/src/providers/deepseek.ts` | DeepSeek Provider 实现 |
| 新建 | `server/src/services/ai.service.ts` | AI 生成业务逻辑（Prompt 渲染 + 调用 LLM + 结果解析 + 存储） |
| 新建 | `server/src/controllers/ai.controller.ts` | AI 生成 Controller |
| 新建 | `server/src/validators/ai.validator.ts` | 输入校验 |
| 新建 | `server/src/routes/ai.routes.ts` | 路由定义 |
| 修改 | `server/src/routes/index.ts` | 挂载 aiRoutes |
| 参考（只读） | `server/src/config/index.ts` | 已有 `deepseekApiKey` / `deepseekBaseUrl` 配置项 |
| 参考（只读） | `server/src/models/Word.ts` | Word Schema 定义 |
| 参考（只读） | `server/src/services/word.service.ts` | 服务层编码风格 |
| 参考（只读） | `server/src/controllers/word.controller.ts` | Controller 编码风格 |
| 参考（只读） | `server/src/validators/word.validator.ts` | Validator 编码风格 |

- **数据库表**: `words`（已有，由 Mongoose Word Model 管理）
- **外部依赖**: DeepSeek Chat API

---

## 3. 实现要求

### 3.1 文件 `server/src/providers/llm.ts`（新建）

**职责**: 定义 LLM Provider 统一接口和工厂函数。

**关键定义**:

```typescript
// 1. LLM 返回的词条结构化数据（snake_case，来自 AI 响应）
export interface LLMWordEntry {
  physical_image: string;             // 物理意象类型（如 "GRASP"）
  physical_image_description: string; // 物理意象描述
  core_meaning: string;               // 核心义
  core_example_en: string;            // 核心义英文例句
  core_example_zh: string;            // 核心义中文翻译
  extended_meanings: Array<{
    evolution_description: string;
    meaning: string;
    part_of_speech: string;
    example_en: string;
    example_zh: string;
  }>;
  collocations: string[];
}

// 2. Provider 接口
export interface LLMProvider {
  readonly name: string;
  generateWordEntry(wordName: string): Promise<LLMWordEntry>;
}

// 3. Provider 工厂
export type LLMProviderType = 'deepseek' | string;

export function createLLMProvider(type: LLMProviderType): LLMProvider;
```

**关键逻辑**:
1. 工厂函数根据 `type` 参数创建对应 Provider 实例
2. 目前仅需实现 `'deepseek'`；未知 type 抛出 `AppError`（500, `"LLM_PROVIDER_UNKNOWN"`）
3. `LLMWordEntry` 接口是 LLM 响应的"契约"——所有 Provider 的实现必须返回此结构

---

### 3.2 文件 `server/src/providers/deepseek.ts`（新建）

**职责**: DeepSeek API 调用实现，将 API 返回的 JSON 解析为 `LLMWordEntry`。

**关键逻辑**:
1. 构造函数从 `config` 读取 `deepseekApiKey` 和 `deepseekBaseUrl`
2. 若 `deepseekApiKey` 为空，抛出 `AppError`(503, `"LLM_NOT_CONFIGURED"`)
3. `generateWordEntry(wordName)` 方法：
   a. 使用原生 `fetch` 调用 DeepSeek Chat Completions API：`POST <deepseekBaseUrl>/chat/completions`
   b. Header: `Authorization: Bearer <apiKey>`, `Content-Type: application/json`
   c. 请求体：`model: "deepseek-chat"`, `messages` 含 system prompt 和 user prompt
   d. 设置 `temperature: 0.3`（低温度获得更稳定输出）
   e. 设置 `response_format: { type: "json_object" }`（要求 JSON 输出）
   f. 超时时间 30 秒（使用 `AbortController`）
4. **错误处理**:
   - API 不可达/网络错误 → `AppError`(502, `"LLM_SERVICE_ERROR"`)
   - API 返回非 200 → `AppError`(502, `"LLM_SERVICE_ERROR"`)，日志记录原始错误
   - 超时 → `AppError`(504, `"LLM_TIMEOUT"`)
   - 响应体不是合法 JSON → `AppError`(502, `"LLM_PARSE_ERROR"`)
5. 解析 `choices[0].message.content` 为 JSON，做基本字段校验后返回

---

### 3.3 文件 `server/src/services/ai.service.ts`（新建）

**职责**: AI 词条生成的业务逻辑层。

**导出函数**:

#### `generateWord(wordName: string, wordbankId: string, options: { force: boolean }): Promise<IWord>`

**关键逻辑**:
1. **输入校验**: 校验 `wordbankId` 为合法 ObjectId；使用 `WordBank.findById` 确认词库存在（不存在 → 404）
2. **幂等性检查**（`force !== true` 时）:
   - 使用 `Word.findOne({ wordbankId, word: wordName })` 查找
   - 若找到且该单词的 `coreMeaning`、`physicalImageDescription` 均非空，且 `extendedMeanings` 数组长度 > 0 → 视为"已有完整词条"
   - 已有完整词条 → 抛出 `AppError`(409, `"ALREADY_EXISTS"`, "该单词已有完整词条内容，使用 ?force=true 强制重新生成")
3. **调用 LLM**:
   - 通过 `createLLMProvider('deepseek')` 获取 Provider 实例
   - 调用 `provider.generateWordEntry(wordName)` 获取 `LLMWordEntry`
4. **结果映射**（snake_case → camelCase + mongoose 字段）:
   - `physicalImageType`: `llmEntry.physical_image.toLowerCase()`（如 `"GRASP"` → `"grasp"`；需要校验该值属于 `PHYSICAL_IMAGE_TYPES` 枚举，不匹配则抛 `LLM_PARSE_ERROR`）
   - `physicalImageDescription`: `llmEntry.physical_image_description`
   - `coreMeaning`: `llmEntry.core_meaning`
   - `coreExampleEn`: `llmEntry.core_example_en`
   - `coreExampleZh`: `llmEntry.core_example_zh`
   - `extendedMeanings`: 映射数组，每项校验 `partOfSpeech` 属于 `PART_OF_SPEECH_TYPES`
   - `collocations`: `llmEntry.collocations`
5. **存储**:
   - 若 `force=true` 且单词已存在：`Word.findByIdAndUpdate` 覆盖
   - 否则：`Word.create` 新建
6. **错误处理**:
   - LLM 返回 JSON 缺少必要字段 → `AppError`(502, `"LLM_PARSE_ERROR"`)
   - `physicalImageType` / `partOfSpeech` 不属于有效枚举 → `AppError`(502, `"LLM_PARSE_ERROR"`)
   - Mongoose 校验失败 → 由 `asyncHandler` 传递到全局 errorHandler
7. **日志**: 使用 `console.log` 记录生成耗时（`Date.now()` 差值），格式: `[AI] Generated entry for "${wordName}" in ${elapsedMs}ms`

---

### 3.4 文件 `server/src/controllers/ai.controller.ts`（新建）

**职责**: HTTP 请求处理，解析参数，调用 Service。

```typescript
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validateGenerateWordInput } from "../validators/ai.validator";
import * as aiService from "../services/ai.service";

export const generate = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const input = validateGenerateWordInput(req.body);
    const force = req.query.force === "true";

    const word = await aiService.generateWord(input.wordName, input.wordbankId, { force });

    // force=true 时返回 200（更新），新建时返回 201
    res.status(force ? 200 : 201).json(word);
  }
);
```

---

### 3.5 文件 `server/src/validators/ai.validator.ts`（新建）

**职责**: 校验 AI 生成请求的输入参数。

```typescript
export interface GenerateWordInput {
  wordName: string;
  wordbankId: string;
}

export function validateGenerateWordInput(body: unknown): GenerateWordInput;
```

**校验规则**:
- `wordName`: 必填字符串，长度 1-100，不允许纯空白
- `wordbankId`: 必填字符串，24 位 hex ObjectId 格式
- 不合法 → `AppError`(400, `"VALIDATION_ERROR"`)
- 参考 `validateCreateWordInput` 的编码风格

---

### 3.6 文件 `server/src/routes/ai.routes.ts`（新建）

**职责**: 定义 AI 生成路由。

```typescript
import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware";
import * as aiController from "../controllers/ai.controller";

const router = Router();

// AI 词条生成 — 仅管理员
router.post("/words/generate", authMiddleware, adminMiddleware, aiController.generate);

export const aiRoutes = router;
```

**注意**: 路由路径 `/words/generate` 挂载在 `aiRoutes` 上，但实际映射路径 `/api/v1/words/generate` 是由 `routes/index.ts` 决定如何挂载的。有两种方案：
- **方案 A**（推荐）: 将 `aiRoutes` 作为独立 router 挂载到 `/api/v1/words` 下（但在 `routes/index.ts` 中需特殊处理，因为 `wordRoutes` 已占用 `/words` 前缀）

   实际实现时，直接将 generate 路由添加到 `word.routes.ts` 中更为简洁（避免路由冲突），但考虑到模块分离原则，可在 `routes/index.ts` 中这样挂载：

   ```typescript
   // 将 aiRoutes 中的 /words/generate 挂载到 /words 前缀
   routes.use("/", aiRoutes);
   ```

   其中 `aiRoutes` 内部路径为 `/words/generate`，挂载到 `/` 后最终路径为 `/api/v1/words/generate`。

- **方案 B**: 直接在 `word.routes.ts` 中添加 generate 路由（更简单但耦合）

**选择方案 A**，保持 AI 模块独立。

---

### 3.7 文件 `server/src/routes/index.ts`（修改）

**修改内容**: 在现有路由注册中添加 aiRoutes 挂载。

```typescript
import { aiRoutes } from "./ai.routes";

// aiRoutes 内部路径为 /words/generate，挂载到 / 前缀
// 最终路径: /api/v1/words/generate
routes.use("/", aiRoutes);
```

挂载位置：放在 `routes.use("/words", wordRoutes)` 之前，避免被 wordRoutes 的 catch-all 捕获。

---

### 3.8 System Prompt 设计（写在 `ai.service.ts` 中的常量）

```typescript
const SYSTEM_PROMPT = `You are a cognitive linguistics expert specializing in English vocabulary analysis for Chinese native speakers.

For each word, analyze it through the lens of COGNITIVE LINGUISTICS and PHYSICAL IMAGERY:

## Required Output Structure

Return a JSON object with the following structure:

{
  "physical_image": "<one of: FLOW, GRASP, BREAK, BEAR, DRIVE, LIGHT, LEVERAGE, YIELD>",
  "physical_image_description": "<English description of the physical image this word evokes, 1-2 sentences>",
  "core_meaning": "<the core spatial/physical meaning in English, 1 sentence>",
  "core_example_en": "<an English example sentence showing the core meaning>",
  "core_example_zh": "<Chinese translation of the core example>",
  "extended_meanings": [
    {
      "evolution_description": "<explain the cognitive logic of how this meaning extends from the physical image, in English>",
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

3. **extended_meanings**: Provide at least 3, ordered from most concrete to most abstract. Each must include an `evolution_description` explaining the cognitive mapping (e.g., "FROM physically grasping an object → TO mentally grasping an idea").

4. **collocations**: 3-5 common phrases containing this word.

5. All text content should be in English except `meaning` and `example_zh` which should be in Chinese.

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no additional text.`;
```

---

## 4. 代码规范要求

1. **使用 async/await**，不使用 `Promise.then`
2. **错误统一用 `AppError`**（`server/src/utils/errors.ts`），Service/Provider 抛出，Controller 不 catch
3. **Controller 使用 `asyncHandler`** 包裹（`server/src/utils/asyncHandler.ts`）
4. **输入校验独立为 Validator 文件**，与 Controller 分离
5. **保持与现有代码风格一致**：命名、缩进 2 空格、单引号、分号结尾
6. **Service 层文件只导出 async 函数**，不导出类
7. **TypeScript 严格类型**：不使用 `any`（合法的 `unknown` → 类型断言除外）
8. **MongoDB 查询使用 Mongoose**，不使用原生 driver
9. **环境变量只在 `config/index.ts` 中读取**，其他地方通过 `config` 对象访问

---

## 5. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 编号 | 用例 | 说明 |
|------|------|------|
| TC-F01 | 成功调用 LLM 生成完整词条 | HTTP 201，所有字段完整 |
| TC-F02 | 同一单词不重复生成 | HTTP 409，`ALREADY_EXISTS` |
| TC-F03 | `force=true` 强制重新生成 | HTTP 200，updatedAt 更新 |
| TC-F04 | Provider 接口抽象 | Mock Provider 与真实 Provider 返回结构一致 |
| TC-F05 | JSON 解析映射 | LLM JSON → IWord 字段正确 |
| TC-B01 | 单词名含连字符 | 正确接受 |
| TC-B02 | 单词名为空字符串 | HTTP 400 |
| TC-E01 | API Key 未配置 | HTTP 503，`LLM_NOT_CONFIGURED` |
| TC-E02 | 请求超时 | HTTP 504，`LLM_TIMEOUT` |
| TC-E03 | 返回非 JSON | HTTP 502，`LLM_PARSE_ERROR` |
| TC-E04 | 返回 JSON 缺字段 | HTTP 502 |
| TC-E05 | 词库不存在 | HTTP 404 |
| TC-E06 | 未认证 | HTTP 401 |
| TC-E07 | 普通用户（非管理员） | HTTP 403 |
| TC-E08 | LLM 返回 5xx | HTTP 502 |

---

## 6. 注意事项

1. **不需要安装任何新的 npm 包** — 使用原生 `fetch`（Node.js 18+ 内置）调用 DeepSeek API
2. **config 已有 `deepseekApiKey` 和 `deepseekBaseUrl`** — 不要在 Provider 中再调 `dotenv`，统一从 `config` 对象读取
3. **物理意象类型映射要容错**：LLM 返回的 `physical_image` 可能是大写（如 `"GRASP"`），需要 `.toLowerCase()` 后再与 `PHYSICAL_IMAGE_TYPES` 枚举比对
4. **词性映射同理**：LLM 返回的 `part_of_speech` 可能用全称（如 `"verb"`），需要与 `PART_OF_SPEECH_TYPES` 对比
5. **`response_format: { type: "json_object" }`** 是 DeepSeek API 的关键参数，可大幅降低返回非 JSON 的概率
6. **Mock Provider 可选实现**：如需便于测试，可在 `providers/` 下新增 `mock.ts` 实现 `LLMProvider` 接口返回固定数据，但不属于本次必须交付
7. **已存在的 `Word.routes.ts` 中路径为 `/`、`/:id`**，新增的 `/words/generate` 需要挂载时注意路由匹配顺序 — 将 aiRoutes 挂载到基路径 `/`（而非 `/words`），避免被 `/:id` 捕获
8. **不要修改已有文件的业务逻辑** — `routes/index.ts` 只新增 import 和 `routes.use` 一行
