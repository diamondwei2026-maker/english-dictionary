# Coding Prompt — Task 4.3: 前端 AI 功能集成

## 1. 任务目标

将管理后台单词编辑页的 AI 生成功能从本地 `setTimeout` mock 替换为真实后端 API 调用，支持流式（SSE）进度展示和完整的错误处理。

## 2. 技术上下文

- **语言/框架**: TypeScript 5.1 + React 18.2 + Taro 3.6.23 (H5)
- **涉及文件**:
  - (新建) `client/src/api/ai.ts` — AI 词条生成 API 模块
  - (修改) `client/src/api/index.ts` — 导出新 AI 模块
  - (修改) `client/src/pages/admin/index.tsx` — 替换 mock AI 逻辑

- **依赖说明**:
  - Task 4.1 已完成：后端 `POST /api/v1/words/generate` 可用
  - Task 4.2 已完成：后端 `POST /api/v1/words/generate/stream` (SSE) 可用
  - 现有 `api/request.ts` 提供 `request<T>()` 通用方法（自动带 Auth header、401 全局拦截）
  - 现有 `api/adapters.ts` 提供 `adaptWord()` 将后端 `BackendWordResponse` → 前端 `Word` 类型

- **关键类型说明**:
  - 后端请求体：`{ wordName: string; wordbankId: string }`，`wordbankId` 为 24 位 hex ObjectId
  - 后端查询参数：`?force=true` 用于强制重新生成已有单词
  - 后端非流式响应：完整的 BackendWordResponse（与 `GET /api/v1/words/:id` 返回格式相同），`adaptWord()` 可直接适配
  - SSE 事件流（`text/event-stream`）：`event: thinking` → `event: content`（×N）→ `event: done`（data 含完整 BackendWordResponse）→ 或 `event: error`

## 3. 实现要求

### 3.1 文件 `client/src/api/ai.ts`（新建）

创建 AI 词条生成 API 模块，参考已有 `api/words.ts` 的模式。

#### 3.1.1 非流式接口 `generateWord()`

- **签名**: `export async function generateWord(wordName: string, wordbankId: string, force = false): Promise<Word>`
- **职责**: 调用 `POST /api/v1/words/generate`，返回前端 `Word` 类型
- **关键逻辑**:
  1. 根据 `force` 参数拼接 `?force=true` 查询参数
  2. 调用 `request<BackendWordResponse>(...)` 发起 POST，body 为 `{ wordName, wordbankId }`
  3. 用 `adaptWord()` 将后端响应转为前端 `Word` 并返回
- **错误处理**: 依赖 `request()` 内置的 401/网络错误处理，调用方 try-catch

#### 3.1.2 流式接口 `generateWordStream()`

- **签名**:
  ```typescript
  export async function generateWordStream(
    wordName: string,
    wordbankId: string,
    force: boolean,
    callbacks: {
      onThinking?: (message: string) => void;
      onContent?: (field: string, value: string) => void;
      onDone?: (word: Word) => void;
      onError?: (code: string, message: string) => void;
    }
  ): Promise<void>
  ```
- **职责**: 调用 `POST /api/v1/words/generate/stream`，逐事件解析 SSE 流，通过回调推送进度
- **关键逻辑**:
  1. 拼接 URL（含 `?force=true` 可选）
  2. 使用原生 `fetch()`（非 Taro.request）发起 POST，headers 含 `Authorization: Bearer <token>` 和 `Content-Type: application/json`
  3. 从 `response.body.getReader()` 获取 `ReadableStream`
  4. 以 `\n\n` 为分隔逐帧解析 SSE 事件行
  5. 解析每个事件：`event: <type>\ndata: <json>`
  6. 按事件类型分派回调：
     - `thinking` → 调用 `onThinking(message)`
     - `content` → 调用 `onContent(field, value)`
     - `done` → 用 `adaptWord()` 适配 data 并调用 `onDone(word)`
     - `error` → 调用 `onError(code, message)`
  7. 考虑 `TextDecoder` 处理 UTF-8 流
  8. 如果 `fetch` 本身失败（网络错误），调用 `onError("NETWORK_ERROR", "网络请求失败")`
  9. 确保在 finally 中 `reader.cancel()` + 清理

- **注意事项**:
  - 使用原生的 `window.fetch()` 绕过 Taro.request（Taro 不支持 ReadableStream）
  - Token 通过 `getToken()` 从 `request.ts` 导入获取
  - BASE_URL 在 H5 环境下为空字符串（devServer proxy），直接拼接路径即可

### 3.2 文件 `client/src/api/index.ts`（修改）

- **修改内容**:
  1. 新增导出：`export { generateWord, generateWordStream } from "./ai";`
- **修改位置**: 在现有导出段落末尾添加

### 3.3 文件 `client/src/pages/admin/index.tsx`（修改）

#### 3.3.1 导入变更

- **移除**:
  - 删除 `import { AI_GENERATED_TEMPLATES } from "../../data/mockData";`
- **新增**:
  - 导入 `import { generateWord, generateWordStream } from "../../api";`

#### 3.3.2 删除 `generateAIContent()` 函数

- **删除位置**: 第 34-56 行的 `generateAIContent` 函数及 `genId()` 函数（如果 `genId` 仅被 generateAIContent 使用；注意检查 WordEditForm 中的 `addExt` 也使用了 `genId`）
- **注意**: `genId()` 仍在其他地方被使用（`addExt` 中为引申义生成临时 id、WordManager 中为新增单词生成 id），不能删除 `genId()`

#### 3.3.3 重写 `WordEditForm` 中的 `handleAI()` 函数（第 366-377 行）

**当前代码**：
```typescript
const handleAI = () => {
  if (!form.word) return;
  setAiLoading(true);
  setAiDone(false);
  setTimeout(() => {
    const g = generateAIContent(form.word!);
    setForm((f) => ({ ...f, ...g }));
    setColInput((g.collocations || []).join("、"));
    setAiLoading(false);
    setAiDone(true);
  }, 1800);
};
```

**新实现策略**：优先使用 SSE 流式接口，失败时降级到非流式接口。

**新实现伪代码**：
```
handleAI():
  1. 前端校验：如果 `form.word` 为空 → Taro.showToast("请先输入单词") → 提前返回
  2. 前端校验：如果 `form.libraryId` 为空 → Taro.showToast("请先选择词库") → 提前返回
  3. 前端校验：如果 word 长度 > 100 → Taro.showToast("单词过长，请控制在 100 字以内") → 提前返回
  4. 判断是否 force：`const force = !!form.coreMeaning`（已有核心义内容视为已有 AI 结果，强制重新生成）
  5. 设置 `setAiLoading(true); setAiDone(false)`
  6. 尝试 SSE 流式调用：
     try {
       await generateWordStream(form.word, form.libraryId, force, {
         onThinking(msg) → 可更新一个进度文本 state（如显示"正在分析...")，
         onContent(field, value) → 可选择性实时更新对应字段，
         onDone(word) → 将 adaptedWord 结果合并到 form + 设置 aiDone=true，
         onError(code, msg) → 抛出错误（被外层 catch 捕获后降级）
       })
     } catch {
       // SSE 失败，降级为非流式
       7. 调用 `const result = await generateWord(form.word, form.libraryId, force)`
       8. 将 result (Word 类型) 合并到 form
       9. setColInput((result.collocations || []).join("、"))
       10. setAiDone(true)
     }
  11. finally: setAiLoading(false)
```

**表单回填具体映射**（SSE `done` 或非流式返回的 Word 对象）：

```typescript
// result 是经过 adaptWord() 处理后的前端 Word 类型
setForm((f) => ({
  ...f,
  // 保留用户自己指定的 id 和 libraryId
  id: f.id,
  libraryId: f.libraryId,
  // 以下字段从 AI 结果覆盖
  phonetic: result.phonetic,
  coreMeaning: result.coreMeaning,
  coreImageType: result.coreImageType,       // 必须为 IMAGE_TYPES 之一
  coreImageDescription: result.coreImageDescription,
  coreExampleSentence: result.coreExampleSentence,
  coreExampleTranslation: result.coreExampleTranslation,
  extendedMeanings: result.extendedMeanings,  // ExtendedMeaning[] 数组
  collocations: result.collocations,
}));
setColInput((result.collocations || []).join("、"));
```

**错误处理**（在 catch 块中）：
```typescript
catch (e) {
  const msg = e instanceof Error ? e.message : "AI 生成失败";
  Taro.showToast({ title: msg, icon: "none", duration: 2500 });
}
```
- 依赖 `ApiRequestError` 已包含友好中文 message（由 `request.ts` 提供）
- 网络错误时 message 为 "网络请求失败，请检查网络连接"
- 401 错误由 `request.ts` 全局拦截自动跳转登录页
- 表单数据保留不丢失，用户可点击重试

#### 3.3.4 按钮 UI 行为调整

按钮（第 431-438 行）的当前逻辑已通过 `aiLoading` 和 `aiDone` 控制文案和颜色，**保持不变**：

| 状态 | aiLoading | aiDone | 文案 | 背景色 |
|------|-----------|--------|------|--------|
| 初始 | false | false | AI 自动生成词条 | `#2563EB` (蓝) |
| 生成中 | true | — | ⏳ 正在生成... | `#93C5FD` (浅蓝) |
| 已完成 | false | true | ✓ 已生成，可继续编辑 | `#059669` (绿) |

额外处理：生成中（aiLoading=true）时点击按钮应忽略，防止重复请求。当前已在 `onClick={handleAI}` 中通过不判断 loading 状态隐式支持 — 需在 `handleAI` 开头增加：
```typescript
if (aiLoading) return; // 防止重复点击
```

#### 3.3.5 aiDone 状态重置时机

修改单词输入框的 `onInput`（第 428 行），当前已有 `setAiDone(false)` 重置逻辑，保持不变。

另外在切换图片类型的 `handleRegenImg`（第 379-386 行）**保持不动** — 该功能是纯前端图片类型轮换，不涉及后端 API，不在本任务范围内。

## 4. 代码规范要求

- 使用 `async/await` 而非 Promise.then
- API 函数返回前端类型（Word），在 API 层内部完成 adaptWord 转换
- 所有用户可见文案使用中文，技术错误信息不直接暴露给用户
- 表单字段映射时显式列出每个字段，避免 `...result` 覆盖 id/libraryId
- SSE 流读取使用 `TextDecoder` + buffer 拼接，按 `\n\n` 分隔事件
- 不引入新的外部依赖（如 event-source-polyfill）

## 5. 测试要求

代码需满足以下测试用例（详见 `test-cases.md`）：

| 用例 | 验证要点 |
|------|---------|
| TC-001 | 点击按钮发起 `POST /api/v1/words/generate`，回填表单 |
| TC-002 | 生成中显示 loading 状态，按钮不可重复点击 |
| TC-003 | 所有表单字段（音标/核心义/意象/例句/引申义/搭配）正确回填 |
| TC-004 | 网络错误展示 Toast，表单数据不丢失，可重试 |
| TC-005 | 服务端 500 后重试成功 |
| TC-006 | 已有内容的单词可强制重新生成（`?force=true`） |
| TC-007 | 空单词点击时不发起请求 |
| TC-008 | 超长单词（>100 字符）有校验提示 |
| TC-009 | 后端响应字段缺失时表单不崩溃 |
| TC-010 | SSE 流式模式下展示进度 + done 事件正确回填 |
| TC-011 | `generateAIContent` 函数已删除，`setTimeout` mock 已移除 |
| TC-012 | Token 过期时展示友好提示（由 request.ts 全局处理） |

## 6. 注意事项

- **genId() 函数不能删除**：它在 WordEditForm 的 `addExt()` 和 WordManager 的"新增单词"中仍在使用
- **AI_GENERATED_TEMPLATES import**：如果 `mockData.ts` 中其他地方不再使用此导出，仅移除 admin/index.tsx 中的 import；不要删除 mockData.ts 文件中的定义（可能被其他页面引用）
- **handleRegenImg 不修改**：这是纯前端的物理意象类型轮换，与 AI 生成无关
- **SSE 降级策略**：SSE 失败时自动降级到非流式，用户无感知
- **force 判断**：用 `!!form.coreMeaning` 判断是否已有 AI 生成内容；首次新增单词 coreMeaning 为空，不传 force（新建 201）；编辑已有单词时 coreMeaning 非空，传 `force=true`（更新 200）
- **不修改表单结构**：表单字段、布局、样式全部保持不变，只替换数据来源
- **Token 管理**：不需要手写 token 逻辑，`request.ts` 和 `api/ai.ts` 中的 fetch 都从 `getToken()` 获取
