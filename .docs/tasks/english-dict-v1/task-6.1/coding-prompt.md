# Coding Prompt — Task 6.1: 缓存与搜索优化

## 1. 任务目标

为高频读取 API（今日一词、词库列表、单词详情）增加内存缓存层，并在数据变更时主动失效缓存；同时优化单词搜索的排序逻辑（精确匹配 > 前缀匹配 > 包含匹配）。

## 2. 技术上下文

- **语言/框架**: Node.js 18+ / Express 4 + TypeScript
- **数据库**: MongoDB Atlas，ODM Mongoose
- **现有缓存**: 无（ADR 中提到 AI 生成用"内存 Map"，本项目内存缓存也使用 Map）
- **无 Redis 依赖**: 本轮使用内存缓存（`node-cache` 或手写 Map + TTL），后续可替换为 Redis
- **架构**: 分层 — routes → controllers → services → models → MongoDB

### 涉及文件

| 操作 | 路径 | 说明 |
|------|------|------|
| **新建** | `server/src/cache/cache.ts` | 缓存抽象层（接口 + 内存实现） |
| **新建** | `server/src/cache/index.ts` | 缓存模块导出 |
| **修改** | `server/src/config/index.ts` | 新增缓存配置项 |
| **修改** | `server/src/services/daily-word.service.ts` | 今日一词读缓存 |
| **修改** | `server/src/services/wordbank.service.ts` | 词库列表缓存 + 写失效 |
| **修改** | `server/src/services/word.service.ts` | 单词详情/列表缓存 + 写失效 + 搜索排序优化 |
| **修改** | `server/.env.example` | 新增缓存环境变量说明 |

## 3. 实现要求

---

### 3.1 新建 `server/src/cache/cache.ts` — 缓存抽象层

**目标**: 定义缓存接口并提供内存实现，便于将来切换到 Redis。

#### 3.1.1 CacheStore 接口

```typescript
export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  delByPrefix(prefix: string): Promise<void>;   // 批量按前缀删除
  clear(): Promise<void>;
}
```

#### 3.1.2 MemoryCache 实现

- **内部数据结构**: `Map<string, { data: unknown; expiresAt: number }>`
- **`get`**: 检查 `expiresAt`，过期返回 `null` 并清理（惰性删除）
- **`set`**: 写入数据 + 到期时间戳
- **`del`**: 从 Map 删除单个 key
- **`delByPrefix(prefix)`**: 遍历 Map 所有 key，匹配前缀的删除
- **`clear`**: 清空整个 Map
- **可选**: 添加 `setInterval` 定时清理过期条目（每 60 秒），防止内存泄漏

#### 3.1.3 工厂函数

```typescript
let _instance: CacheStore | null = null;

export function getCache(): CacheStore {
  if (!_instance) {
    _instance = new MemoryCache();
  }
  return _instance;
}

// 测试用：重置单例
export function resetCacheInstance(): void {
  _instance = null;
}
```

**关键逻辑**:
1. 单例模式 — 整个应用共享一个缓存实例
2. `get` 中惰性删除过期项
3. `delByPrefix` 用 `String.startsWith()` 匹配
4. 所有方法返回 Promise（兼容异步 Redis 实现）

**错误处理**: 缓存操作不应抛出异常 — `get` 出错返回 `null`，`set`/`del` 出错静默忽略（cache miss 降级到 DB 查询）。

---

### 3.2 新建 `server/src/cache/index.ts`

```typescript
export { CacheStore, MemoryCache, getCache, resetCacheInstance } from "./cache";
```

---

### 3.3 修改 `server/src/config/index.ts` — 新增缓存配置

在 `config` 对象中新增以下字段：

```typescript
// 缓存配置
cacheEnabled: process.env.CACHE_ENABLED !== "false",  // 默认启用
// TTL（秒）
cacheTtlDailyWord: parseIntSafe(process.env.CACHE_TTL_DAILY_WORD, 86400),     // 一天
cacheTtlWordbankList: parseIntSafe(process.env.CACHE_TTL_WORDBANK_LIST, 300), // 5 分钟
cacheTtlWordbankDetail: parseIntSafe(process.env.CACHE_TTL_WORDBANK_DETAIL, 300),
cacheTtlWordDetail: parseIntSafe(process.env.CACHE_TTL_WORD_DETAIL, 600),     // 10 分钟
cacheTtlWordList: parseIntSafe(process.env.CACHE_TTL_WORD_LIST, 300),
```

`parseIntSafe` 已存在，直接复用。

---

### 3.4 修改 `server/src/services/daily-word.service.ts` — 今日一词缓存

#### 3.4.1 导入缓存

```typescript
import { getCache } from "../cache";
import { config } from "../config";
```

#### 3.4.2 修改 `getDailyWord` 函数

在函数开头（获取 today 之后）增加缓存读取逻辑：

```
Cache Key: `daily-word:${today}`

流程：
1. 若 config.cacheEnabled → 尝试 cache.get(key)
2. 命中 → 直接返回缓存数据
3. 未命中 → 执行现有数据库查询逻辑（已有的 1-7 步骤）
4. 查询成功后 → cache.set(key, result, config.cacheTtlDailyWord)
5. 返回结果
```

**注意**:
- 缓存 TTL 已内置按天过期，与 `date` 字段天然对齐
- `pinDailyWord` 函数末尾需要失效该缓存：`cache.del(key)`（key = `daily-word:${today}`）

---

### 3.5 修改 `server/src/services/wordbank.service.ts` — 词库缓存 + 失效

#### 3.5.1 导入缓存模块（同上）

#### 3.5.2 修改 `listWordbanks` — 读缓存

```
Cache Key: `wordbanks:list:${page}:${pageSize}:${isAdmin ? 'admin' : 'public'}`

流程（与 daily-word 同模式）：
1. 若启用缓存 → cache.get(key)
2. 命中 → 返回
3. 未命中 → 执行原查询
4. cache.set(key, result, config.cacheTtlWordbankList)
5. 返回
```

#### 3.5.3 修改 `getWordBankById` — 读缓存

```
Cache Key: `wordbanks:detail:${id}`

同模式，TTL 使用 config.cacheTtlWordbankDetail
```

#### 3.5.4 修改 `createWordBank` — 失效列表缓存

在返回前添加：

```typescript
await getCache().delByPrefix("wordbanks:list:");
```

#### 3.5.5 修改 `updateWordBank` — 失效相关缓存

```typescript
await getCache().del(`wordbanks:detail:${id}`);
await getCache().delByPrefix("wordbanks:list:");
```

#### 3.5.6 修改 `deleteWordBank` — 失效相关缓存

```typescript
await getCache().del(`wordbanks:detail:${id}`);
await getCache().delByPrefix("wordbanks:list:");
// 同时失效与该词库关联的单词缓存
await getCache().delByPrefix(`words:list:${id}:`);
```

---

### 3.6 修改 `server/src/services/word.service.ts` — 单词缓存 + 失效 + 搜索排序优化

这是改动最重的文件，涉及三方面。

#### 3.6.1 导入缓存模块

```typescript
import { getCache } from "../cache";
import { config } from "../config";
```

#### 3.6.2 修改 `listWords` — 读缓存 + 搜索排序优化

**缓存**:

```
Cache Key: `words:list:${wordbankId || 'all'}:${page}:${pageSize}:${q || 'none'}:${isAdmin ? 'admin' : 'public'}`

同模式：先查缓存，未命中执行查询，查询成功后写缓存。
TTL: config.cacheTtlWordList
```

**搜索排序优化**（核心改动）:

当前代码在 `q` 存在时使用 `{ $regex: escaped, $options: "i" }` 过滤，然后按 `createdAt: -1` 排序。需求要求按相关度排序：**精确匹配 → 前缀匹配 → 中间匹配**。

改动方案 — 使用 MongoDB aggregation pipeline 替代 `Word.find().sort()`：

```typescript
// 当有搜索关键词 q 时，使用 aggregation 排序
if (q) {
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  
  // 构建 $filter 条件（权限过滤 + 正则匹配）
  const pipeline: PipelineStage[] = [
    { $match: filter },  // 已有的权限 + wordbankId 过滤
    {
      $addFields: {
        _sortScore: {
          $cond: [
            { $eq: ["$word", q] },           // 精确匹配
            0,
            {
              $cond: [
                { $regexMatch: { input: "$word", regex: `^${escaped}`, options: "i" } },
                1,                             // 前缀匹配
                2,                             // 中间匹配
              ],
            },
          ],
        },
      },
    },
    { $sort: { _sortScore: 1, word: 1 } },   // 按相关度升序 + 字母序
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize },
  ];
  
  // 分开查询 data 和 total
  const [dataResult, total] = await Promise.all([
    Word.aggregate(pipeline),
    Word.countDocuments(filter),
  ]);
  
  return { data: dataResult, pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } };
}
```

**注意**:
- `$regexMatch` 中的 `^${escaped}` 确保前缀锚定
- `escaped` 中已有的转义同样适用于 regex
- 无搜索关键词时沿用原有 `find().sort().skip().limit()` 逻辑（保持性能）
- `countDocuments` 不参与 aggregation，单独查询

#### 3.6.3 修改 `getWordById` — 读缓存

```
Cache Key: `words:detail:${id}`

同模式，TTL 使用 config.cacheTtlWordDetail
```

#### 3.6.4 修改 `createWord` — 失效缓存

```typescript
// 创建成功后失效
await getCache().delByPrefix("words:list:");           // 所有单词列表
await getCache().del(`wordbanks:detail:${data.wordbankId}`); // 词库单词数变了
await getCache().delByPrefix("wordbanks:list:");        // 词库列表可能有 wordCount
```

#### 3.6.5 修改 `updateWord` — 失效缓存

```typescript
await getCache().del(`words:detail:${id}`);             // 该单词详情
await getCache().delByPrefix("words:list:");             // 所有单词列表
```

#### 3.6.6 修改 `deleteWord` — 失效缓存

```typescript
await getCache().del(`words:detail:${id}`);             // 该单词详情
await getCache().delByPrefix("words:list:");             // 所有单词列表
await getCache().del(`wordbanks:detail:${word.wordbankId}`); // 词库单词数变了
```

#### 3.6.7 修改 `getWordsByWordbankId` — 读缓存

```
Cache Key: `words:list:${wordbankId}:${page}:${pageSize}:${isAdmin ? 'admin' : 'public'}`

同模式，TTL 使用 config.cacheTtlWordList
```

---

### 3.7 修改 `server/.env.example` — 新增缓存环境变量

在现有变量后追加：

```bash
# ===== 缓存配置 =====
# 是否启用缓存（默认 true，设 false 禁用）
CACHE_ENABLED=true
# TTL（秒）
CACHE_TTL_DAILY_WORD=86400
CACHE_TTL_WORDBANK_LIST=300
CACHE_TTL_WORDBANK_DETAIL=300
CACHE_TTL_WORD_DETAIL=600
CACHE_TTL_WORD_LIST=300
```

---

## 4. 代码规范要求

1. **缓存降级**: 所有 `cache.get/set/del` 调用用 `try-catch` 包裹，缓存不可用时不影响业务（降级到直接查库）
2. **可配置**: 通过 `config.cacheEnabled` 控制缓存启停，禁用时跳过所有缓存操作
3. **async/await**: 统一使用 async/await，不混用 `.then()`
4. **日志**: 缓存操作失败时用 `console.warn` 记录（不引入 winston）
5. **类型安全**: 不引入 `any`，缓存值使用泛型 `<T>`
6. **命名一致性**: Cache key 采用 `资源:动作:参数` 的冒号分隔命名（如 `words:detail:abc123`）
7. **Mongoose 聚合**: search 排序用 `$addFields` 而非 `$set`（兼容性更好）

## 5. 测试要求

代码编写完成后必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 用例 | 验证要点 |
|------|---------|
| TC-001~003 | 今日一词缓存命中/未命中/TTL 过期 |
| TC-004~006 | 词库列表缓存命中/未命中/TTL 过期 |
| TC-007~008 | 单词详情缓存（含不同单词独立缓存） |
| TC-009~012 | 数据变更（CUD）触发缓存失效 |
| TC-013 | 缓存不可用时降级到数据库 |
| TC-014~015 | 缓存可配置：禁用/自定义 TTL |
| TC-016~017 | 搜索索引 EXPLAIN 验证 + 性能 |
| TC-018~019 | 搜索排序：前缀优先 / 精确匹配最前 |
| TC-020~021 | 搜索分页 + 空结果 |
| TC-022 | 搜索特殊字符转义防注入 |
| TC-023 | 极端分页参数 |
| TC-024 | coreMeaning 文本索引验证 |

## 6. 注意事项

1. **不要安装新 npm 包**: 缓存用原生 `Map` 实现，不引入 `node-cache` 或 `redis` — ADR 明确"内存缓存或 Redis（可选）"
2. **`delByPrefix` 在内存实现中是 O(n)**，但项目词库/单词量小（< 10000），性能无影响
3. **单词搜索排序的 aggregation pipeline**：`$addFields` 中的 `$regexMatch` 在 MongoDB 5+ 可用，Mongoose 9.x 完全兼容
4. **缓存失效粒度**: 为避免遗漏，写操作后使用 `delByPrefix("words:list:")` 清空所有列表缓存（而非逐 key 精确删除）。这是合理的折中 — 写操作频率低（仅管理员），且能保证数据一致性
5. **不要缓存带用户状态的数据**: 单词详情的 `isFavorited` / `learnCount` 是用户相关的，这些字段在 controller 层附加（见 `word.controller.ts` 第 38-44 行），service 层返回的纯 word 对象不含这些字段，因此缓存 service 层结果不受用户状态影响
6. **DailyWord 缓存 key 按日期**: `daily-word:2026-07-09`，天然按天隔离，无需手动失效跨天数据
7. **文本索引**：Word Model 已有 `{ coreMeaning: "text" }` 索引（Word.ts 第 103 行），无需新建
8. **`word` 字段索引**：Word Model 已有 `{ word: 1 }` 索引（Word.ts 第 79 行），无需新建。但需在代码注释中说明该索引用于 `$regexMatch` 前缀搜索加速
