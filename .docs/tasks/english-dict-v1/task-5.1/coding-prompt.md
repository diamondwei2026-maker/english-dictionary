# Coding Prompt — Task 5.1: 学习记录与收藏功能

## 1. 任务目标

实现用户学习记录追踪和单词收藏功能：后端提供学习记录/收藏 API，前端对接收藏按钮、学习统计和收藏列表。

## 2. 技术上下文

- **语言/框架**: TypeScript + Express 4 + Mongoose (后端)，TypeScript + React 18 + Taro 3.6.23 (前端)
- **涉及文件**:

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `server/src/services/learning.service.ts` | 学习记录业务逻辑 |
| 新建 | `server/src/services/favorite.service.ts` | 收藏业务逻辑 |
| 新建 | `server/src/controllers/learning.controller.ts` | 学习记录控制器 |
| 新建 | `server/src/validators/learning.validator.ts` | 学习记录输入校验 |
| 修改 | `server/src/controllers/user.controller.ts` | 新增 stats、favorites、learningRecords |
| 修改 | `server/src/controllers/word.controller.ts` | 新增 learn、favorite、unfavorite |
| 修改 | `server/src/routes/user.routes.ts` | 新增学习/收藏路由 |
| 修改 | `server/src/routes/word.routes.ts` | 新增 learn/favorite 路由 |
| 修改 | `server/src/services/word.service.ts` | getWordById 返回 isFavorited + learnCount |
| 新建 | `client/src/api/learning.ts` | 前端学习 API 模块 |
| 新建 | `client/src/api/favorites.ts` | 前端收藏 API 模块 |
| 修改 | `client/src/api/index.ts` | 导出新模块 |
| 修改 | `client/src/api/users.ts` | 新增 getUserStats |
| 修改 | `client/src/pages/word-detail/index.tsx` | 收藏按钮 + 自动学习记录 |
| 修改 | `client/src/pages/profile/index.tsx` | 真实学习统计 + 收藏列表入口 |

- **数据库表**: `LearningRecord`（已有模型）、`UserFavorite`（已有模型）、`User`（learnedWords/favoriteWords 数组）

## 3. 实现要求

### 3.1 后端 — 学习记录服务 `server/src/services/learning.service.ts`（新建）

- **函数**: `recordLearn(userId: string, wordId: string): Promise<{ learnCount: number; lastLearnedAt: Date }>`
- **职责**: 记录/更新用户对某单词的学习
- **关键逻辑**:
  1. 校验 wordId 格式（`mongoose.Types.ObjectId.isValid`）
  2. 校验单词存在（`Word.findById`），不存在抛 `AppError(404, "NOT_FOUND", "单词不存在")`
  3. `LearningRecord.findOneAndUpdate` 做 upsert：`{ $inc: { learnCount: 1 }, $set: { lastLearnedAt: new Date() } }`，`{ upsert: true, new: true }`
  4. `User.findByIdAndUpdate` 将 wordId `$addToSet` 到 `learnedWords` 数组
  5. 返回 `{ learnCount, lastLearnedAt }`
  6. 使用 `Promise.all` 并行执行 upsert 和 User 更新

- **错误处理**: wordId 无效 → `AppError(400)`；单词不存在 → `AppError(404)`

- **函数**: `getUserLearningRecords(userId: string, page: number, pageSize: number): Promise<{ data: ...[]; pagination: ... }>`
- **职责**: 获取用户学习记录列表，按 lastLearnedAt 降序
- **关键逻辑**:
  1. `LearningRecord.find({ userId }).sort({ lastLearnedAt: -1 }).skip(...).limit(...)`
  2. `populate("wordId", "word coreMeaning phonetic")` 填充单词基本信息
  3. 返回格式 `{ data: [...], pagination: { total, page, pageSize, totalPages } }`
  4. 每条记录映射为 `{ wordId, word: record.wordId.word, coreMeaning: record.wordId.coreMeaning, learnCount, lastLearnedAt }`

- **函数**: `getUserStats(userId: string): Promise<{ totalWordsLearned: number; totalLearningDays: number; todayLearnedCount: number }>`
- **职责**: 聚合用户学习统计
- **关键逻辑**:
  1. `totalWordsLearned`: `LearningRecord.countDocuments({ userId })`
  2. `totalLearningDays`: 使用 `distinct` 对 `lastLearnedAt` 做日期分组统计，或 aggregate pipeline: `$match → $group → $count`，按 `{ $dateToString: { format: "%Y-%m-%d", date: "$lastLearnedAt" } }` 去重
  3. `todayLearnedCount`: `LearningRecord.countDocuments({ userId, lastLearnedAt: { $gte: todayStart } })`，`todayStart` 为当天 00:00:00
  4. 三个查询用 `Promise.all` 并行

### 3.2 后端 — 收藏服务 `server/src/services/favorite.service.ts`（新建）

- **函数**: `favoriteWord(userId: string, wordId: string): Promise<{ favorited: boolean }>`
- **职责**: 收藏单词（幂等）
- **关键逻辑**:
  1. 校验 wordId 有效 + 单词存在
  2. `UserFavorite.findOneAndUpdate({ userId, wordId }, {}, { upsert: true, new: true, setDefaultsOnInsert: true })` — 幂等创建
  3. `User.findByIdAndUpdate(userId, { $addToSet: { favoriteWords: wordId } })`
  4. 返回 `{ favorited: true }`
  5. HTTP 状态码 201（新建）/ 200（已存在 — 幂等返回 200 即可）

- **函数**: `unfavoriteWord(userId: string, wordId: string): Promise<{ favorited: boolean }>`
- **职责**: 取消收藏
- **关键逻辑**:
  1. `UserFavorite.findOneAndDelete({ userId, wordId })`
  2. `User.findByIdAndUpdate(userId, { $pull: { favoriteWords: wordId } })`
  3. 返回 `{ favorited: false }`

- **函数**: `getUserFavorites(userId: string, page: number, pageSize: number): Promise<{ data: ...[]; pagination: ... }>`
- **职责**: 获取用户收藏列表，按收藏时间降序
- **关键逻辑**:
  1. `UserFavorite.find({ userId }).sort({ createdAt: -1 }).skip(...).limit(...)`
  2. `populate("wordId")` 填充完整单词对象
  3. 每条映射为完整的 Word 对象（用 `adaptWord` 兼容格式）
  4. 返回分页数据

### 3.3 后端 — 输入校验 `server/src/validators/learning.validator.ts`（新建）

参考 `ai.validator.ts` 模式，提供两个函数：

- **`validateLearnInput(body: unknown): { wordId: string }`**: 校验 wordId 为必填、长度 24 的 hex 字符串
- **`validateFavoriteInput(body: unknown): { wordId: string }`**: 同上（收藏接口可能不需要 body，wordId 从 URL params 取 — 但保持一致性可留空）

实际这两个接口的 wordId 来自 URL params，Express 已做路由匹配，不需要 body 校验。本 validator 可仅导出 `ensureValidWordId(id: string)` 工具函数。

### 3.4 后端 — 控制器

#### `server/src/controllers/learning.controller.ts`（新建）

```typescript
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as learningService from "../services/learning.service";

// POST /api/v1/words/:id/learn
export const learn = asyncHandler(async (req, res, _next) => {
  const result = await learningService.recordLearn(req.user!.userId, req.params.id);
  res.json(result);
});

// GET /api/v1/user/learning-records
export const getLearningRecords = asyncHandler(async (req, res, _next) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
  const result = await learningService.getUserLearningRecords(req.user!.userId, page, pageSize);
  res.json(result);
});

// GET /api/v1/user/stats
export const getStats = asyncHandler(async (req, res, _next) => {
  const stats = await learningService.getUserStats(req.user!.userId);
  res.json(stats);
});
```

#### `server/src/controllers/user.controller.ts`（修改）

新增三个 handler：

- **`getStats`**: 委托 `learningService.getUserStats`（与 learning.controller 中相同逻辑，写在 user.controller 中以便统一用户路由）
- **`getFavorites`**: 委托 `favoriteService.getUserFavorites`
- **`getLearningRecords`**: 委托 `learningService.getUserLearningRecords`

或者，在 `user.routes.ts` 中直接 import learning/favorite service 并在路由的箭头函数中调用，保持 controller 的薄层风格。推荐方案：在 user.controller 中新增 3 个 handler。

#### `server/src/controllers/word.controller.ts`（修改）

新增三个 handler：

```typescript
// POST /api/v1/words/:id/learn
export const learn = asyncHandler(async (req, res, _next) => {
  const result = await learningService.recordLearn(req.user!.userId, req.params.id);
  res.json(result);
});

// POST /api/v1/words/:id/favorite
export const favorite = asyncHandler(async (req, res, _next) => {
  const result = await favoriteService.favoriteWord(req.user!.userId, req.params.id);
  res.status(201).json(result);
});

// DELETE /api/v1/words/:id/favorite
export const unfavorite = asyncHandler(async (req, res, _next) => {
  const result = await favoriteService.unfavoriteWord(req.user!.userId, req.params.id);
  res.json(result);
});
```

### 3.5 后端 — 路由注册

#### `server/src/routes/word.routes.ts`（修改）

在现有 `wordRoutes` 路由后追加（注意：这些路由须在 `router.get("/:id", ...)` 之前注册，避免 `POST /words/:id/learn` 被 `:id` 捕获为 learn）：

```typescript
// 学习与收藏（需登录）
router.post("/:id/learn", authMiddleware, wordController.learn);
router.post("/:id/favorite", authMiddleware, wordController.favorite);
router.delete("/:id/favorite", authMiddleware, wordController.unfavorite);
```

**关键**: 这些路由注册位置必须在 `router.get("/:id", ...)` **之前**，否则 Express 会把 `POST /words/abc123/learn` 中的 `abc123` 匹配为 `:id` 参数，然后找不到对应的 `POST /:id` handler（不存在）而 404。

#### `server/src/routes/user.routes.ts`（修改）

```typescript
router.get("/stats", authMiddleware, userController.getStats);
router.get("/favorites", authMiddleware, userController.getFavorites);
router.get("/learning-records", authMiddleware, userController.getLearningRecords);
```

### 3.6 后端 — word.service.ts `getWordById` 增强

修改 `getWordById` 函数，在返回的 Word 对象上附加 `isFavorited` 和 `learnCount` 字段（仅在用户已登录时查询）。

当前签名 `getWordById(id: string, isAdmin?: boolean): Promise<IWord>` 不需要改签名。利用 controller 层中 `req.user` 信息处理。**推荐方案**：在 controller 的 `getById` handler 中，获取 word 后额外查询 UserFavorite 和 LearningRecord：

```typescript
// 在 word.controller.ts getById 中
export const getById = asyncHandler(async (req, res, _next) => {
  const isAdmin = req.user?.role === "admin";
  const word = await wordService.getWordById(req.params.id, isAdmin);
  
  // 附加用户相关状态
  let isFavorited = false;
  let learnCount = 0;
  if (req.user?.userId) {
    const [fav, lr] = await Promise.all([
      UserFavorite.findOne({ userId: req.user.userId, wordId: req.params.id }),
      LearningRecord.findOne({ userId: req.user.userId, wordId: req.params.id }),
    ]);
    isFavorited = !!fav;
    learnCount = lr?.learnCount ?? 0;
  }
  
  res.json({ ...word.toObject(), isFavorited, learnCount });
};
```

### 3.7 前端 — API 模块

#### `client/src/api/learning.ts`（新建）

```typescript
import { request } from "./request";

export async function recordLearn(wordId: string): Promise<{ learnCount: number; lastLearnedAt: string }> {
  return request(`/api/v1/words/${wordId}/learn`, { method: "POST" });
}

export async function fetchLearningRecords(params: { page?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  return request(`/api/v1/user/learning-records?${query.toString()}`);
}

export async function fetchUserStats(): Promise<{
  totalWordsLearned: number;
  totalLearningDays: number;
  todayLearnedCount: number;
}> {
  return request("/api/v1/user/stats");
}
```

#### `client/src/api/favorites.ts`（新建）

```typescript
import { request } from "./request";
import { adaptWord } from "./adapters";
import type { Word } from "../data/types";

export async function favoriteWord(wordId: string): Promise<{ favorited: boolean }> {
  return request(`/api/v1/words/${wordId}/favorite`, { method: "POST" });
}

export async function unfavoriteWord(wordId: string): Promise<{ favorited: boolean }> {
  return request(`/api/v1/words/${wordId}/favorite`, { method: "DELETE" });
}

export async function fetchFavorites(params: { page?: number; pageSize?: number }): Promise<{
  data: Word[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const res = await request<{ data: any[]; pagination: any }>(`/api/v1/user/favorites?${query.toString()}`);
  return { data: res.data.map(adaptWord), pagination: res.pagination };
}
```

#### `client/src/api/index.ts`（修改）

新增导出：
```typescript
export { recordLearn, fetchLearningRecords, fetchUserStats } from "./learning";
export { favoriteWord, unfavoriteWord, fetchFavorites } from "./favorites";
```

### 3.8 前端 — 单词详情页 `client/src/pages/word-detail/index.tsx`（修改）

#### 3.8.1 自动记录学习

在 `loadWord` 成功获取单词后，异步调用 `recordLearn`（不阻塞渲染）：

```typescript
// 在 setWord(w) 之后
if (wordId) {
  recordLearn(wordId).catch(() => { /* 静默忽略——学习记录失败不影响浏览 */ });
}
```

**去重**: 使用 `useRef` 记录当前页面已记录的 wordId，防止 React Strict Mode 双重 useEffect 导致重复记录。

```typescript
const learnedRef = useRef<string | null>(null);
// 在 loadWord 成功回调中:
if (wordId && learnedRef.current !== wordId) {
  learnedRef.current = wordId;
  recordLearn(wordId).catch(() => {});
}
```

#### 3.8.2 收藏按钮

在页面 Header 右侧或正文区域添加收藏按钮。**推荐位置**：在单词标题旁边（第 182-190 行的 word heading 区域），与音标并列。

新增 state：
```typescript
const [isFavorited, setIsFavorited] = useState(false);
const [favLoading, setFavLoading] = useState(false);
```

在 `loadWord` 成功回调中，从 API 响应中读取 `isFavorited`（后端已增强 getWordById 返回此字段）。注意：`fetchWordById` 返回的是 `Word` 类型，需要检查后端响应是否包含 `isFavorited`。**方案**：`adaptWord` 不处理 `isFavorited`，因此在 word-detail 页面中直接对 response 做 `as any` 读取，或修改 `fetchWordById` 返回类型。

推荐直接修改 `loadWord` 中使用 `fetchWordById` 的方式，在 `.then()` 中从原始 response 读取 `isFavorited`：

```typescript
// 方案: 用 fetch API 的底层 request 直接调用
import { request } from "../../api/request";
const raw: any = await request(`/api/v1/words/${wordId}`);
const w = adaptWord(raw);
setIsFavorited(raw.isFavorited ?? false);
```

或者更简单的方案：修改 `api/words.ts` 中的 `fetchWordById` 返回类型，增加 `isFavorited` 和 `learnCount`。改动最小的方法是在 adapter 中新增一个 adaptor 或在 detailed page 中自己处理。

**推荐最简方案**：在 `api/words.ts` 中新增 `fetchWordDetail` 函数（与 `fetchWordById` 类似但返回扩展类型）：

```typescript
export interface WordDetail extends Word {
  isFavorited: boolean;
  learnCount: number;
}

export async function fetchWordDetail(id: string): Promise<WordDetail> {
  const raw: any = await request(`/api/v1/words/${id}`);
  return { ...adaptWord(raw), isFavorited: raw.isFavorited ?? false, learnCount: raw.learnCount ?? 0 };
}
```

然后在 word-detail 页面中：
```typescript
import { fetchWordDetail, type WordDetail } from "../../api/words";
// ...
const raw = await fetchWordDetail(wordId);
setWord(raw);
setIsFavorited(raw.isFavorited);
```

收藏按钮点击处理：
```typescript
const handleToggleFavorite = async () => {
  if (favLoading) return;
  setFavLoading(true);
  try {
    if (isFavorited) {
      await unfavoriteWord(wordId);
      setIsFavorited(false);
      Taro.showToast({ title: "已取消收藏", icon: "success" });
    } else {
      await favoriteWord(wordId);
      setIsFavorited(true);
      Taro.showToast({ title: "已收藏", icon: "success" });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "操作失败";
    Taro.showToast({ title: msg, icon: "none" });
  } finally {
    setFavLoading(false);
  }
};
```

UI 收藏按钮：
```tsx
<View onClick={handleToggleFavorite} style={{
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "8px 14px",
  borderRadius: "20px",
  background: isFavorited ? "#FEF3C7" : "#F9FAFB",
  opacity: favLoading ? 0.6 : 1,
}}>
  <Icon name="star" size={16} color={isFavorited ? "#EAB308" : "#D1D5DB"} />
</View>
```

**未登录处理**: 使用 `useAuth` hook 判断登录状态。未登录时点击收藏按钮，调用 `Taro.navigateTo({ url: "/pages/auth/index?mode=login" })`，不发起 API 请求。

### 3.9 前端 — 个人中心页 `client/src/pages/profile/index.tsx`（修改）

#### 3.9.1 替换硬编码统计

当前 stats 区域（第 274-343 行）对普通用户展示硬编码 "156 个"、"3/5 个"。替换为真实 API 数据：

```typescript
const [stats, setStats] = useState<{
  totalWordsLearned: number;
  todayLearnedCount: number;
} | null>(null);

useEffect(() => {
  if (user) {
    fetchUserStats()
      .then(s => setStats(s))
      .catch(() => { /* 静默失败，保持旧 UI */ });
  }
}, [user]);
```

UI 展示：
```
{ label: "已学单词", value: stats ? `${stats.totalWordsLearned} 个` : "--" }
{ label: "今日已学", value: stats ? `${stats.todayLearnedCount} 个` : "--" }
```

去掉 "今日目标" 卡片（`3/5 个`），改为 `今日已学`。

#### 3.9.2 添加收藏入口

在设置卡片上方新增一个「我的收藏」入口卡片（样式与"管理后台"卡片相同）：

```tsx
<View onClick={() => Taro.navigateTo({ url: "/pages/profile/favorites" })}
  style={{ /* 与 admin entry card 相同样式 */ }}>
  <Icon name="star" size={20} color="#EAB308" />
  <Text>我的收藏</Text>
  <Icon name="chevron-right" size={18} color="#D1D5DB" />
</View>
```

由于 Taro 需要新建页面，为简化实现，**推荐方案**：在 profile 页面内部用 `useState` 切换视图，展示收藏列表（类似 admin/index.tsx 的 section 切换模式）。

```typescript
const [showFavorites, setShowFavorites] = useState(false);

// 当 showFavorites 为 true 时，渲染收藏列表视图
// 当 showFavorites 为 false 时，渲染正常 profile 视图
```

收藏列表视图：
```tsx
function FavoritesList({ onBack }: { onBack: () => void }) {
  const [favs, setFavs] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchFavorites({ pageSize: 50 })
      .then(res => setFavs(res.data))
      .catch(() => Taro.showToast({ title: "加载失败", icon: "none" }))
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <View>
      <PageHeader showBack backLabel="个人中心" title="我的收藏" onBack={onBack} ... />
      {/* 列表渲染，同 admin/index.tsx word list 风格 */}
    </View>
  );
}
```

## 4. 代码规范要求

- 后端 controller 保持薄层风格，业务逻辑在 service 层
- 所有用户输入须经过 validator 校验（ObjectId 格式）
- Mongoose 操作用 `{ new: true }` 返回更新后的文档
- 学习记录更新使用 `$inc` 原子操作防止并发覆盖
- 前端 API 调用遵循已有 `api/` 模块模式（`request()` + `adaptWord()`）
- 前端使用 `async/await` + `try/catch`，错误通过 `Taro.showToast` 展示
- 使用 `useRef` 防止 Strict Mode 下重复副作用

## 5. 测试要求

代码需满足以下测试用例（详见 `test-cases.md`）：

| 用例 | 验证要点 |
|------|---------|
| TC-001 | 首次学习记录，learnCount=1，User.learnedWords 新增 |
| TC-002 | 重复学习累计 learnCount，lastLearnedAt 更新 |
| TC-003 | 未登录学习被 401 拒绝 |
| TC-004 | 学习不存在的单词返回 404 |
| TC-005 | 学习记录列表按时间降序排列 |
| TC-006 | 学习统计：totalWordsLearned, totalLearningDays, todayLearnedCount |
| TC-007 | 收藏单词成功，UserFavorite 新增 |
| TC-008 | 取消收藏，记录删除 |
| TC-009 | 重复收藏幂等处理（不报错） |
| TC-010 | 收藏列表分页 |
| TC-011 | 单词详情返回 isFavorited + learnCount（登录/未登录不同） |
| TC-012 | 前端收藏按钮 — 点击切换收藏状态 |
| TC-013 | 前端用户中心展示真实学习统计 |
| TC-014 | 前端收藏列表展示 |
| TC-015 | 浏览单词自动记录学习（后台静默） |
| TC-016 | 未登录点击收藏跳转登录 |

## 6. 注意事项

- **路由注册顺序**: word.routes.ts 中 `POST /:id/learn` 和 `POST /:id/favorite` 必须注册在 `GET /:id` 之前，否则 Express 将 `POST /words/abc/learn` 中的 `abc` 匹配为 `:id` 参数后找不到匹配的 HTTP method
- **User.favoriteWords 和 User.learnedWords 数组**: User 模型中保留这两个数组字段（已有），与 UserFavorite/LearningRecord 双写保持一致性。使用 `$addToSet` 防止重复添加
- **`getWordById` 的 optionalAuth**: 当前路由使用 `optionalAuth`，`req.user` 可能为 undefined，附加字段逻辑需做空值检查
- **Strict Mode 去重**: React 18 开发模式下 useEffect 执行两次，学习记录 API 需要用 useRef 去重
- **管理员也应有学习/收藏能力**: 不限制为仅普通用户，管理员登录后也能学习和收藏
- **不修改现有 User 模型的 lean/select 模式**: User 接口字段保持兼容，新字段通过关联集合查询，不改变 User Schema
