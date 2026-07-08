# Coding Prompt — Task 2.1: 用户注册与登录 API

> 生成日期：2026-07-08 | 关联文档：[task.md](./task.md) | [test-cases.md](./test-cases.md)

---

## 1. 任务目标

实现 `POST /api/auth/register`（手机号注册）和 `POST /api/auth/login`（手机号+密码登录）两个 REST API 端点，含输入验证、bcrypt 加密、统一错误处理。Token 签发留到 Task 2.2，本 Task 登录成功返回占位 token。

---

## 2. 技术上下文

- **语言/框架**: Node.js 18+ / Express 4 + TypeScript 5.5 / Mongoose 9.7
- **数据库表**: `users`（已有 User Model，字段：`username`, `phone`, `passwordHash`, `role`, `learnedWords`, `favoriteWords`）
- **注意**: User Model 中字段名是 `username`（不是 `nickname`），Task 描述中的 "nickname" 实际对应 `username`
- **新建依赖**: 安装 `bcrypt` + `@types/bcrypt`
- **涉及文件**:
  - (新建) `server/src/validators/auth.validator.ts` — 注册/登录输入验证规则
  - (新建) `server/src/services/auth.service.ts` — 注册/登录业务逻辑
  - (新建) `server/src/controllers/auth.controller.ts` — 请求处理 + 响应格式化
  - (新建) `server/src/routes/auth.routes.ts` — 路由定义
  - (修改) `server/src/routes/index.ts` — 挂载 auth 路由
  - (修改) `server/src/middleware/index.ts` — 新增验证失败错误类
  - (新建) `server/src/utils/errors.ts` — 自定义错误类（AppError）
  - (修改) `server/src/middleware/index.ts` — errorHandler 增强处理 AppError

---

## 3. 实现要求

### 3.1 安装依赖

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

### 3.2 文件 `server/src/utils/errors.ts`（新建）

定义 `AppError` 类，用于在 service/controller 层抛出带状态码的错误：

```typescript
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
```

- `statusCode`: HTTP 状态码（400/401/409/500）
- `code`: 业务错误码（如 `VALIDATION_ERROR`、`PHONE_EXISTS`、`INVALID_CREDENTIALS`）
- `message`: 人类可读的错误信息

### 3.3 文件 `server/src/validators/auth.validator.ts`（新建）

验证规则：

**手机号校验**：正则 `/^1[3-9]\d{9}$/`（11 位，1 开头，第二位 3-9）

**密码校验**：
- 最小长度 6
- 必须同时包含字母和数字：正则 `/(?=.*[a-zA-Z])(?=.*\d)/`

**注册 schema**：
```typescript
interface RegisterInput {
  phone: string;       // 必填，格式 ^1[3-9]\d{9}$
  password: string;    // 必填，min 6，含字母和数字
  username?: string;   // 可选，默认用手机号脱敏
}
```

**登录 schema**：
```typescript
interface LoginInput {
  phone: string;       // 必填，格式 ^1[3-9]\d{9}$
  password: string;    // 必填
}
```

导出两个验证函数：
```typescript
export function validateRegisterInput(body: unknown): RegisterInput
export function validateLoginInput(body: unknown): LoginInput
```

**关键逻辑**：
1. 检查 body 是否为 object 且不为 null
2. 检查 `phone` 和 `password` 是否存在且为 string 类型
3. 对 phone 执行正则校验
4. 对 password（注册时）执行长度和字符组合校验
5. 校验失败时 `throw new AppError(400, "VALIDATION_ERROR", "具体错误信息")`
6. 校验通过返回类型化对象

**错误信息格式要求**：每个字段的验证错误单独描述，帮助前端展示。可在 AppError 中携带 errors 数组：

```typescript
// 在 AppError 中新增可选的 errors 字段
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly errors?: Array<{ field: string; message: string }>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}
```

### 3.4 文件 `server/src/services/auth.service.ts`（新建）

#### `register(input: RegisterInput): Promise<IUser>`

```typescript
import bcrypt from "bcrypt";
import { User, IUser } from "../models";
import { AppError } from "../utils/errors";

const SALT_ROUNDS = 10;
const TOKEN_PLACEHOLDER = "placeholder_token_v2.2";

export async function register(input: RegisterInput): Promise<IUser> {
  // 1. 检查手机号唯一性
  const existing = await User.findOne({ phone: input.phone });
  if (existing) {
    throw new AppError(409, "PHONE_EXISTS", "该手机号已注册");
  }

  // 2. 生成默认 username（如果未提供）—— 手机号脱敏：138****8001
  const username = input.username || desensitizePhone(input.phone);

  // 3. bcrypt hash 密码（10 rounds）
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // 4. 创建用户
  const user = await User.create({
    phone: input.phone,
    passwordHash,
    username,
    role: "user", // 默认普通用户
  });

  return user;
}

function desensitizePhone(phone: string): string {
  return phone.slice(0, 3) + "****" + phone.slice(-4);
}
```

#### `login(input: LoginInput): Promise<{ user: IUser; token: string }>`

```typescript
export async function login(input: LoginInput): Promise<{ user: IUser; token: string }> {
  // 1. 查找用户
  const user = await User.findOne({ phone: input.phone });
  if (!user) {
    // 不区分"用户不存在"和"密码错误"，防撞库
    throw new AppError(401, "INVALID_CREDENTIALS", "手机号或密码错误");
  }

  // 2. 验证密码
  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    // 同样不区分
    throw new AppError(401, "INVALID_CREDENTIALS", "手机号或密码错误");
  }

  // 3. 返回用户信息 + 占位 token
  return {
    user,
    token: TOKEN_PLACEHOLDER,
  };
}
```

### 3.5 文件 `server/src/controllers/auth.controller.ts`（新建）

控制器负责从 `req.body` 提取参数 → 调用 validator 验证 → 调用 service → 格式化响应。

#### `register(req: Request, res: Response, next: NextFunction): Promise<void>`

1. `validateRegisterInput(req.body)` — 验证输入（失败自动 throw AppError → next(err)）
2. `const user = await authService.register(validatedInput)`
3. 返回 201 + 用户信息（不泄露 passwordHash）：

```typescript
res.status(201).json({
  id: user._id,
  phone: user.phone,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt,
});
```

#### `login(req: Request, res: Response, next: NextFunction): Promise<void>`

1. `validateLoginInput(req.body)`
2. `const { user, token } = await authService.login(validatedInput)`
3. 返回 200：

```typescript
res.json({
  id: user._id,
  phone: user.phone,
  username: user.username,
  role: user.role,
  token, // 占位 token
});
```

**错误处理**: 所有 controller 函数用 `try/catch` 或 `asyncHandler` 包裹，捕获的错误传给 `next(err)`。

推荐实现一个 `asyncHandler` 工具函数（放在 `server/src/utils/asyncHandler.ts`），避免每个 controller 重复 try-catch：

```typescript
import { Request, Response, NextFunction } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### 3.6 文件 `server/src/routes/auth.routes.ts`（新建）

```typescript
import { Router } from "express";
import { register, login } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);

export const authRoutes = router;
```

### 3.7 文件 `server/src/routes/index.ts`（修改）

取消 auth 路由的注释，挂载：

```typescript
import { authRoutes } from "./auth.routes";
// ...
routes.use("/auth", authRoutes);
```

同时删除通配符 `*` 的 404 兜底行（因为 `/api/v1` 前缀在 `app.ts` 中已挂载，404 应在全局 errorHandler 处理或保留在 routes 末尾）。

### 3.8 文件 `server/src/middleware/index.ts`（修改）

增强 `errorHandler` 以处理 `AppError`：

```typescript
import { AppError } from "../utils/errors";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.errors ? { errors: err.errors } : {}),
      },
    });
    return;
  }

  console.error("Unhandled error:", err.message);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    },
  });
}
```

---

## 4. API 约定

- **路由前缀**: `/api/v1/auth`
- **请求格式**: JSON（Content-Type: application/json）
- **响应格式**: JSON

### 成功响应格式规格

```typescript
// 注册成功 (201)
{
  id: string;         // ObjectId
  phone: string;
  username: string;
  role: "user" | "admin";
  createdAt: string;  // ISO 8601
}

// 登录成功 (200)
{
  id: string;
  phone: string;
  username: string;
  role: "user" | "admin";
  token: string;      // 占位值，Task 2.2 替换为 JWT
}
```

### 错误响应格式规格

```typescript
{
  error: {
    code: string;      // 错误码（如 VALIDATION_ERROR, PHONE_EXISTS, INVALID_CREDENTIALS）
    message: string;   // 人类可读信息
    errors?: Array<{   // 字段级别错误（可选，仅验证失败时出现）
      field: string;
      message: string;
    }>;
  }
}
```

---

## 5. 代码规范要求

- 使用 `async/await` 而非 `Promise.then`
- TypeScript 严格模式，所有函数参数和返回值标注类型
- 分层清晰：`routes → controllers → services → models`，层间不越级
- `bcrypt` 默认 salt rounds = 10
- API 路径前缀 `/api/v1/auth`
- 错误信息用中文（面向中国用户），错误码用英文大写蛇形
- 不重复 try-catch，使用 `asyncHandler` 统一捕获

---

## 6. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 用例 | 要点 |
|------|------|
| TC-A01 | 正常注册返回 201 + 用户信息（不含 passwordHash） |
| TC-A02 | nickname 缺失时默认手机号脱敏 |
| TC-A03 | 重复手机号返回 409 Conflict |
| TC-A04~A06 | 手机号格式错误返回 400（非11位/非1开头/含字母） |
| TC-A07~A09 | 密码强度验证（<6位/纯数字/纯字母 → 400） |
| TC-A10~A11 | 缺少必填字段 phone/password → 400 |
| TC-B01 | 正常登录返回 200 + 用户信息 + token |
| TC-B02 | 手机号不存在 → 401 统一措辞 |
| TC-B03 | 密码错误 → 401，措辞与 B02 完全一致 |
| TC-B04~B05 | 登录缺少 phone/password → 400 |
| TC-C01 | 未知路由 → 404 |
| TC-C02 | phone 超长 → 400 |
| TC-C03 | 密码既短又纯数字 → 400 |
| TC-C04~C05 | phone/password 空字符串 → 400 |
| TC-D01 | 注册→登录完整链路 |
| TC-D02 | passwordHash 为 bcrypt 格式，非明文 |

---

## 7. 注意事项

- **`username` vs `nickname`**: Task 描述中使用 "nickname"，但 User Model 中字段名是 `username`。注册接口的请求 body 也使用 `username` 而非 `nickname`，保持与 Model 一致。
- **不返回 `passwordHash`**: 所有响应中永远不暴露密码哈希。控制器里手动选取字段返回，不用 `toJSON()` 默认序列化。
- **防撞库安全**: 登录失败时，"用户不存在"和"密码错误"返回**完全相同的**状态码(401)、错误码(`INVALID_CREDENTIALS`)和错误信息("手机号或密码错误")。
- **bcrypt 异步**: `bcrypt.hash()` 和 `bcrypt.compare()` 是 CPU 密集操作，已内置异步支持。使用 `async/await` 版本而非同步版本。
- **Token 占位**: 本 Task 登录返回 `token: "placeholder_token_v2.2"`，Task 2.2 将其替换为真实 JWT。确保返回格式包含 `token` 字段，方便前端对接。
- **`passwordHash` 而非 `password`**: User Model 中密码字段名为 `passwordHash`，不是 `password`。`User.create()` 时传入 `passwordHash` 字段。
- **默认 role**: 注册的新用户 role 默认 `"user"`，不是 `"admin"`。管理员通过 Seed 脚本预创建。
