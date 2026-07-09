# Coding Prompt — Task 5.2: 今日一词推荐与管理后台概览

---

## 1. 任务目标

实现"今日一词"服务端智能推荐算法（替换前端随机取模）+ 管理后台首页 Dashboard 数据概览 API，并完成前后端对接。

---

## 2. 技术上下文

- **后端语言/框架**: Node.js 18+ / Express + TypeScript + Mongoose
- **前端框架**: Taro 3.6 + React 18 + TypeScript
- **数据库**: MongoDB Atlas（Mongoose ODM）
- **认证**: JWT Bearer Token（`authMiddleware` + `adminMiddleware`，已就绪）
- **API 前缀**: `/api/v1`
- **目录结构**: Monorepo（`server/` + `client/`）

### 涉及文件总览

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| **新建** | `server/src/models/DailyWord.ts` | 今日一词 Mongoose 模型 |
| 修改 | `server/src/models/index.ts` | 导出 DailyWord 模型 |
| **新建** | `server/src/services/daily-word.service.ts` | 今日一词推荐 + 置顶业务逻辑 |
| **新建** | `server/src/services/dashboard.service.ts` | Dashboard 统计聚合逻辑 |
| **新建** | `server/src/controllers/daily-word.controller.ts` | 今日一词请求处理器 |
| **新建** | `server/src/controllers/dashboard.controller.ts` | Dashboard 请求处理器 |
| **新建** | `server/src/routes/daily-word.routes.ts` | 今日一词路由 |
| **新建** | `server/src/routes/dashboard.routes.ts` | Dashboard 路由 |
| 修改 | `server/src/routes/index.ts` | 注册新路由 |
| **新建** | `client/src/api/daily-word.ts` | 前端 daily-word API 函数 |
| **新建** | `client/src/api/dashboard.ts` | 前端 dashboard API 函数 |
| 修改 | `client/src/api/index.ts` | 导出新 API 模块 |
| 修改 | `client/src/pages/home/index.tsx` | 今日一词从 API 获取 |
| 修改 | `client/src/pages/admin/index.tsx` | 概览页对接 Dashboard API |

### 现有代码模式（必须遵循）

**Controller 模式**：使用 `asyncHandler` 包裹异步 handler，调用 service 函数返回结果：
```typescript
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as xxxService from "../services/xxx.service";

export const someAction = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const result = await xxxService.someFunction(/* params */);
    res.json(result);
  }
);
```

**Service 模式**：从 models 导入，使用 `AppError` 处理异常：
```typescript
import { AppError } from "../utils/errors";
import { SomeModel } from "../models";
```

**Route 模式**：使用 `authMiddleware` + `adminMiddleware`（已有的 public API 不需要）：
```typescript
import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware";
router.get("/route", authMiddleware, adminMiddleware, controller.method);
```

**前端 API 模式**：使用 `request<T>(path, options)` 封装，位于 `client/src/api/request.ts`。

---

## 3. 实现要求

### 3.1 文件 `server/src/models/DailyWord.ts`（新建）

**类/模型名**: `DailyWord`

**Mongoose Schema**:
```typescript
{
  date: { type: String, required: true, unique: true },  // "YYYY-MM-DD"
  wordId: { type: Schema.Types.ObjectId, ref: "Word", required: true },
  isPinned: { type: Boolean, default: false },
  pinnedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  pinnedAt: { type: Date, default: null },
  // timestamps: true 自动生成 createdAt/updatedAt
}
```

**索引策略**：
- `date`: unique index（每天只有一条记录）

**关键逻辑**：此模型存储每天选中的今日一词。一天内重复请求返回同一 document。每天首次请求时根据推荐算法创建新记录。

### 3.2 文件 `server/src/models/index.ts`（修改）

**修改内容**：在现有 exports 末尾增加：
```typescript
export { DailyWord } from "./DailyWord";
export type { IDailyWord } from "./DailyWord";
```

### 3.3 文件 `server/src/services/daily-word.service.ts`（新建）

**导出函数**：

#### `getDailyWord(userId?: string): Promise<{ word: IWord | null; date: string; isPinned: boolean }>`

**职责**：获取当天的今日一词。如果当天记录已存在则直接返回；否则运行推荐算法选择单词并持久化。

**关键逻辑**：
1. 计算当天日期 `YYYY-MM-DD`（使用 `new Date().toISOString().slice(0, 10)`）
2. 查询 `DailyWord.findOne({ date: today })`，如果存在：
   - 用 `wordId` populate Word 文档
   - 返回 `{ word, date, isPinned }`
3. 如果不存在（当天首次请求），运行推荐算法：
   - **Step 3a**：获取全部单词 `Word.find({})`
   - **Step 3b**：如果单词数为 0 → 返回 `{ word: null, date, isPinned: false }`
   - **Step 3c**：如果 `userId` 已传入（用户已登录），查询该用户的 `LearningRecord` 中所有的 `wordId` 列表
   - **Step 3d**：查询最近 30 天的 `DailyWord` 记录，获取 `wordId` 列表作为"近期已推荐"集合
   - **Step 3e**：构建候选池，按优先级：
     1. 优先未学单词（排除 User.learnedWords 中的 wordId）
     2. 排除最近 7 天已推荐的单词（冷却窗口）
     3. 如果候选池为空 → 从全部单词中排除最近 7 天已推荐的
     4. 如果仍为空 → 从全部单词中选最久未被推荐的（即按 DailyWord.date 升序取最早被推荐的）
   - **Step 3f**：从候选池随机选一个单词
   - **Step 3g**：创建 `DailyWord` 记录并返回

**错误处理**：
- 单词数为 0 时返回 `word: null` 而非抛错（公开接口，让前端自行处理空状态）
- MongoDB 操作异常直接 `throw`

#### `pinDailyWord(wordId: string, adminId: string): Promise<{ success: boolean; wordId: string; pinnedAt: Date }>`

**职责**：管理员将指定单词置顶为今日一词（当天有效）。

**关键逻辑**：
1. 校验 `wordId` 是否为有效 ObjectId（参考 `word.service.ts` 中 `ensureValidId` 方法）
2. 查询 `Word.findById(wordId)`，不存在则 `throw new AppError(404, "NOT_FOUND", "单词不存在")`
3. 计算当天日期 `YYYY-MM-DD`
4. 使用 `DailyWord.findOneAndUpdate` upsert：更新或创建当天记录，设置 `isPinned: true, pinnedBy: adminId, pinnedAt: new Date()`
5. 返回 `{ success: true, wordId, pinnedAt }`

### 3.4 文件 `server/src/services/dashboard.service.ts`（新建）

**导出函数**：

#### `getDashboard(): Promise<DashboardData>`

**DashboardData 类型**：
```typescript
interface DashboardData {
  wordbankCount: number;
  wordCount: number;
  userCount: number;
  newWordsTrend: Array<{ date: string; count: number }>;
  newUsersTrend: Array<{ date: string; count: number }>;
}
```

**关键逻辑**：
1. 并行查询三个计数：
   - `WordBank.countDocuments({})`
   - `Word.countDocuments({})`
   - `User.countDocuments({})`
2. 计算 7 天趋势（今天往前推 6 天，共 7 天）：
   - 确定日期范围：`[today - 6 days, today]`，使用 `Date` 对象计算
   - 对 Word 集合按天聚合新增数量（按 `createdAt` 分组），使用 Mongoose `aggregate` 的 `$match` + `$group`
   - 对 User 集合同样操作
   - 填充缺失日期 count 为 0（确保每天都有数据点，即使为 0）
   - 日期格式用 `YYYY-MM-DD` 字符串
   - 按日期升序排列

**MongoDB aggregate 示例**（用于趋势查询）：
```typescript
const today = new Date();
today.setHours(23, 59, 59, 999);
const sevenDaysAgo = new Date(today);
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
sevenDaysAgo.setHours(0, 0, 0, 0);

const wordTrend = await Word.aggregate([
  { $match: { createdAt: { $gte: sevenDaysAgo, $lte: today } } },
  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
  { $sort: { _id: 1 } },
]);
```

然后将 aggregate 结果映射为 7 天的完整数组（缺失日期补 0）。

### 3.5 文件 `server/src/controllers/daily-word.controller.ts`（新建）

**导出函数**：

#### `getDailyWord`
- 可选认证：`req.user?.userId` 传入 service（无 token 则传入 undefined）
- 调用 `dailyWordService.getDailyWord(req.user?.userId)`
- 返回 `res.json({ word, date, isPinned })`

#### `pinDailyWord`
- 调用 `dailyWordService.pinDailyWord(req.body.wordId, req.user!.userId)`
- 返回 `res.json(result)`

### 3.6 文件 `server/src/controllers/dashboard.controller.ts`（新建）

#### `getDashboard`
- 调用 `dashboardService.getDashboard()`
- 返回 `res.json(result)`

### 3.7 文件 `server/src/routes/daily-word.routes.ts`（新建）

```typescript
import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware";
import * as dailyWordController from "../controllers/daily-word.controller";

const router = Router();

// GET /api/v1/daily-word — 公开接口，但可选认证（使用 optionalAuth）
router.get("/", dailyWordController.getDailyWord);

// POST /api/v1/daily-word/pin — 管理员置顶
router.post("/pin", authMiddleware, adminMiddleware, dailyWordController.pinDailyWord);

export const dailyWordRoutes = router;
```

> **注意**：`GET /api/v1/daily-word` 是公开接口，但为了支持已登录用户获取个性化推荐，需要能从 `req.user` 读取 userId。因此控制器内部需要处理 `req.user` 可选的情况（无用户时 `req.user` 为 undefined）。可以考虑使用现有的 `optionalAuth` 中间件，或直接用 `authMiddleware` 的变体。当前项目已有 `optionalAuth` 中间件（见 `server/src/middleware/auth.ts`），使用它。

### 3.8 文件 `server/src/routes/dashboard.routes.ts`（新建）

```typescript
import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware";
import * as dashboardController from "../controllers/dashboard.controller";

const router = Router();

// GET /api/v1/admin/dashboard — 管理员专属
router.get("/", authMiddleware, adminMiddleware, dashboardController.getDashboard);

export const dashboardRoutes = router;
```

### 3.9 文件 `server/src/routes/index.ts`（修改）

**修改内容**：注册新路由。

在当前 `routes.use("/", aiRoutes);` 之后、`routes.use("/words", wordRoutes);` 之前增加：

```typescript
import { dailyWordRoutes } from "./daily-word.routes";
import { dashboardRoutes } from "./dashboard.routes";
// ...
routes.use("/daily-word", dailyWordRoutes);
routes.use("/admin/dashboard", dashboardRoutes);
```

> 需要精确匹配路由顺序。`/api/v1/daily-word` 和 `/api/v1/admin/dashboard`，注意 `daily-word` 不会与已有 `/words` 冲突。

### 3.10 文件 `client/src/api/daily-word.ts`（新建）

**导出类型**：
```typescript
export interface DailyWordResponse {
  word: {
    id: string;
    word: string;
    phonetic: string;
    coreMeaning: string;
    coreImageType: string;        // physicalImageType
    coreImageDescription: string; // physicalImageDescription
  } | null;
  date: string;
  isPinned: boolean;
}
```

> 注意：后端返回的是 Mongoose 文档（含 `_id`），前端需要做适配（`_id` → `id`，`physicalImageType` → `coreImageType`），参考 `client/src/api/adapters.ts` 中的 `adaptWord` 函数。

**导出函数**：

#### `fetchDailyWord(): Promise<DailyWordResponse>`
- `GET /api/v1/daily-word`
- 使用 `request<DailyWordResponse>("/api/v1/daily-word")`
- 适配后端返回的字段名到前端字段名

### 3.11 文件 `client/src/api/dashboard.ts`（新建）

**导出类型**：
```typescript
export interface DashboardResponse {
  wordbankCount: number;
  wordCount: number;
  userCount: number;
  newWordsTrend: Array<{ date: string; count: number }>;
  newUsersTrend: Array<{ date: string; count: number }>;
}
```

**导出函数**：

#### `fetchDashboard(): Promise<DashboardResponse>`
- `GET /api/v1/admin/dashboard`
- 使用 `request<DashboardResponse>("/api/v1/admin/dashboard")`
- 无需适配（字段名就是后端设计的最终字段）

### 3.12 文件 `client/src/api/index.ts`（修改）

**修改内容**：在现有导出中追加：

```typescript
export { fetchDailyWord } from "./daily-word";
export type { DailyWordResponse } from "./daily-word";
export { fetchDashboard } from "./dashboard";
export type { DashboardResponse } from "./dashboard";
```

### 3.13 文件 `client/src/pages/home/index.tsx`（修改）

**修改位置**：`loadData` 函数（第 28 行）及 `todayWord` 状态初始化逻辑。

**当前逻辑**（第 37-42 行）：
```typescript
// 今日一词：按日期伪随机
if (wordResult.words.length > 0) {
  const idx = Math.floor(Date.now() / 86400000) % wordResult.words.length;
  setTodayWord(wordResult.words[idx]);
}
```

**修改后逻辑**：
1. 新增一个独立的 `loadDailyWord` 函数
2. 在 `loadData` 中并行调用 `fetchDailyWord()` 和 `fetchWords()/fetchWordbanks()`
3. 当 `fetchDailyWord()` 返回 `word` 时，按 Word 类型构造（适配字段）
4. 当 `fetchDailyWord()` 返回 `word: null` 时，`todayWord` 设为 null
5. 当 API 调用失败时（catch），静默降级为 `todayWord = null`（不阻塞页面其余内容）

**具体变更**：
- 将 `setTodayWord(wordResult.words[idx])` 改为基于 `fetchDailyWord()` 结果
- 删除伪随机取模逻辑 `Math.floor(Date.now() / 86400000) % wordResult.words.length`
- 今日一词 API 调用独立于列表数据加载（即使 API 失败，列表仍能正常展示）

**注意**：`fetchDailyWord()` 返回的字段是后端风格（如 `_id`、`physicalImageType`），需要转换为前端 `Word` 类型（`id`、`coreImageType`），参见 `adaptWord` 函数的模式。

### 3.14 文件 `client/src/pages/admin/index.tsx`（修改）

**修改位置**：`Overview` 组件（第 75 行）和 `AdminPage` 主组件的 `loadAllData` 函数（第 859 行）。

**当前逻辑**：
- Overview 组件接收 `libraries: WordLibrary[]`, `words: Word[]`, `users: User[]` 三个数组
- 概览卡片使用 `libraries.length`, `words.length`, `users.length` 展示数据
- 数据来自 `loadAllData` 中全量加载的 `fetchWordbanks`/`fetchWords`/`fetchUsers`

**修改后逻辑**：
1. **新增独立的 Dashboard 数据加载**：
   - 在 `AdminPage` 组件中新增一个 state: `const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)`
   - 在 `loadAllData` 中（或作为一个独立 effect），同时调用 `fetchDashboard()`
   - Dashboard 数据用于 `Overview` 组件中的统计卡片

2. **修改 Overview 组件**：
   - 新增 prop: `dashboard: DashboardResponse | null`
   - 卡片统计改用 dashboard 数据：`wordbankCount`, `wordCount`, `userCount`
   - 可选：在概览卡片下方展示 7 天趋势（用简单的文本或迷你柱状图）。如果趋势展示复杂可以暂不实现，先展示计数数据。
   - Dashboard 加载失败或为 null 时，卡片显示 `-` 或 `--` 占位

3. **保留现有的全量数据加载**（词库/单词/用户管理仍需要全量数据）
   - Dashboard API 只负责概览卡片的统计数据
   - 管理子页面（词库管理、单词管理、用户管理）仍使用已有的全量数据

4. **错误处理**：
   - Dashboard API 失败时，概览卡片显示 "加载失败" 或 `--`，不阻断管理后台其他功能

---

## 4. 代码规范要求

- 使用 `async/await` 而非 `Promise.then`
- Controller 统一使用 `asyncHandler` 包裹
- Service 层错误使用 `AppError` 类（code 字段使用 `NOT_FOUND`、`FORBIDDEN` 等大写 snake_case）
- 遵循 RESTful API 命名规范（已在 ADR 中定义）
- 前端 API 模块统一使用 `request<T>` 封装
- TypeScript 严格类型，所有函数标注返回类型
- ObjectId 有效性检查使用 `mongoose.Types.ObjectId.isValid(id)`
- 使用 `new Date().toISOString().slice(0, 10)` 获取 `YYYY-MM-DD` 格式日期

---

## 5. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 用例 | 关键验证点 |
|------|-----------|
| TC-001 | `GET /api/v1/daily-word` 返回含 `{ word, date }` 的 200 响应 |
| TC-002 | 同一天两次请求返回相同 `word.id` |
| TC-003 | 跨天后推荐不同单词（冷却窗口机制） |
| TC-004 | 登录用户优先看到未学单词 |
| TC-005 | 全部已学时仍返回单词（兜底策略不抛错） |
| TC-006 | 单词数为 0 时返回 `word: null` |
| TC-007 | 管理员置顶后 daily-word 返回被置顶单词 + `isPinned: true` |
| TC-008 | 普通用户 POST /pin → 403 |
| TC-009 | 未登录 POST /pin → 401 |
| TC-010 | 置顶不存在的 wordId → 404 |
| TC-011 | 置顶跨天后自动失效 |
| TC-013 | Dashboard 返回 wordbankCount/wordCount/userCount + 7 天趋势 |
| TC-014 | 空系统 Dashboard 返回 count=0 且趋势正确 |
| TC-015 | 普通用户 GET /admin/dashboard → 403 |
| TC-016 | 未登录 GET /admin/dashboard → 401 |
| TC-017 | 7 天趋势日期范围和 count 准确（不含第 8 天） |
| TC-019 | 前端首页调用 API 而非 Math.floor 取模 |
| TC-020 | API 失败时今日一词卡片不展示，其余页面正常 |
| TC-021 | 管理后台概览卡片用 Dashboard 数据填充 |

---

## 6. 注意事项

1. **`optionalAuth` 中间件**：`GET /api/v1/daily-word` 需要可选的认证 — 已登录用户传 userId 以个性化推荐，未登录用户正常返回通用推荐。使用已有的 `optionalAuth` 中间件（位于 `server/src/middleware/auth.ts`）。

2. **置顶优先级**：`pinDailyWord` 当天调用后，立即覆盖当天已有记录。下一次 `GET /api/v1/daily-word` 直接返回置顶单词。

3. **跨天逻辑**：不使用内存 Map 缓存（服务重启丢失），通过 `DailyWord` collection 中的 `date` 字段区分。服务重启后当天记录仍在数据库中，不会重复生成。

4. **冷却窗口大小**：推荐算法中"冷却窗口"使用 7 天（最近 7 天已推荐的单词排除）。单词总数不足 7 时冷却窗口自动缩小。

5. **Dashboard 时区**：使用服务器本地时区计算日期范围（`new Date()` 的本地时间），保持一致性。

6. **前端降级**：首页的今日一词 API 失败时不阻塞页面其余功能（搜索、全部词汇列表）。管理后台 Dashboard 失败时概览卡片显示占位符，不影响词库/单词/用户管理功能。

7. **不要误删现有功能**：修改 `home/index.tsx` 和 `admin/index.tsx` 时，仅替换与今日一词/概览数据源相关的逻辑，不要改动 UI 样式和其他功能代码。

8. **字段名映射（后端→前端）**：后端 Word 文档使用 `_id`、`physicalImageType`、`physicalImageDescription`、`wordbankId`；前端 Word 类型使用 `id`、`coreImageType`、`coreImageDescription`、`libraryId`。在 `fetchDailyWord` 返回结果中需做适配。

9. **DailyWord 的 date 唯一索引**：Mongoose schema 中 `date` 字段设为 `unique: true`，配合 `findOneAndUpdate` upsert 确保每天只有一条记录，避免并发创建重复文档。
