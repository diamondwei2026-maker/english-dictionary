# Coding Prompt — Task 3.2: 单词 CRUD API 与管理后台权限

## 1. 任务目标

实现单词（Word）的完整 CRUD API，包括嵌套引申义（ExtendedMeaning）和搭配（Collocation）的增删改，所有写操作受 `adminMiddleware` 保护，并在词库路由中挂载嵌套资源路由 `GET /wordbanks/:id/words`。

## 2. 技术上下文

- **语言/框架**: Node.js 18+ / Express 4 + TypeScript 5
- **ODM**: Mongoose 8（已有 Word、WordBank Model）
- **已有基础设施**:
  - `authMiddleware` / `adminMiddleware` — `server/src/middleware/auth.ts`（已实现）
  - `AppError` — `server/src/utils/errors.ts`（已实现）
  - `asyncHandler` — `server/src/utils/asyncHandler.ts`（已实现）
  - 错误处理器 `errorHandler` — `server/src/middleware/index.ts`（已挂载）
- **API 路径前缀**: `/api/v1`（app.ts 中已挂载）
- **参考实现**: `wordbank` 模块（validator → service → controller → routes 四层模式，严格模仿其代码风格）

### 涉及文件

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| ✨ 新建 | `server/src/validators/word.validator.ts` | 单词输入校验 |
| ✨ 新建 | `server/src/services/word.service.ts` | 单词业务逻辑 |
| ✨ 新建 | `server/src/controllers/word.controller.ts` | 单词路由处理器 |
| ✨ 新建 | `server/src/routes/word.routes.ts` | 单词路由定义 |
| 🔧 修改 | `server/src/routes/index.ts` | 挂载 `/words` 路由 |
| 🔧 修改 | `server/src/routes/wordbank.routes.ts` | 新增 `GET /:id/words` 嵌套路由 |
| 🔧 修改 | `server/src/models/Word.ts` | 新增复合唯一索引 `{ wordbankId, word }` |

## 3. 实现要求

### 3.1 新建 `server/src/validators/word.validator.ts`

完全遵循 `wordbank.validator.ts` 的编码风格（`collect` 辅助函数、`AppError` 抛出、手动校验每个字段）。

#### 3.1.1 ExtendedMeaning 输入校验

```typescript
interface ExtendedMeaningInput {
  evolutionDescription: string;  // 必填，1-500 字符
  meaning: string;               // 必填，1-200 字符
  partOfSpeech: string;          // 必填，枚举：noun|verb|adj|adv|prep|conj|pron|other
  exampleEn: string;             // 必填，1-1000 字符
  exampleZh: string;             // 必填，1-1000 字符
}
```

- 编写辅助函数 `validateExtendedMeaning(obj: unknown, index: number): ExtendedMeaningInput`
- 校验失败时 `collect(errs, "extendedMeanings[<index>].<field>", "…")`

#### 3.1.2 CreateWordInput

```typescript
interface CreateWordInput {
  word: string;                          // 必填，1-100 字符
  wordbankId: string;                    // 必填，必须是合法 ObjectId
  phonetic?: string;                     // 可选，最多 100 字符
  coreMeaning: string;                   // 必填，1-500 字符
  coreExampleEn: string;                 // 必填，1-1000 字符
  coreExampleZh: string;                 // 必填，1-1000 字符
  physicalImageType: string;             // 必填，枚举：flow|grasp|break|bear|drive|light|leverage|yield
  physicalImageDescription: string;      // 必填，1-500 字符
  extendedMeanings?: ExtendedMeaningInput[];  // 可选，默认 []
  collocations?: string[];               // 可选，默认 []，每个元素 1-200 字符
}
```

#### 3.1.3 UpdateWordInput

- 所有字段均为可选（全部 `Partial`），但至少提供一个字段
- `wordbankId` 一旦创建不可修改（不出现于 UpdateWordInput）
- `extendedMeanings` 若传入则**全量替换**现有数组（PUT 语义）

#### 3.1.4 导出函数

```typescript
export function validateCreateWordInput(body: unknown): CreateWordInput;
export function validateUpdateWordInput(body: unknown): UpdateWordInput;
```

### 3.2 新建 `server/src/services/word.service.ts`

完全遵循 `wordbank.service.ts` 的编码风格（`ensureValidId`、`extractDuplicateField`、try/catch 11000）。

#### 3.2.1 listWords

```typescript
async function listWords(options: {
  page: number;
  pageSize: number;
  wordbankId?: string;    // 可选词库筛选
  q?: string;             // 可选关键词搜索
}): Promise<{ data: IWord[]; pagination: { total: number; page: number; pageSize: number } }>
```

**关键逻辑**:
1. 构建 MongoDB 查询对象 `filter: Record<string, unknown> = {}`
2. 若 `wordbankId` 存在，校验 ObjectId 合法性（`ensureValidId`），加入 `filter.wordbankId`
3. 若 `q` 存在，加入 `filter.word = { $regex: q, $options: 'i' }`（不区分大小写的子串匹配）
4. 并行执行 `Word.find(filter).sort({ createdAt: -1 }).skip().limit()` 和 `Word.countDocuments(filter)`
5. 返回 `{ data, pagination }`

#### 3.2.2 getWordById

```typescript
async function getWordById(id: string): Promise<IWord>
```

**关键逻辑**:
1. `ensureValidId(id)`
2. `Word.findById(id)`，未找到抛 404
3. 返回完整文档（`extendedMeanings` 和 `collocations` 已内嵌于文档中，Mongoose 自动返回）

#### 3.2.3 createWord

```typescript
async function createWord(data: CreateWordInput): Promise<IWord>
```

**关键逻辑**:
1. 先校验 `wordbankId` 对应词库存在：`WordBank.findById(data.wordbankId)`，不存在抛 404 "词库不存在"
2. 执行 `Word.create(data)`
3. 捕获 `MongoServerError` code 11000 → 提取重复字段提示“该词库内单词名已存在”（409）
4. 捕获 `Mongoose ValidationError` → 抛 `AppError(400, "VALIDATION_ERROR", ...)`

#### 3.2.4 updateWord

```typescript
async function updateWord(id: string, data: UpdateWordInput): Promise<IWord>
```

**关键逻辑**:
1. `ensureValidId(id)`
2. 若 `data.extendedMeanings` 或 `data.collocations` 存在，直接用 `$set` 全量替换（PUT 语义）
3. `Word.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })`
4. 未找到抛 404
5. 捕获 11000 重复错误

#### 3.2.5 deleteWord

```typescript
async function deleteWord(id: string): Promise<{ deleted: boolean }>
```

**关键逻辑**:
1. `ensureValidId(id)`
2. `Word.findByIdAndDelete(id)`，未找到抛 404
3. 因为 `extendedMeanings` 和 `collocations` 是内嵌子文档/数组，删除 Word 文档即自动级联删除（无需额外操作）

#### 3.2.6 getWordsByWordbankId

```typescript
async function getWordsByWordbankId(
  wordbankId: string,
  options: { page: number; pageSize: number }
): Promise<{ data: IWord[]; pagination: ... }>
```

- 先 `ensureValidId(wordbankId)` + 校验词库存在（`WordBank.findById`），不存在抛 404
- 其余逻辑同 `listWords` 但固定 `filter.wordbankId = wordbankId`

### 3.3 新建 `server/src/controllers/word.controller.ts`

完全遵循 `wordbank.controller.ts` 的编码风格（`asyncHandler` 包装、Math.max/min 分页钳位）。

```typescript
export const list       // GET /api/words
export const getById    // GET /api/words/:id
export const create     // POST /api/words
export const update     // PUT /api/words/:id
export const remove     // DELETE /api/words/:id
```

**list 控制器细节**:
```typescript
const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
const wordbankId = req.query.wordbank_id as string | undefined;
const q = req.query.q as string | undefined;

const result = await wordService.listWords({ page, pageSize, wordbankId, q });
res.json({ data: result.data, pagination: result.pagination });
```

**create 控制器细节**:
```typescript
const input = validateCreateWordInput(req.body);
const word = await wordService.createWord(input);
res.status(201).json(word);
```

**remove 控制器细节**:
```typescript
await wordService.deleteWord(req.params.id);
res.json({ message: "单词已删除" });
```

### 3.4 新建 `server/src/routes/word.routes.ts`

完全遵循 `wordbank.routes.ts` 的导入和路由定义风格。

```typescript
import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware";
import * as wordController from "../controllers/word.controller";

const router = Router();

// 公开路由
router.get("/", wordController.list);
router.get("/:id", wordController.getById);

// 管理员路由
router.post("/", authMiddleware, adminMiddleware, wordController.create);
router.put("/:id", authMiddleware, adminMiddleware, wordController.update);
router.delete("/:id", authMiddleware, adminMiddleware, wordController.remove);

export const wordRoutes = router;
```

### 3.5 修改 `server/src/routes/index.ts`

在现有代码中新增单词路由挂载：

```typescript
import { wordRoutes } from "./word.routes";
// …
routes.use("/words", wordRoutes);
```

将 `// routes.use("/words", wordRoutes);` 注释替换为实际挂载。

### 3.6 修改 `server/src/routes/wordbank.routes.ts`

新增嵌套资源路由 `GET /:id/words`：

```typescript
// 新增导入
import * as wordController from "../controllers/word.controller";

// 新增路由（放在 ":id" 路由之前，避免 ":id" 捕获 "words" 中的 ":id"）
// 但 ":id/words" 不会冲突 — 它是带子路径的
// 放在 GET "/:id" 之后即可
router.get("/:id/words", wordController.getByWordbank);
```

> ⚠️ **重要**: 需要在 `word.controller.ts` 中新增 `getByWordbank` 导出函数，调用 `wordService.getWordsByWordbankId`。

### 3.7 修改 `server/src/models/Word.ts`

在 WordSchema 定义之后新增**复合唯一索引**，确保单词名在同一词库内唯一：

```typescript
// 在 WordSchema.index({ coreMeaning: "text" }); 之后新增：
WordSchema.index({ wordbankId: 1, word: 1 }, { unique: true });
```

此索引使得 MongoDB 在 `createWord` 和 `updateWord` 时自动校验同词库内单词名不重复，重复时抛出 code 11000 的 `MongoServerError`。

## 4. 代码规范要求

1. **严格遵循已有分层架构**：validator → service → controller → routes，每层职责清晰
2. **模仿 wordbank 模块的编码风格**：相同的命名习惯、错误处理方式、import 组织、TypeScript 类型使用
3. **错误处理模式**：
   - Service 层抛 `AppError`（`statusCode`, `code`, `message`）
   - Controller 层使用 `asyncHandler` 包装，不写 try/catch
   - 全局 `errorHandler` 统一捕获并格式化响应
4. **分页参数钳位**：`page >= 1`, `1 <= pageSize <= 100`
5. **MongoDB 特殊错误的处理**：
   - `MongoServerError` code 11000 → 409 CONFLICT
   - `ValidationError` → 400 VALIDATION_ERROR
6. **校验函数参数统一命名为 `body`**（与 wordbank.validator 一致）
7. **Service 函数统一使用命名导出**（`export async function`），不导出默认对象
8. **`extendedMeanings` 更新采用 PUT 语义**（全部替换），不用数组操作（`$push`/`$pull`）
9. **不使用 `eslint-disable` 或 `@ts-ignore`**
10. **Import 路径使用相对路径**（`"../utils/errors"` 等，与现有代码一致）

## 5. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 用例 | 验收点 |
|------|--------|
| TC-001 | GET / 无参数返回分页列表 |
| TC-002 | GET /?wordbank_id= 按词库筛选 |
| TC-003 | GET /?q= 关键词模糊搜索 |
| TC-004~005 | GET /?page=&pageSize= 分页正常+越界处理 |
| TC-006 | GET /:id 返回完整嵌套数据 |
| TC-007~008 | GET /:id 不存在的 ID → 404，非法格式 → 400 |
| TC-009~010 | POST / 管理员创建完整/最小有效单词 → 201 |
| TC-011 | POST / 同词库重名 → 409 |
| TC-012 | POST / 不同词库同名 → 201（允许） |
| TC-013~015 | POST / 缺必填字段/非法枚举/嵌套不完整 → 400 |
| TC-016~017 | POST / 非管理员 → 403，未认证 → 401 |
| TC-018~019 | PUT /:id 管理员更新全量/部分字段 → 200 |
| TC-020 | PUT /:id 不存在的单词 → 404 |
| TC-021 | PUT /:id 非管理员 → 403 |
| TC-022 | DELETE /:id 管理员删除+级联 → 200 |
| TC-023 | DELETE /:id 不存在 → 404 |
| TC-024 | DELETE /:id 非管理员 → 403 |
| TC-025~026 | GET /wordbanks/:id/words 词库单词列表/词库不存在 → 404 |
| TC-027~028 | 搜索无结果/筛选+搜索组合 |
| TC-030 | pageSize 超限钳位到 100 |
| TC-032 | wordbankId 指向不存在词库 → 404 |
| TC-034 | 过期 Token 写操作 → 401 |
| TC-035 | page 负数兜底为 1 |

## 6. 注意事项

1. **路由顺序**: `GET /:id` 和 `GET /:id/words` 不冲突（Express 按精确路径匹配），无需特殊处理
2. **extendedMeanings 子文档 ID**: Mongoose subdocument 默认 `_id: true`（已配置），不需要额外处理；PUT 更新时传入带 `_id` 的元素会保留原有 ID，不带 `_id` 的会新建
3. **collocations 是简单字符串数组**: PUT 更新时直接 `$set: { collocations: newArray }` 全量替换即可
4. **MongoDB 复合唯一索引**: 必须**先手动删除**同词库内可能已存在的重名单词，再创建索引（如果 Seed 数据中有重复）。开发环境可使用 `db.words.dropIndexes()` 后重新创建
5. **wordbank 路由新增**: 在 `wordbank.routes.ts` 中添加 `GET /:id/words` 前，确认该文件已导入 `wordController`
6. **search 使用 `$regex`**: 关键词搜索使用 MongoDB 字符串正则匹配，不区分大小写。注意 $regex 不走 text 索引，但 `word` 字段已有普通索引，对大数量需要关注性能
7. **物理意象类型枚举值**: 从 `Word.ts` 的 `PHYSICAL_IMAGE_TYPES` 常量导出复用，不要硬编码
8. **wordbankId 在更新时不可变**: UpdateWordInput 不应包含 `wordbankId`（单词创建后不能移动到其他词库）
