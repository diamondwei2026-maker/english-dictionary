# Coding Prompt — Task 3.1: 词库 CRUD API

> 实现词库（WordBank）的完整 CRUD API，支持列表/详情/新增/编辑/删除，区分公开/私有词库，管理员权限控制。

---

## 1. 任务目标

实现 `GET/POST/PUT/DELETE /api/v1/wordbanks` 全部 5 个端点，完成词库资源的 CRUD 操作。公开词库无需认证即可查看；写操作（新增/编辑/删除）需要管理员权限。

---

## 2. 技术上下文

- **语言/框架**: Node.js 18+ / Express 4.21 / TypeScript 5.5 / Mongoose 9.7
- **认证**: JWT Bearer Token（已有 `authMiddleware` + `adminMiddleware`）
- **错误处理**: `AppError(statusCode, code, message, errors?)` → 全局 `errorHandler`
- **异步包装**: `asyncHandler(fn)` 捕获 rejection 传给 `next(err)`
- **API 前缀**: `/api/v1`（已在 `app.ts` 中挂载）

### 涉及文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **修改** | `server/src/models/WordBank.ts` | 新增 `slug`、`cover_image`、`is_public` 字段 |
| **修改** | `server/src/routes/index.ts` | 挂载 wordbank 子路由 |
| **新建** | `server/src/validators/wordbank.validator.ts` | 词库输入校验函数 |
| **新建** | `server/src/services/wordbank.service.ts` | 词库业务逻辑 |
| **新建** | `server/src/controllers/wordbank.controller.ts` | 词库路由处理器 |
| **新建** | `server/src/routes/wordbank.routes.ts` | 词库路由定义 |

---

## 3. 实现要求

### 3.1 修改 `server/src/models/WordBank.ts` — 新增字段

在现有 Schema 基础上增加三个字段：

```typescript
slug: {
  type: String,
  required: true,
  unique: true,        // ← MongoDB unique index，自动创建
  lowercase: true,     // ← 存储时转为小写，确保唯一性不区分大小写
  trim: true,
},
cover_image: {
  type: String,
  default: "",
},
is_public: {
  type: Boolean,
  default: true,
  index: true,         // ← 查询过滤常用
},
```

同时更新 `IWordBank` 接口，新增对应类型声明。

### 3.2 新建 `server/src/validators/wordbank.validator.ts` — 输入校验

参照 `auth.validator.ts` 的 `collect` 错误收集模式，实现两个校验函数：

#### `validateCreateWordBankInput(body: unknown)`

校验 `POST /wordbanks` 请求体：

| 字段 | 规则 | 错误信息 |
|------|------|---------|
| `name` | 必填，string，1-100 字符 | `"name"` / `"词库名称为必填项"` / `"词库名称长度需在1-100字符之间"` |
| `slug` | 必填，string，匹配 `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`（小写字母+数字+连字符） | `"slug"` / `"slug 为必填项"` / `"slug 格式不正确（小写字母、数字和连字符）"` |
| `description` | 必填，string，1-500 字符 | `"description"` / `"词库描述为必填项"` |
| `cover_image` | 可选，string | 不校验（空字符串兜底） |
| `gradient` | 可选，string | 不校验（Model 有默认值） |
| `is_public` | 可选，boolean | 不传则默认 true |

返回类型：`{ name: string; slug: string; description: string; cover_image?: string; gradient?: string; is_public?: boolean }`

#### `validateUpdateWordBankInput(body: unknown)`

校验 `PUT /wordbanks/:id` 请求体（部分更新，所有字段可选）：

| 字段 | 规则 |
|------|------|
| `name` | 可选，string，1-100 字符 |
| `slug` | 可选，string，格式同创建 |
| `description` | 可选，string，1-500 字符 |
| `cover_image` | 可选，string |
| `gradient` | 可选，string |
| `is_public` | 可选，boolean |

要求至少传入一个字段，否则返回 400。

校验 body 是否为 object 且非数组——不是则抛出 `AppError(400, "VALIDATION_ERROR", "请求体格式错误")`。

### 3.3 新建 `server/src/services/wordbank.service.ts` — 业务逻辑

参照 `auth.service.ts` 的函数式导出风格（`export async function xxx`），实现以下函数：

#### `listWordbanks(options: { page: number; pageSize: number; isAdmin: boolean })`

```typescript
export async function listWordbanks(options: {
  page: number;
  pageSize: number;
  isAdmin: boolean;
}): Promise<{ data: IWordBank[]; pagination: { total: number; page: number; pageSize: number } }>
```

**逻辑**:
1. 构建查询条件：`isAdmin ? {} : { is_public: true }`（管理员看到所有，普通用户只看公开）
2. `WordBank.countDocuments(filter)` 得 total
3. `WordBank.find(filter).sort({ createdAt: -1 }).skip((page-1)*pageSize).limit(pageSize)` 分页查询
4. 返回 `{ data, pagination: { total, page, pageSize } }`

#### `getWordBankById(id: string)`

```typescript
export async function getWordBankById(id: string): Promise<{ wordbank: IWordBank; wordCount: number }>
```

**逻辑**:
1. 校验 `id` 是否为有效 ObjectId（`mongoose.Types.ObjectId.isValid(id)`），不是则抛 `AppError(400, "INVALID_ID", "无效的 ID 格式")`
2. `WordBank.findById(id)`，不存在抛 `AppError(404, "NOT_FOUND", "词库不存在")`
3. `Word.countDocuments({ wordbankId: id })` 统计单词数
4. 返回 `{ wordbank, wordCount }`

#### `createWordBank(data: CreateWordBankData)`

```typescript
export async function createWordBank(data: {
  name: string;
  slug: string;
  description: string;
  cover_image?: string;
  gradient?: string;
  is_public?: boolean;
}): Promise<IWordBank>
```

**逻辑**:
1. 直接 `WordBank.create(data)`
2. Catch `MongoServerError` code 11000（slug 或 name 重复）→ 判断 `error.errorResponse?.keyPattern`，如果包含 `slug` 则抛 `AppError(409, "CONFLICT", "slug 已存在")`，如果包含 `name` 则抛 `AppError(409, "CONFLICT", "词库名称已存在")`

#### `updateWordBank(id: string, data: Partial<UpdateWordBankData>)`

```typescript
export async function updateWordBank(
  id: string,
  data: Partial<{ name: string; slug: string; description: string; cover_image: string; gradient: string; is_public: boolean }>
): Promise<IWordBank>
```

**逻辑**:
1. 校验 `id` 是否有效 ObjectId
2. `WordBank.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })`
3. 返回 null → 抛 `AppError(404, "NOT_FOUND", "词库不存在")`
4. Catch 11000 → 同 create 判断 keyPattern 抛 409

#### `deleteWordBank(id: string)`

```typescript
export async function deleteWordBank(id: string): Promise<void>
```

**逻辑**:
1. 校验 `id` 是否有效 ObjectId
2. `WordBank.findByIdAndDelete(id)`，返回 null → 抛 `AppError(404, "NOT_FOUND", "词库不存在")`
3. 级联删除关联单词：`Word.deleteMany({ wordbankId: id })`
4. **注意顺序**：先删单词再删词库，或先删词库再清单词——推荐**先删单词**确保数据完整性（即使后续删词库失败，单词已清理是安全的）。使用 `mongoose.startSession()` + transaction 更好？不需要——MongoDB 单文档原子操作足够，两步顺序执行即可。

### 3.4 新建 `server/src/controllers/wordbank.controller.ts` — 路由处理器

参照 `auth.controller.ts` 的 `asyncHandler` 模式：

```typescript
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validateCreateWordBankInput, validateUpdateWordBankInput } from "../validators/wordbank.validator";
import * as wordbankService from "../services/wordbank.service";
```

实现 5 个导出函数：

#### `list`

- 从 `req.query` 解析 `page` 和 `pageSize`，默认 page=1，pageSize=20
- 确保 page ≥ 1，pageSize 限制在 1~100
- 调用 `wordbankService.listWordbanks({ page, pageSize, isAdmin: req.user?.role === 'admin' })`
- 响应 200：`{ data: [...], pagination: { total, page, pageSize } }`
- 注意：列表接口**不要求认证**，`req.user` 可能为 undefined

#### `getById`

- 从 `req.params.id` 获取词库 ID
- 调用 `wordbankService.getWordBankById(id)`
- 响应 200：`{ ...wordbank.toJSON(), wordCount }`

#### `create`

- 调用 `validateCreateWordBankInput(req.body)`
- 调用 `wordbankService.createWordBank(validatedData)`
- 响应 201：返回创建的词库 JSON

#### `update`

- 调用 `validateUpdateWordBankInput(req.body)`
- 调用 `wordbankService.updateWordBank(req.params.id, validatedData)`
- 响应 200：返回更新后的词库 JSON

#### `remove`

- 调用 `wordbankService.deleteWordBank(req.params.id)`
- 响应 200：`{ message: "词库已删除" }`

### 3.5 新建 `server/src/routes/wordbank.routes.ts` — 路由定义

```typescript
import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware";
import * as wordbankController from "../controllers/wordbank.controller";

const router = Router();

// 公开路由（无需认证）
router.get("/", wordbankController.list);
router.get("/:id", wordbankController.getById);

// 管理员路由（需认证 + 管理员权限）
router.post("/", authMiddleware, adminMiddleware, wordbankController.create);
router.put("/:id", authMiddleware, adminMiddleware, wordbankController.update);
router.delete("/:id", authMiddleware, adminMiddleware, wordbankController.remove);

export const wordbankRoutes = router;
```

**注意**：列表和详情路由不加 `authMiddleware`——未登录用户也能查看公开词库。

### 3.6 修改 `server/src/routes/index.ts` — 挂载路由

在现有代码中取消注释并激活：

```typescript
import { wordbankRoutes } from "./wordbank.routes";

// 替换注释行
routes.use("/wordbanks", wordbankRoutes);
```

---

## 4. 代码规范要求

1. **导出风格**: Service 层使用命名导出（`export async function xxx`）；Controller 使用命名导出（`export const xxx`）；Route 使用命名导出（`export const xxxRoutes`）
2. **异步处理**: 所有 controller 函数用 `asyncHandler` 包装
3. **错误处理**: 使用 `AppError` 抛错，不直接 `res.status().json()` 返回错误
4. **ID 校验**: 所有接收 ObjectId 参数的地方用 `mongoose.Types.ObjectId.isValid(id)` 校验
5. **分页安全**: pageSize 上限 100，page 下限 1
6. **响应格式**: 成功响应不带 `error` 包装；列表响应统一 `{ data, pagination }` 结构
7. **TypeScript**: 不使用 `any`；请求体先用 `unknown` 接收再校验
8. **中文错误消息**: 面向中文用户，错误消息用中文
9. **Mongoose 查询**: 使用 `.lean()` 可获得纯 JS 对象（性能更好），但注意 lean 后无 `.save()` 等实例方法。本次不需要 modify 后再保存，可用 lean；但 `timestamps` 和 `_id` 转换需注意。建议**先不用 lean**，保持和现有 auth 代码一致。

---

## 5. 测试要求

代码必须满足 [test-cases.md](./test-cases.md) 中 21 个测试用例：

| 编号 | 场景 | 关键点 |
|------|------|--------|
| TC-001~005 | 列表查询 | 公开/私有过滤、分页、管理员可见全部 |
| TC-006~007 | 详情查询 | wordCount 统计、404 |
| TC-008~012 | 新增词库 | 201 创建、slug 唯一 409、必填校验 400、非管理员 403、未认证 401 |
| TC-013~016 | 编辑词库 | 部分更新、404、slug 冲突 409 |
| TC-017~020 | 删除词库 | 级联删除单词、403、404 |
| TC-021 | 格式异常 | 非对象请求体 400 |

---

## 6. 注意事项

### 6.1 Model 字段与 ADR 不一致

- ADR 设计文档中 WordBank 有 `gradient` 字段，实际 Model 中已存在，保留
- Task 要求 `slug`、`cover_image`、`is_public`，但当前 Model **缺失**——**第一步就是更新 Model**
- ADR 中 WordBank 没有 `updatedAt`，但 Model 已开启 `timestamps: true`（自动 `createdAt` + `updatedAt`），保持现状

### 6.2 列表接口权限模型

列表接口**不强制认证**，但需要根据是否有 admin 角色返回不同结果：
- 无认证 / 普通用户 → 只看 `is_public: true`
- 管理员 → 看全部（含私有）

实现方式：在 controller 中从 `req.user?.role` 判断，此处**不使用** `authMiddleware`（会拦截未登录用户），也不用 `optionalAuth`（复杂度不必要）——直接判断 `req.user` 即可，因为列表路由不挂任何 auth 中间件时 `req.user` 始终为 `undefined`，此时 `isAdmin = false`，逻辑正确。

等一下——后续 Task 3.3（前端数据层集成）可能需要已登录用户也能看到私有词库。为保持扩展性，可以在列表路由上使用 `optionalAuth`，这样已登录管理员的 `req.user.role === 'admin'` 能被正确识别。**建议使用 `optionalAuth`**：

```typescript
router.get("/", optionalAuth, wordbankController.list);
```

### 6.3 级联删除策略

删除词库时关联单词的处理方式：
- **采用级联删除**（Task 验收标准 AC-5 明确要求"级联处理关联单词"）
- 先 `Word.deleteMany({ wordbankId: id })`，再 `WordBank.findByIdAndDelete(id)`
- 不用事务——两步顺序执行，先删单词即使词库删除失败，数据影响有限（单词已删但词库还在，重新删除即可）

### 6.4 分页参数解析

```typescript
const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
```

### 6.5 slug 格式

采用 kebab-case：`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`
- ✅ `business-english`、`ielts`、`toefl-2024`
- ❌ `Business_English`、`hello world`、`-leading-dash`

如果用户传入大写，在 validator 中 `toLowerCase()` 处理而非拒绝。

---

## 7. 实现顺序

按以下顺序执行，每步完成后验证 TypeScript 编译：

1. **Model 更新** — `WordBank.ts` 新增 3 个字段 + 接口同步
2. **Validator** — `wordbank.validator.ts` 两个校验函数
3. **Service** — `wordbank.service.ts` 5 个业务函数
4. **Controller** — `wordbank.controller.ts` 5 个处理器
5. **Route** — `wordbank.routes.ts` 路由定义
6. **挂载** — `routes/index.ts` 激活子路由
7. **编译检查** — `npx tsc --noEmit` 确保无类型错误
