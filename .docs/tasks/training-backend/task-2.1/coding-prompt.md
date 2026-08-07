# Coding Prompt — Task 2.1: 前端 Quiz API 集成

## 1. 任务目标

将 `client/src/data/quizEngine.ts` 从纯本地 mock 模式升级为"API 优先 + 本地降级"模式：新建 `client/src/api/quiz.ts` 封装 Quiz API，改造 quizEngine 为异步 API-first 调用，并在 quiz.vue 中添加 loading/error 状态处理。

---

## 2. 技术上下文

- **语言/框架**: TypeScript 5.4 + Vue 3.4 (Composition API + `<script setup>`) + uni-app 3.0
- **构建**: Vite 5 (`client/` 目录)
- **认证**: JWT Bearer Token，存于 `uni.storage`，由 `api/request.ts` 自动注入
- **后端 API**: Task 1.2 产出完毕，所有 Quiz API 已就绪

### 涉及文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **新建** | `client/src/api/quiz.ts` | Quiz API 封装模块（已确认路径不存在 ✅） |
| **修改** | `client/src/data/quizEngine.ts` | 改造 generateQuiz / judgeAnswer 为异步 API-first |
| **修改** | `client/src/pages/quiz/quiz.vue` | 添加 loading/error 状态 + 异步调用适配 |
| **修改** | `client/src/api/index.ts` | 导出 quiz 模块 |
| 不改动 | `client/src/pages/training/training.vue` | 仅确认行为一致（入口跳转逻辑不变） |
| 不改动 | `client/vercel.json` | 已有 `/api/:path*` 代理规则覆盖 `/api/v1/quiz/*` ✅ |

### 已有代码探查结果 🔴

- **依赖 Task 1.2 产出** — Quiz API 路由已挂载：
  - `GET /api/v1/quiz/questions` → optionalAuth → `{ data: IQuizQuestion[] }`
  - `POST /api/v1/quiz/submit` → optionalAuth → `{ correct, score, matched, missing, analysis }`（与前端 `QuizResult` 接口完全一致）
  - `GET /api/v1/quiz/history` → auth → `{ data: [...], pagination: { total, page, limit, totalPages } }`
  - `GET /api/v1/quiz/stats` → auth → `{ totalQuestions, correctRate, recentTrend }`
- **请求封装** `client/src/api/request.ts` — 导出 `request<T>(path, options): Promise<T>`，自动注入 JWT、401 处理（仅在有 token 时跳转登录页 — 对训练页使用 optionalAuth 无影响）
- **类型定义** `client/src/data/types.ts` — 导出 `QuizItem`, `QuizResult`, `QuizDirection`
- **认证状态** `client/src/store/user.ts` — 导出 `getToken()`, `userStore`（`reactive({ user: AuthUser | null })`）
- **现有 API 参考** `client/src/api/notes.ts` — 后端响应接口 `/ adapter 函数 / export 函数 的三段式结构（见下方第 3 节）
- **后端模型** `server/src/models/QuizQuestion.ts` — `IQuizQuestion` 含 `_id`, `prompt`, `hint`, `direction`, `reference`, `keywords`, `analysis`, `wordId?`, `wordbankId?`
- **后端判分返回** `server/src/services/quiz.service.ts` — `QuizResult` 为 `{ correct, score, matched, missing, analysis }`，与前端 `QuizResult` 字段完全一致
- **Vercel 代理** `client/vercel.json` — `rewrites: [{ source: "/api/:path*", destination: "https://english-dictionary-api-q9e3.onrender.com/api/:path*" }]` — Quiz API 路径 `/api/v1/quiz/*` 已自动被覆盖 ✅

---

## 3. 已有代码当前内容（修改前的文件，已通过 Read 确认）

### 3.1 `client/src/data/quizEngine.ts` (当前)

- **第 85-106 行**: `generateQuiz(direction, wordId?)` — 同步函数，从 `mockQuizItems` 本地数组选 10 题
- **第 115-172 行**: `judgeAnswer(item, userInput, direction)` — 同步函数，纯前端判分（关键词 70% + LCS 30%）
- **第 38-68 行**: 工具函数 `normalize`, `words`, `variantMatches`, `lcs`, `shuffle` — 纯函数，后续降级逻辑复用
- **第 13-34 行**: `mockQuizItems` 数组 — 20 条硬编码题目，降级时继续使用

### 3.2 `client/src/pages/quiz/quiz.vue` (当前)

- **第 249 行**: `import { generateQuiz, judgeAnswer } from "@/data/quizEngine"` — 同步导入
- **第 305-313 行**: `reset()` — 同步调用 `generateQuiz()`，无 loading/error 处理
- **第 323-335 行**: `submit()` — 同步调用 `judgeAnswer()`，无 error 处理
- **第 338-342 行**: `onLoad()` — 同步调用 `generateQuiz()`，无 loading
- **第 258-265 行**: State — 无 `loading` / `error` 状态变量
- **Template**: 无 loading 状态标记、无错误提示区域

### 3.3 `client/src/api/index.ts` (当前，第 1-58 行)

- 导出 12 个 API 模块，不含 quiz 模块

---

## 4. 实现要求

### 4.1 文件 `client/src/api/quiz.ts`（新建）

**参考**: 遵循 `client/src/api/notes.ts` 的三段式结构（后端响应接口 → adapter → export 函数）。

#### 4.1.1 后端响应接口定义

```typescript
/** 后端 QuizQuestion 响应格式（IQuizQuestion.lean()） */
interface BackendQuizQuestion {
  _id: string;
  prompt: string;
  hint: string;
  direction: "zh2en" | "en2zh";
  reference: string;
  keywords: string[];
  analysis: string;
  wordId?: string;
  wordbankId?: string;
}

/** GET /quiz/questions 响应 */
interface FetchQuestionsResponse {
  data: BackendQuizQuestion[];
}

/** POST /quiz/submit 响应 — 与前端 QuizResult 接口一致 */
interface SubmitAnswerResponse {
  correct: boolean;
  score: number;
  matched: string[];
  missing: string[];
  analysis: string;
}

/** GET /quiz/history 响应 */
interface HistoryItem {
  questionId: string;
  prompt: string;
  direction: string;
  userInput: string;
  score: number;
  correct: boolean;
  reference: string;
  submittedAt: string;
}

interface FetchHistoryResponse {
  data: HistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** GET /quiz/stats 响应 */
interface FetchStatsResponse {
  totalQuestions: number;
  correctRate: number;
  recentTrend: number[];
}
```

#### 4.1.2 Adapter 函数

```typescript
/** 适配后端题目 → 前端 QuizItem（_id → id，其余字段一致） */
function adaptQuizItem(raw: BackendQuizQuestion): QuizItem {
  return {
    id: raw._id,
    wordId: raw.wordId,
    direction: raw.direction,
    prompt: raw.prompt,
    hint: raw.hint,
    reference: raw.reference,
    keywords: raw.keywords,
    analysis: raw.analysis,
  };
}
```

#### 4.1.3 导出函数

| 函数 | HTTP 方法 + 路径 | 参数 | 返回类型 | 说明 |
|------|-----------------|------|---------|------|
| `fetchQuestions(direction, wordId?)` | `GET /api/v1/quiz/questions?direction=...&wordId=...` | `direction: QuizDirection`, `wordId?: string` | `Promise<QuizItem[]>` | wordId 存在时追加 `&wordId=xxx`；用 `adaptQuizItem` 转换 `data` 数组 |
| `submitAnswer(questionId, userInput)` | `POST /api/v1/quiz/submit` | `questionId: string`, `userInput: string` | `Promise<SubmitAnswerResponse>` | 直接返回（与前端 QuizResult 接口兼容） |
| `fetchHistory(page?, limit?)` | `GET /api/v1/quiz/history?page=...&limit=...` | `page?: number`, `limit?: number` | `Promise<FetchHistoryResponse>` | 默认 page=1, limit=20 |
| `fetchStats()` | `GET /api/v1/quiz/stats` | 无 | `Promise<FetchStatsResponse>` | — |

**实现要点**:

- 使用 `request<T>()` 从 `./request` 导入（调用方式参考 notes.ts）
- 查询参数拼接用 `encodeURIComponent`
- **不导出** adapter 函数（内部使用），仅 export 4 个函数
- 注意：`submitAnswer` 的 body 为 `{ questionId, userInput }`，需用 `{ method: "POST", data: { questionId, userInput } }`

### 4.2 文件 `client/src/data/quizEngine.ts`（修改）

#### 4.2.1 `generateQuiz` 改造

**当前签名**: `function generateQuiz(direction, wordId?): QuizItem[]`
**新签名**: `async function generateQuiz(direction, wordId?): Promise<QuizItem[]>`

**改造逻辑** (伪代码):
```
async function generateQuiz(direction, wordId?):
  try:
    const items = await fetchQuestions(direction, wordId)
    return items  // API 成功，使用服务端数据
  catch (error):
    // API 失败 → 降级为本地 mock
    console.warn("Quiz API unavailable, falling back to local mock:", error)
    // 执行原有同步逻辑（从 mockQuizItems 选 10 题）
    return <原有本地逻辑>
```

**降级逻辑**: 保留 `mockQuizItems` 数组和 `shuffle` 工具函数，catch 块内直接复用第 85-106 行的现有逻辑。

#### 4.2.2 `judgeAnswer` 改造

**当前签名**: `function judgeAnswer(item, userInput, direction): QuizResult`
**新签名**: `async function judgeAnswer(item, userInput, direction): Promise<QuizResult>`

**改造逻辑** (伪代码):
```
async function judgeAnswer(item, userInput, direction):
  try:
    const result = await submitAnswer(item.id, userInput)
    return result  // API 成功，使用服务端判分
  catch (error):
    // API 失败 → 降级为本地判分
    console.warn("Quiz API submit failed, falling back to local judge:", error)
    // 执行原有同步判分逻辑
    return <原有本地判分逻辑>
```

**注意**: `submitAnswer` 的 `questionId` 参数是 `item.id`（前端 QuizItem 的 id 字段，已适配为后端 `_id`）。

#### 4.2.3 新增导出（可选）

在文件末尾新增对 `fetchHistory` 和 `fetchStats` 的 re-export，方便其他页面使用（个人中心统计、答题历史页）：

```typescript
export { fetchHistory, fetchStats } from "@/api/quiz";
```

#### 4.2.4 影响检查

- `generateQuiz` 和 `judgeAnswer` 的调用方：仅在 `quiz.vue` 中使用（通过 Grep 确认），无其他调用方 ✅
- 工具函数 `normalize`, `words`, `variantMatches`, `lcs`, `shuffle` — 保留不动，降级逻辑复用

### 4.3 文件 `client/src/pages/quiz/quiz.vue`（修改）

#### 4.3.1 新增 State

在现有 state 变量区域（第 258-264 行之间）新增：

```typescript
const loading = ref(false);   // 首次加载题目时
const loadError = ref("");    // 加载失败时的错误消息
```

#### 4.3.2 改造 `reset()` 函数

```typescript
async function reset() {
  loading.value = true;
  loadError.value = "";
  try {
    items.value = await generateQuiz(direction.value, wordId.value);
    index.value = 0;
    input.value = "";
    result.value = null;
    answers.value = [];
    showReview.value = false;
    showHint.value = false;
  } catch (e: any) {
    loadError.value = e?.message || "加载题目失败，请重试";
  } finally {
    loading.value = false;
  }
}
```

#### 4.3.3 改造 `submit()` 函数

```typescript
async function submit() {
  if (!canSubmit.value) return;
  if (!result.value) {
    // 提交判分（异步 API-first）
    try {
      result.value = await judgeAnswer(item.value, input.value, direction.value);
    } catch (e: any) {
      // 降级已由 quizEngine 内部处理，此处不会抛出
      // 万一到达此处，显示 toast
      uni.showToast({ title: e?.message || "判分失败", icon: "none" });
    }
  } else {
    // 下一题
    answers.value = [...answers.value, result.value];
    index.value = index.value + 1;
    input.value = "";
    result.value = null;
  }
}
```

#### 4.3.4 改造 `onLoad()`

```typescript
onLoad(async (options: any) => {
  direction.value = (options?.direction as QuizDirection) || "zh2en";
  wordId.value = options?.wordId || undefined;
  loading.value = true;
  loadError.value = "";
  try {
    items.value = await generateQuiz(direction.value, wordId.value);
  } catch (e: any) {
    loadError.value = e?.message || "加载题目失败，请重试";
  } finally {
    loading.value = false;
  }
});
```

#### 4.3.5 Template 修改

在「答题中」区域的题卡之前（第 99 行前）添加 loading/error 状态：

```html
<!-- 加载中 -->
<view v-if="loading" class="quiz-page__status">
  <text class="quiz-page__status-text">加载题目中…</text>
</view>

<!-- 加载失败 -->
<view v-else-if="loadError" class="quiz-page__status quiz-page__status--error">
  <text class="quiz-page__status-text">{{ loadError }}</text>
  <view class="quiz-page__btn-retry" @click="reset">重新加载</view>
</view>

<!-- 题目区域（现有内容加 v-else） -->
<template v-else>
  <!-- 现有题卡 + 输入框 + 反馈 等 -->
</template>
```

**CSS 新增** (在 `<style scoped lang="scss">` 内)：

```scss
&__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;

  &--error {
    // 错误状态的额外样式
  }
}

&__status-text {
  font-size: 28rpx;
  color: #6b7280;
}

&__btn-retry {
  margin-top: 32rpx;
  padding: 20rpx 48rpx;
  border-radius: 24rpx;
  background: #2563eb;
  color: #fff;
  font-size: 26rpx;
  cursor: pointer;
}
```

### 4.4 文件 `client/src/api/index.ts`（修改）

在第 46 行（`export { fetchMyNotes, ... } from "./notes"` 之后）新增：

```typescript
export { fetchQuestions, submitAnswer, fetchHistory, fetchStats } from "./quiz";
```

---

## 5. 代码规范要求

1. **编码风格**: 遵循 `notes.ts` 的三段式结构（响应接口 → adapter → 导出函数）
2. **异步**: 使用 `async/await`，不混用 `Promise.then`
3. **错误处理**: quizEngine 内部 catch 后降级，不向上抛异常；打印 `console.warn` 便于调试
4. **类型安全**: 所有后端响应定义 TypeScript 接口，不使用 `any` 绕过
5. **条件编译**: 不需要，此模块仅 H5 使用（uni-app 的 `uni.request` 已跨端兼容）
6. **Token 处理**: 不主动处理认证；request.ts 自动注入 JWT；训练页使用 optionalAuth 所以无需担心 401 跳转
7. **控制流保护**: loading 状态下禁止重复发请求（`reset()` 里先设 `loading=true`，`finally` 中设 `false`；按钮禁用由 `canSubmit` 控制）

---

## 6. 测试要求

代码必须能通过 [test-cases.md](./test-cases.md) 中定义的以下测试用例：

**功能测试**:
- TC-001 ~ TC-006: 4 个 API 函数正常调用 + 数据结构正确
- TC-007 ~ TC-010: quizEngine API-first + 本地降级双路径
- TC-011 ~ TC-016: quiz.vue / training.vue UI 行为不变
- TC-017: `tsc --noEmit` 无类型错误

**边界测试**:
- TC-018 ~ TC-020: 空数据 / 401 / 超时降级

**异常测试**:
- TC-021 ~ TC-024: 400/500/非法数据 → 降级

**集成测试** 🔴:
- I-001: 匿名用户完整 API 链路（fetch → submit × 10）
- I-002: 已登录用户全流程（登录 → 答题 → 历史 → 统计）
- I-003: 未登录 — API 判分但不持久化

---

## 7. 集成验证指令 🔴

> 代码写完后，执行以下验证确保与依赖 Task 1.2 正确集成：

### 7.1 自检

- [ ] `client/src/api/quiz.ts` 的 4 个导出函数是否调用了 `request()`（非 mock）？
- [ ] `quizEngine.ts` 的 `generateQuiz` 是否 import 了 `fetchQuestions` from `@/api/quiz`？
- [ ] `quizEngine.ts` 的 `judgeAnswer` 是否 import 了 `submitAnswer` from `@/api/quiz`？
- [ ] `quiz.vue` 的 `reset()` / `onLoad()` 是否加了 `await` 调用 `generateQuiz`？

### 7.2 链路验证（有 I 系列用例时必做）

**前提**: 后端服务已启动（`cd server && npm run dev`），种子数据已入库。

**验证 A — API 正常路径**:
```bash
# 1. 启动前端
cd client && npx uni dev -p h5

# 2. 浏览器打开 → 训练首页 → 点击"短句中译英"
# 3. 在 DevTools Network 标签中确认：
#    - 请求 GET /api/v1/quiz/questions?direction=zh2en
#    - 响应 200，data 为 10 题数组
# 4. 输入英文翻译 → 提交
# 5. 在 DevTools Network 标签中确认：
#    - 请求 POST /api/v1/quiz/submit，body 含 questionId + userInput
#    - 响应 200，含 correct/score/matched/missing/analysis
```

**验证 B — API 异常降级路径**:
```bash
# 1. 关闭后端服务
# 2. 刷新答题页面
# 3. 预期：题目仍能加载（来自本地 mock），页面不白屏
# 4. 在 Console 中应能看到降级 warning
```

**验证 C — 已登录用户持久化**:
```bash
# 1. 登录（POST /api/v1/auth/login）
# 2. 进入答题页完成 2 题
# 3. 浏览器 console 直接调用（模拟验证）:
#    import { fetchHistory, fetchStats } from "@/api/quiz"
#    await fetchHistory(1, 10)  // 应返回刚答的 2 题
#    await fetchStats()         // totalQuestions ≥ 2
```

### 7.3 回归检查

- [ ] `training.vue` 入口点击后跳转到答题页正常
- [ ] 单词详情页"用 X 造句练习"传递 wordId 正常
- [ ] `tsc --noEmit` 在 client/ 目录下无新增类型错误
- [ ] `api/request.ts` 的 401 处理逻辑不受影响（训练页不触发强制跳转登录）

---

## 8. 注意事项

1. **`_id` vs `id`**: 后端 QuizQuestion 使用 Mongoose 的 `_id` 字段，前端 QuizItem 使用 `id` 字段。adapter 函数必须做映射：`id: raw._id`。wordId 在后端是 ObjectId 类型（lean() 后为 string），前端也使用 string — 直接传递无需转换。

2. **`submitAnswer` 返回格式兼容**: 后端判分结果 `{ correct, score, matched, missing, analysis }` 与前端 `QuizResult` 接口完全一致（有意设计），无需 adapter。直接 `return request<SubmitAnswerResponse>(...)` 即可。

3. **降级不丢数据**: 降级到本地判分时，答题结果 (`answers` 数组) 仍在内存中保存，完成页可正常显示正确率。但降级模式下不保存到后端（符合预期：断网时无法持久化）。

4. **`optionalAuth` 工作原理**: Quiz API 使用 `optionalAuth` 中间件 — 有 token 时 `req.user.userId` 存在，无 token 时为 null。Controller 将 userId 传给 Service，Service 只在 userId 存在时保存 QuizAttempt。前端无需任何 token 判断逻辑。

5. **`generateQuiz` 的 `wordId` 参数**: 后端接受 `wordId` 作为查询参数进行题目筛选。当单词详情页跳转时 `wordId` 从 `onLoad` 的 `options.wordId` 获取，直接传给 `fetchQuestions(direction, wordId)`。后端优先返回该单词相关题目，不足时补齐。

6. **模板 `v-if` / `v-else` 嵌套**: 现有 quiz.vue 的 template 使用 `v-if="done"` / `v-else` 区分完成页和答题中页面。loading/error 状态只在答题中 (`v-else`) 分支内生效（done 页面不需要 loading）。注意不要破坏现有的 `v-if="done"` 结构。

7. **`reset()` 的"再来一组"功能**: done 页面点击"再来一组"调用 `reset()` — 必须重新调用 API 获取新题目（利用 24h 冷却排除刚答过的题）。不要复用上一轮的 `items`。

8. **类型安全**: `FetchQuestionsResponse`, `SubmitAnswerResponse` 等接口定义中不添加前端不需要的字段（如 `createdAt`, `updatedAt`, `__v`）。只定义实际使用到的字段。
