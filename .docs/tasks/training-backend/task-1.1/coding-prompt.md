# Coding Prompt — Task 1.1: 实现 Quiz 核心服务与判分引擎

## 1. 任务目标

创建 `server/src/services/quiz.service.ts`，实现训练模块的全部核心业务逻辑——题目生成、服务端判分、答题历史、训练统计。这是纯服务层代码，不依赖 Express request/response 对象。

## 2. 技术上下文

- **语言/框架**: TypeScript (ESM) + Node.js 18+ + Mongoose 8.x
- **认证方式**: JWT — 服务层接收 `userId` 字符串参数（由 controller 从 `req.user?.userId` 提取后传入），服务层**不**依赖 `req` 对象
- **错误处理**: 统一使用 `AppError`（位于 `server/src/utils/errors.js`）：
  ```typescript
  throw new AppError(404, "NOT_FOUND", "题目不存在");
  throw new AppError(400, "VALIDATION_ERROR", "输入验证失败", errors);
  ```
- **模块导入**: ESM 风格，所有相对路径带 `.js` 后缀

### 涉及文件

| 操作 | 路径 | 说明 |
|------|------|------|
| **新建** | `server/src/services/quiz.service.ts` | ✅ 已确认不存在 — 核心业务逻辑 |
| **修改** | `server/src/services/index.ts` | ✅ 已确认当前仅含一行注释 `// Service layer — business logic`，需添加 quiz 导出 |

### 数据库表

| 集合 | 模型变量 | 来源 |
|------|---------|------|
| `quizquestions` | `QuizQuestion` | `server/src/models/QuizQuestion.js` — Task 0.1 产出，已导出 |
| `quizattempts` | `QuizAttempt` | `server/src/models/QuizAttempt.js` — Task 0.1 产出，已导出 |

### 已有代码探查结果 🔴

| 探查项 | 结果 | 说明 |
|--------|------|------|
| `models/index.ts` 导出 | ✅ | `QuizQuestion`、`IQuizQuestion`、`QuizAttempt`、`IQuizAttempt` 均已导出 |
| 种子数据 | ✅ | 20 条 zh2en 题目已入库（`server/src/seed/quiz.seed.ts`，Task 0.2 产出） |
| `optionalAuth` 中间件 | ✅ | `server/src/middleware/auth.ts` 导出（controller 层使用，服务层只收 userId） |
| `AppError` | ✅ | `server/src/utils/errors.js` — `new AppError(statusCode, code, message)` |
| `asyncHandler` | ✅ | `server/src/utils/asyncHandler.js` — controller 层使用 |
| 前端判分算法 | ✅ | `client/src/data/quizEngine.ts` — 需 100% 复刻到服务端，见下方「判分算法迁移」章节 |
| Express 类型扩展 | ✅ | `server/src/types/express.d.ts` — `req.user?: { userId: string; role: "user" \| "admin" }` |
| 路由挂载点 | ✅ | `server/src/routes/index.ts` — `app.use("/api/v1", routes)` |
| swagger.ts | ✅ | `server/src/config/swagger.ts` — OpenAPI spec 所在（Task 1.2 更新，**本 Task 不改**） |

## 3. 已有代码当前内容（修改前）

### `server/src/services/index.ts`（当前内容）

```
// Service layer — business logic
```

只有一行注释。需要添加 `export * from "./quiz.service.js"`（和其他已有服务保持一致的导出风格……实际上现有服务都是单独 import，index.ts 目前是空的）。统一风格：新增 `export { ... } from "./quiz.service.js"`。

## 4. 实现要求

### 4.1 文件 `server/src/services/quiz.service.ts`（新建）

按以下顺序实现四个导出函数，外加内部辅助函数。

---

#### 4.1.0 内部辅助函数（不导出）

从 `client/src/data/quizEngine.ts` **逐行复刻**以下纯函数（不能有任何行为差异）：

```typescript
// 1. normalize — 规范化文本
const normalize = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[.!?。！？]+$/g, "")
    .replace(/\s+/g, " ");

// 2. words — 提取英文单词（含缩略形式如 don't）
const words = (value: string): string[] =>
  normalize(value).match(/[a-z]+(?:'[a-z]+)?/g) ?? [];

// 3. variantMatches — 关键词变体匹配（去 s/es/ed/ing 后缀）
const variantMatches = (keyword: string, input: string[]): boolean =>
  input.some(
    (word) =>
      word === keyword ||
      word.replace(/(s|es|ed|ing)$/, "") ===
        keyword.replace(/(s|es|ed|ing)$/, ""),
  );

// 4. lcs — 最长公共子序列长度（单词级别）
const lcs = (a: string[], b: string[]): number => {
  const table = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      table[i][j] =
        a[i - 1] === b[j - 1]
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
  return table[a.length][b.length];
};

// 5. shuffle — Fisher-Yates 洗牌
const shuffle = <T>(values: T[]): T[] => {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
```

**注意**: `lcs` 在前端是数组级别的，服务端同样对单词数组做 LCS（不是字符串级别）。

---

#### 4.1.1 `generateQuiz` — 题目生成

```typescript
export async function generateQuiz(
  direction: "zh2en" | "en2zh",
  wordId?: string,
  userId?: string,
): Promise<IQuizQuestion[]>
```

**职责**: 从 QuizQuestion 集合中选取 10 道题目（或可用的最大数量）

**关键逻辑**:

1. 从 QuizQuestion 集合查询 `direction` 匹配的题目：
   ```typescript
   const all = await QuizQuestion.find({ direction }).lean();
   // .lean() 返回普通 JS 对象（项目 ADR 约定，减少 Mongoose 开销）
   ```

2. 如果有 `userId`（已登录）：
   - 查询该用户 24h 内的 QuizAttempt：
     ```typescript
     const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
     const recentAttempts = await QuizAttempt.find({
       userId,
       submittedAt: { $gte: twentyFourHoursAgo },
     }).select("questionId").lean();
     const answeredIds = new Set(recentAttempts.map(a => String(a.questionId)));
     ```
   - 从 `all` 中排除 `answeredIds` 中的题目
   - 如果排除后全部为空 → 返回 `[]`（不抛异常）

3. 如果有 `wordId`：
   - 优先取该 `wordId` 的题目
   - 不足 10 道时从其余题目（同方向但不同 wordId）shuffle 补齐
   - 最多返回 10 道

4. 如果无 `wordId`：
   - 全部 shuffle，取前 10 道（或可用最大数量）

5. 返回结果为 Mongoose lean 对象（普通 JS 对象），包含 `_id`, `prompt`, `hint`, `direction`, `reference`, `keywords`, `analysis` 字段

**错误处理**: 无（查询不到题目返回空数组，不抛异常）

---

#### 4.1.2 `judgeAnswer` — 服务端判分引擎

```typescript
export async function judgeAnswer(
  questionId: string,
  userInput: string,
  userId?: string,
): Promise<QuizResult>
```

`QuizResult` 类型定义（放在 `quiz.service.ts` 顶部，不导出或导出均可）：

```typescript
export interface QuizResult {
  correct: boolean;
  score: number;
  matched: string[];
  missing: string[];
  analysis: string;
}
```

**职责**: 对用户输入判分，已登录用户自动保存 QuizAttempt 记录

**关键逻辑**:

1. **参数校验**:
   - 如果 `questionId` 不是合法 ObjectId → `throw new AppError(400, "INVALID_ID", "无效的题目 ID")`
     - 用 `mongoose.Types.ObjectId.isValid(questionId)` 检查
   - 从 QuizQuestion 集合查询题目：
     ```typescript
     const question = await QuizQuestion.findById(questionId).lean();
     if (!question) {
       throw new AppError(404, "NOT_FOUND", "题目不存在");
     }
     ```

2. **判分算法**（与前端 `quizEngine.ts` `judgeAnswer()` **完全一致**）：

   a. **空输入处理**：
      ```typescript
      if (!normalize(userInput)) {
        return {
          correct: false,
          score: 0,
          matched: [],
          missing: question.keywords,
          analysis: `${question.analysis} 你还没有输入答案；参考表达：${question.reference}`,
        };
      }
      ```

   b. **en2zh 方向**（预留，本轮种子无此方向题目但仍需实现）：
      ```typescript
      if (direction === "en2zh") {
        const source = normalize(userInput);
        const ref = normalize(question.reference);
        const score = Math.round(
          ([...new Set(source)].filter((c) => ref.includes(c)).length /
            Math.max(ref.length, 1)) *
            100,
        );
        return {
          correct: score >= 70,
          score,
          matched: [],
          missing: [],
          analysis: score >= 70
            ? `表达正确。参考答案：${question.reference}`
            : `${question.analysis} 参考答案：${question.reference}`,
        };
      }
      ```

   c. **zh2en 方向**（核心逻辑）：
      ```typescript
      const inputWords = words(userInput);
      const matched = question.keywords.filter((k) => variantMatches(k, inputWords));
      const missing = question.keywords.filter((k) => !matched.includes(k));

      const keywordScore = (matched.length / question.keywords.length) * 70;
      const referenceWords = words(question.reference);
      const sequenceScore =
        (lcs(inputWords, referenceWords) / Math.max(referenceWords.length, 1)) * 30;
      const score = Math.round(keywordScore + sequenceScore);
      const correct = score >= 70;

      return {
        correct,
        score,
        matched,
        missing,
        analysis: correct
          ? `表达已经抓住了这句的核心意象。参考答案：${question.reference}`
          : `${question.analysis}${missing.length ? ` 建议补上：${missing.join("、")}。` : ""} 参考答案：${question.reference}`,
      };
      ```

3. **保存 QuizAttempt**（仅当 `userId` 存在）：
   ```typescript
   if (userId) {
     await QuizAttempt.create({
       userId: new mongoose.Types.ObjectId(userId),  // 字符串 → ObjectId
       questionId: question._id,
       userInput: userInput.trim(),
       score,
       correct,
       matched,
       missing,
       submittedAt: new Date(),
     });
   }
   ```
   - 注意：`userId` 必须 `new mongoose.Types.ObjectId(userId)` 构造（因为 QuizAttempt Schema 中 `userId` 定义为 `ObjectId ref "User"`）
   - 保存失败**不**影响判分结果的返回（用户仍能拿到 score/analysis，记录静默失败可在 console.error 打印日志但不要抛异常）

---

#### 4.1.3 `getHistory` — 答题历史

```typescript
export async function getHistory(
  userId: string,
  page?: number,
  limit?: number,
): Promise<{
  data: Array<{
    questionId: string;
    prompt: string;
    direction: string;
    userInput: string;
    score: number;
    correct: boolean;
    reference: string;
    submittedAt: Date;
  }>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}>
```

**关键逻辑**:

1. 默认值：`page = 1`, `limit = 20`
2. 查询 QuizAttempt 集合并 populate questionId：
   ```typescript
   const [data, total] = await Promise.all([
     QuizAttempt.find({ userId })
       .sort({ submittedAt: -1 })
       .skip((page - 1) * limit)
       .limit(limit)
       .populate("questionId", "prompt direction reference")  // 只取需要的字段
       .lean(),
     QuizAttempt.countDocuments({ userId }),
   ]);
   ```

3. 映射返回：
   ```typescript
   const mapped = data.map((record) => {
     const question = record.questionId as unknown as {
       _id: mongoose.Types.ObjectId;
       prompt: string;
       direction: string;
       reference: string;
     } | null;
     return {
       questionId: String(record.questionId),
       prompt: question?.prompt ?? "",
       direction: question?.direction ?? "",
       userInput: record.userInput,
       score: record.score,
       correct: record.correct,
       reference: question?.reference ?? "",
       submittedAt: record.submittedAt,
     };
   });
   ```

4. 分页元数据：
   ```typescript
   pagination: {
     total,
     page,
     limit,
     totalPages: Math.ceil(total / limit),
   }
   ```

5. 如果无记录 → `data: []`, `total: 0`（不抛异常）

**参考**: `server/src/services/learning.service.ts` 的 `getUserLearningRecords()` 的分页+populate 模式

---

#### 4.1.4 `getStats` — 训练统计

```typescript
export async function getStats(
  userId: string,
): Promise<{
  totalQuestions: number;
  correctRate: number;
  recentTrend: number[];
}>
```

**关键逻辑**:

1. **totalQuestions**: `await QuizAttempt.countDocuments({ userId })`

2. **correctRate**:
   ```typescript
   const [total, correctCount] = await Promise.all([
     QuizAttempt.countDocuments({ userId }),
     QuizAttempt.countDocuments({ userId, correct: true }),
   ]);
   const correctRate = total > 0 ? Math.round((correctCount / total) * 100) : 0;
   ```

3. **recentTrend** — 最近 7 天每日答题数（长度固定为 7）:
   - 用 MongoDB aggregate 按日期分组：
     ```typescript
     const sevenDaysAgo = new Date();
     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
     sevenDaysAgo.setHours(0, 0, 0, 0);

     const daily = await QuizAttempt.aggregate([
       {
         $match: {
           userId: new mongoose.Types.ObjectId(userId),
           submittedAt: { $gte: sevenDaysAgo },
         },
       },
       {
         $group: {
           _id: {
             $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" },
           },
           count: { $sum: 1 },
         },
       },
     ]);
     ```
   - 构建长度为 7 的数组（索引 0 = 7 天前，索引 6 = 今天）：
     ```typescript
     const trend: number[] = [];
     for (let i = 6; i >= 0; i--) {
       const d = new Date();
       d.setDate(d.getDate() - i);
       const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
       const entry = daily.find((e) => e._id === key);
       trend.push(entry ? entry.count : 0);
     }
     const recentTrend = trend;  // [7天前, 6天前, ..., 今天]
     ```

4. 无记录用户 → `{ totalQuestions: 0, correctRate: 0, recentTrend: [0,0,0,0,0,0,0] }`

**参考**: `server/src/services/learning.service.ts` 的 `getUserStats()` 中 aggregate 模式

### 4.2 文件 `server/src/services/index.ts`（修改）

- **修改位置**: 替换当前内容
- **当前代码**: `// Service layer — business logic`（仅一行注释）
- **修改后代码**:
  ```typescript
  // Service layer — business logic
  export * from "./quiz.service.js";
  ```
  - 注意：当前 index.ts 没有任何 export，但其他 service（如 auth, learning 等）都是被各自的 route/controller 直接 `import * as xxxService from "../services/xxx.service.js"` 引用的，不需要在 index.ts 集中导出。但为了项目一致性（将来可能统一），这里使用 `export *` 方式。

## 5. 代码规范要求

1. **ESM 模块**：所有 import 使用 `.js` 后缀（如 `import { QuizQuestion } from "../models/QuizQuestion.js"`）
2. **async/await**：不使用 `.then()` / `.catch()` 链式调用
3. **纯函数优先**：判分算法（normalize/words/variantMatches/lcs/shuffle）为纯函数，不依赖外部状态
4. **错误处理**：使用 `AppError`（`import { AppError } from "../utils/errors.js"`），不用 `throw new Error()`
5. **Mongoose**：查询用 `.lean()` 减少开销；构造 ObjectId 用 `new mongoose.Types.ObjectId(id)`；导入用 `import mongoose from "mongoose"`
6. **lean 文档类型转换**：`.lean()` 后的文档需要类型断言（参考 `learning.service.ts` 的 `populate` + `as unknown as {...}` 模式）
7. **TypeScript**: 显式标注函数返回类型，不使用 `any`
8. **不要 import 不存在的模块**: 不要写 `import { config } from "../config/index.js"` 除非确实需要
9. **文件编码**: UTF-8，无 BOM

## 6. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

### generateQuiz
- **TC-001**: direction=zh2en → 返回 10 道 zh2en 题目 ✅
- **TC-002**: direction=en2zh → 返回 `[]`（无 en2zh 数据）✅
- **TC-003**: wordId 优先匹配（flow 的 3 题在前，7 题补齐）✅
- **TC-004**: userId 排除 24h 内已答题目 ✅
- **TC-005**: 全部答完 → 返回 `[]` ✅
- **TC-006**: 匿名用户（无 userId）正常出题 ✅

### judgeAnswer
- **TC-101**: 完全匹配 → score≈100, correct=true, matched=全部关键词 ✅
- **TC-102**: 部分匹配 → score 在 35-65, correct=false ✅
- **TC-103**: 空输入 → score=0 ✅
- **TC-104**: 纯空格 → 与空输入行为一致 ✅
- **TC-105**: 大小写不敏感 ✅
- **TC-106**: 后缀变体匹配（flows→flow）✅
- **TC-107**: 标点符号被 normalize 去除 ✅
- **TC-108**: 已登录用户自动保存 QuizAttempt ✅
- **TC-109**: 匿名用户不保存记录 ✅
- **TC-110**: score≥70 → correct=true; score<70 → correct=false ✅
- **TC-111**: 不存在的 questionId → AppError 404 ✅

### getHistory
- **TC-201**: 按 submittedAt 降序 ✅
- **TC-202**: 默认分页参数 ✅
- **TC-203**: 自定义 page/limit ✅
- **TC-204**: 无历史 → data=[] ✅

### getStats
- **TC-301**: 正确率计算 + recentTrend 含非零值 ✅
- **TC-302**: 无数据 → 全零值 ✅
- **TC-303**: correctRate 整数百分比 ✅

### 集成测试 🔴
- **I-001**: generateQuiz → judgeAnswer → getHistory → getStats 完整链路 ✅
- **I-002**: 种子数据驱动判分（q2 keywords 验证）✅

## 7. 集成验证指令 🔴

> 代码写完后，执行以下验证。本 Task 仅创建服务层，验证时直接 import 服务函数调用（暂不走 HTTP）。

### 7.1 自检清单

- [ ] `server/src/services/quiz.service.ts` 存在且导出 4 个函数
- [ ] `server/src/services/index.ts` 导出 quiz 相关函数
- [ ] `npx tsc --noEmit` 无编译错误

### 7.2 链路验证

```bash
# 1. 确认种子数据就绪
node -e "
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/english-dictionary');
  const count = await mongoose.model('QuizQuestion').countDocuments();
  console.log('QuizQuestion count:', count);  # 期望: 20
  await mongoose.disconnect();
})();
"
```

### 7.3 服务层手动验证

可以用 `node` REPL 或临时脚本直接调用服务函数验证：

```typescript
// 临时验证脚本 (server/src/__test_quiz.ts, 不提交)
import mongoose from "mongoose";
import { config } from "./config/index.js";
import { generateQuiz, judgeAnswer, getHistory, getStats } from "./services/quiz.service.js";

await mongoose.connect(config.mongodbUri);

// 1. generateQuiz
const questions = await generateQuiz("zh2en");
console.assert(questions.length === 10, "应为 10 道题");
console.assert(questions.every(q => q.direction === "zh2en"), "应全是 zh2en");

// 2. judgeAnswer (完美答案)
const q = questions[0];
const result = await judgeAnswer(String(q._id), q.reference);
console.assert(result.correct === true, "完美答案应判对");
console.assert(result.score >= 90, "完美答案应得分 >= 90");

// 3. judgeAnswer (空输入)
const empty = await judgeAnswer(String(q._id), "");
console.assert(empty.score === 0 && empty.correct === false, "空输入应 0 分");

console.log("All assertions passed!");
await mongoose.disconnect();
```

### 7.4 集成用例 I-001 验证

```typescript
// 注入 seed 管理员用户的 _id 后运行
const userId = "<seed admin user _id>";

const questions = await generateQuiz("zh2en", undefined, userId);
console.assert(questions.length === 10, "Step 1: 10 题");

const r1 = await judgeAnswer(String(questions[0]._id), questions[0].reference, userId);
console.assert(r1.correct === true, "Step 2: 正确");

const r2 = await judgeAnswer(String(questions[1]._id), "wrong answer", userId);
console.assert(r2.correct === false, "Step 3: 错误");

const history = await getHistory(userId);
console.assert(history.data.length === 2, "Step 4: 2 条记录");

const stats = await getStats(userId);
console.assert(stats.totalQuestions === 2, "Step 5: 2 题");
console.assert(stats.correctRate === 50, "Step 5: 50% 正确率");
```

## 8. 注意事项

1. **前后端算法一致性** 🔴：`normalize`/`words`/`variantMatches`/`lcs` 必须与 `client/src/data/quizEngine.ts` **逐行一致**。特别注意：
   - `normalize` 末尾标点正则 `/[.!?。！？]+$/g` 只去除末尾，不去中间的标点
   - `words` 正则 `/[a-z]+(?:'[a-z]+)?/g` 支持缩略形式 like `don't`
   - `variantMatches` 去后缀正则 `/(s|es|ed|ing)$/` — 注意 `es` 在 `s` 之前（否则会先匹配 s 导致错误）
   - `lcs` 是**单词级别**的 LCS（数组），不是字符串级别的 LCS

2. **userId 处理**：服务层的 `userId` 参数是 `string`，存入 QuizAttempt 时需转为 `new mongoose.Types.ObjectId(userId)`。查询时 Mongoose 会自动转换字符串为 ObjectId（如 `QuizAttempt.find({ userId })`），但 aggregate 中**不会**自动转换，必须在 `$match` 中显式 `new mongoose.Types.ObjectId(userId)`。

3. **quizAttempt 保存失败不阻塞判分**：如果 `userId` 存在但 QuizAttempt.create 失败（如用户 ID 无效），不要影响判分结果的返回。用 try-catch 包裹保存逻辑，失败时 `console.error` 日志即可。

4. **Mongoose `.lean()` 的 TS 类型**：`.lean()` 后返回的是 POJO（不是 Mongoose Document），类型上需要手动处理。参考 `learning.service.ts:78` 的 `as unknown as {...}` 模式。

5. **QuizQuestion Schema 的 direction 字段**：枚举值为 `"zh2en"` | `"en2zh"`（小写），前端代码一致。

6. **不要修改 quizEngine.ts**：前端算法保持不变（Task 2.1 才会替换前端为 API 调用）。本次任务的服务端判分是一个独立实现，与前端算法保持行为一致即可。

7. **不要创建 controller/route/validator**：这些是 Task 1.2 的职责。本 Task 只产出服务层代码。
