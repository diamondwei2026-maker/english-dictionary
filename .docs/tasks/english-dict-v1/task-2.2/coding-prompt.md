# Coding Prompt — Task 2.2: JWT 认证中间件与密码加密

## 1. 任务目标

将 Task 2.1 中登录接口的占位 Token 替换为真实 JWT 签发，创建认证/授权中间件体系（`authMiddleware`、`optionalAuth`、`adminMiddleware`），并创建 `/me` 路由供前端获取当前用户信息。

## 2. 技术上下文

- **语言/框架**: Node.js 18+ / Express 4.21 / TypeScript 5.5 / Mongoose 9.7
- **新增依赖**: `jsonwebtoken`（运行依赖）、`@types/jsonwebtoken`（开发依赖）
- **已有依赖**: `bcrypt` ^6.0.0（已在 Task 2.1 正确配置 SALT_ROUNDS=10）
- **ADR 依据**: [server ADR §2.2](../../adr/server.md) — JWT Bearer Token 认证，无状态免 Redis

### 涉及文件

| 操作 | 路径 | 说明 |
|------|------|------|
| 新建 | `server/src/utils/jwt.ts` | JWT 签发/验证工具函数 |
| 新建 | `server/src/middleware/auth.ts` | 三个认证中间件 |
| 新建 | `server/src/types/express.d.ts` | Express Request 类型扩展 |
| 新建 | `server/src/controllers/user.controller.ts` | 用户相关控制器（`/me`） |
| 新建 | `server/src/routes/user.routes.ts` | 用户路由 |
| 修改 | `server/src/services/auth.service.ts` | 替换占位 Token 为真实 JWT 签发 |
| 修改 | `server/src/config/index.ts` | 更新 JWT 默认过期时间为 7d，增加未配置密钥的警告 |
| 修改 | `server/src/middleware/index.ts` | 导出新中间件 |
| 修改 | `server/src/routes/index.ts` | 挂载 `/me` 路由 |
| 修改 | `server/package.json` | 添加 `jsonwebtoken` 依赖 |

## 3. 实现要求

### 3.1 安装依赖

```bash
cd server && pnpm add jsonwebtoken && pnpm add -D @types/jsonwebtoken
```

---

### 3.2 新建 `server/src/types/express.d.ts` — Express Request 类型扩展

**职责**: 为 `req.user` 提供 TypeScript 类型声明。

```typescript
declare namespace Express {
  interface Request {
    user?: {
      userId: string;  // User._id 的字符串形式
      role: "user" | "admin";
    };
  }
}
```

> **注意**: 确保 `tsconfig.json` 的 `include` 覆盖到此文件（当前 `"include": ["src/**/*"]` 已覆盖）。

---

### 3.3 新建 `server/src/utils/jwt.ts` — JWT 工具函数

**职责**: 封装 JWT 签发和验证逻辑，供 service 层和 middleware 层共用。

```typescript
import jwt from "jsonwebtoken";
import { config } from "../config";

interface JwtPayload {
  userId: string;
  role: "user" | "admin";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
```

**关键逻辑**:
1. `signToken` — 从 `config` 读取 `jwtSecret` 和 `jwtExpiresIn`，不硬编码密钥或过期时间
2. `verifyToken` — 使用 `jwt.verify`，出错时直接抛出（由中间件 `try/catch` 处理），不在此处做错误转换
3. Payload 字段名用 `userId`（驼峰），与 `req.user` 保持一致
4. **不要**在此文件打印 console.warn 或读取 process.env — 所有配置统一从 `config` 对象获取

---

### 3.4 修改 `server/src/services/auth.service.ts` — 替换占位 Token

**修改位置**: `login()` 函数末尾的返回值

**当前代码**:
```typescript
const TOKEN_PLACEHOLDER = "placeholder_token_v2.2";
// ...
return { user, token: TOKEN_PLACEHOLDER };
```

**修改后**:
```typescript
import { signToken } from "../utils/jwt";
// 删除 TOKEN_PLACEHOLDER 常量
// login 函数改为:
export async function login(input: LoginInput): Promise<{ user: IUser; token: string }> {
  const user = await User.findOne({ phone: input.phone });
  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "手机号或密码错误");
  }
  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(401, "INVALID_CREDENTIALS", "手机号或密码错误");
  }
  const token = signToken({ userId: user._id.toString(), role: user.role });
  return { user, token };
}
```

**关键点**:
- `user._id` 是 Mongoose ObjectId，签署前转为字符串 `.toString()`
- 删除 `TOKEN_PLACEHOLDER` 常量
- 其余逻辑（手机号查找、bcrypt 比对、错误处理）保持不动

---

### 3.5 修改 `server/src/config/index.ts` — 更新 JWT 默认值，增加安全警告

**修改位置 1**: `jwtExpiresIn` 默认值

```typescript
// 将:
jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
// 改为:
jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
```

**修改位置 2**: 在 `dotenv.config()` 之后、`parseIntSafe` 之前，增加 JWT_SECRET 未设置的安全警告：

```typescript
// 警告：生产环境必须设置 JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.warn(
    "[WARN] JWT_SECRET not set, using default 'dev-secret' — this is insecure in production"
  );
}
```

> 检查逻辑：`!process.env.JWT_SECRET` 为真时才打印警告（配置对象中的 fallback `"dev-secret"` 只影响 `config.jwtSecret` 的值，不影响此检查）。

---

### 3.6 新建 `server/src/middleware/auth.ts` — 认证与授权中间件

**职责**: 实现三个中间件 — `authMiddleware`、`optionalAuth`、`adminMiddleware`。

> 按照 ADR §4.2 目录结构，将认证相关中间件全部放在一个 `auth.ts` 文件中（含 `adminMiddleware`）。

#### 3.6.1 公共辅助：提取 Token

```typescript
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../utils/errors";

/**
 * 从 Authorization Header 提取 Bearer Token。
 * 返回 null 表示无 Token 或格式错误。
 */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] || null;
}
```

#### 3.6.2 `authMiddleware` — 强制认证

```typescript
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    throw new AppError(401, "UNAUTHORIZED", "未提供认证令牌，请在 Authorization Header 中使用 Bearer <token>");
  }
  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      throw new AppError(401, "TOKEN_EXPIRED", "令牌已过期，请重新登录");
    }
    throw new AppError(401, "INVALID_TOKEN", "令牌无效或签名错误");
  }
}
```

**关键逻辑**:
1. 调用 `extractToken` 提取 Token → 无 Token 时抛 401，错误信息指明正确格式
2. `verifyToken` 抛出的异常分两类处理：
   - `err.name === "TokenExpiredError"` → 401 `TOKEN_EXPIRED`（区别于无效 Token）
   - 其他（JsonWebTokenError、NotBeforeError 等）→ 401 `INVALID_TOKEN`
3. 验证通过后将 `payload`（含 `userId` + `role`）挂载到 `req.user`

> **注意**: 中间件中使用 `throw` 而非 `next(err)` 也可以——当前项目使用 `asyncHandler` 包装 handler（见 Task 2.1），但中间件是同步的，直接 `throw` 会被 Express 5+ 或全局错误处理捕获。为确保兼容 Express 4，建议改为 `return next(new AppError(...))` 或保持 `throw` 并在调用处用 `try/catch`。

**实际实现方式（兼容 Express 4）**：
Express 4 **不会**自动捕获同步 `throw` —— 需要使用 `next(err)` 模式：

```typescript
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (!token) {
      return next(new AppError(401, "UNAUTHORIZED", "未提供认证令牌，请在 Authorization Header 中使用 Bearer <token>"));
    }
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError(401, "TOKEN_EXPIRED", "令牌已过期，请重新登录"));
    }
    return next(new AppError(401, "INVALID_TOKEN", "令牌无效或签名错误"));
  }
}
```

#### 3.6.3 `optionalAuth` — 可选认证

```typescript
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    req.user = undefined;
    return next();
  }
  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, role: payload.role };
  } catch {
    req.user = undefined; // 静默失败，不阻断请求
  }
  next();
}
```

**关键逻辑**:
1. 无 Token → 设 `req.user = undefined`，直接 `next()`
2. 有 Token → 尝试验证
3. 验证成功 → 挂载 `req.user`
4. 验证失败（无论过期还是无效）→ `req.user = undefined`，**静默放行**，**不**抛异常

#### 3.6.4 `adminMiddleware` — 管理员权限

```typescript
export function adminMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError(403, "FORBIDDEN", "权限不足，需要管理员权限"));
  }
  next();
}
```

**关键逻辑**:
- 必须在 `authMiddleware` **之后**使用（依赖 `req.user` 已挂载）
- `req.user` 不存在或 role 非 admin → 403
- 不需要重复验证 Token（`authMiddleware` 已保证）

---

### 3.7 修改 `server/src/middleware/index.ts` — 导出

```typescript
export { errorHandler } from "./errorHandler"; // 如果已拆分到独立文件，保持现有代码不变
export { authMiddleware, optionalAuth, adminMiddleware } from "./auth";
```

> 当前 `middleware/index.ts` 直接定义了 `errorHandler` 函数。如果 `errorHandler` 在此文件中内联定义，则只需追加 `export { authMiddleware, optionalAuth, adminMiddleware } from "./auth";` 一行。**不要**把 `errorHandler` 移走。

---

### 3.8 新建 `server/src/controllers/user.controller.ts` — 用户控制器

**职责**: 提供 `/me` 路由的 handler，返回当前登录用户的信息。

```typescript
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models";

export const getMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const user = await User.findById(req.user!.userId).select("-passwordHash");
    if (!user) {
      res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "用户不存在" },
      });
      return;
    }
    res.json({
      id: user._id,
      phone: user.phone,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    });
  }
);
```

**关键逻辑**:
1. 从 `req.user.userId` 获取当前用户 ID（`authMiddleware` 已保证 `req.user` 存在）
2. `.select("-passwordHash")` 排除敏感字段
3. 用户不存在时返回 404（处理 Token 有效但用户被删除的极端情况）
4. 返回格式与登录/注册接口保持一致

---

### 3.9 新建 `server/src/routes/user.routes.ts` — 用户路由

```typescript
import { Router } from "express";
import { authMiddleware } from "../middleware";
import { getMe } from "../controllers/user.controller";

const router = Router();

router.get("/me", authMiddleware, getMe);

export const userRoutes = router;
```

---

### 3.10 修改 `server/src/routes/index.ts` — 挂载路由

**修改内容**: 解除 `userRoutes` 的注释并挂载

```typescript
import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";  // ← 新增

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/users", userRoutes);  // ← 新增（注意路径 `/users`，与 ADR §5.2 一致）
// 子路由占位（后续 Task 实现）
// routes.use("/wordbanks", wordbankRoutes);
// routes.use("/words", wordRoutes);

// 兜底 404
routes.all("*", (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});
```

> **路径说明**: `/api/v1` 前缀在 `app.ts` 中统一挂载。`GET /api/v1/users/me` 符合 ADR §5.2 接口设计。

---

## 4. 代码规范要求

1. **错误处理**: 使用 `next(new AppError(...))` 而非 `throw`（Express 4 兼容性），参考 [Express 错误处理文档](https://expressjs.com/en/guide/error-handling.html)
2. **异步处理**: handler 使用项目中已有的 `asyncHandler` 包装
3. **类型安全**: 禁止使用 `any` 类型（`catch (err: any)` 除外）；JWT payload 使用明确的 `JwtPayload` 接口
4. **命名规范**: 
   - JWT payload 字段用驼峰 `userId`（不用 `user_id` 或 `sub`）
   - 文件用小写 + 短横线：`auth.ts`、`user.controller.ts`
5. **安全**: 
   - 密码 hash 不在任何 API 响应中出现（使用 `.select("-passwordHash")`）
   - Token 验证错误不泄露签名密钥信息
   - 登录错误统一返回 "手机号或密码错误"（不区分用户不存在/密码错误）

## 5. 测试要求

代码必须满足以下测试用例（详见 [test-cases.md](./test-cases.md)）：

### SUB-2.2.1: JWT Token 签发
- **TC-001**: 登录返回真实 JWT（三段式 `eyJ...`，7 天有效期，含 userId + role）
- **TC-002**: 不同用户 Token 的 userId 不同
- **TC-003**: Token 用 `JWT_SECRET` 环境变量签名（验证硬编码密钥不存在）
- **TC-004**: JWT_SECRET 未配置时打印警告

### SUB-2.2.2: 认证中间件
- **TC-005**: 有效 Token → `req.user` 挂载 userId + role
- **TC-006**: 无 Authorization Header → 401
- **TC-007**: Bearer 前缀错误 / 无前缀 → 401
- **TC-008**: 无效签名 → 401
- **TC-009**: 过期 Token → 401（区分过期 vs 无效）
- **TC-010**: 篡改 payload → 401
- **TC-011**: 空 Token（`Bearer ` 后无内容）→ 401
- **TC-012**: optionalAuth 无 Token → 放行，req.user = undefined
- **TC-013**: optionalAuth 有效 Token → 挂载 req.user
- **TC-014**: optionalAuth 无效 Token → 放行，req.user = undefined
- **TC-015**: optionalAuth 过期 Token → 放行，req.user = undefined

### SUB-2.2.3: 管理员权限中间件
- **TC-016**: admin 角色 → 放行
- **TC-017**: user 角色 → 403
- **TC-018**: 未认证 → 401（authMiddleware 先拦截，不走到 403）

### 密码确认
- **TC-019**: 数据库存储 bcrypt hash（`$2b$` 或 `$2a$` 开头）
- **TC-020**: 密码大小写敏感

### 端到端
- **TC-021**: 注册 → 登录 → Token 访问 `/me`
- **TC-022**: 过期 Token 拒绝 → 重新登录 → 新 Token 可用

## 6. 注意事项

1. **Express 4 同步中间件 throw 不会被自动捕获**：必须使用 `try/catch` + `next(err)` 模式，否则异常会导致请求挂起无响应。

2. **Mongoose ObjectId → 字符串**：`user._id` 是 ObjectId 类型，签名 JWT 前必须 `.toString()`，否则 Token payload 会包含 ObjectId 对象而非字符串。

3. **`extractToken` 空 Token 处理**：`Authorization: Bearer `（Bearer 后有空格无内容）→ `parts[1]` 为空字符串 `""`，应被视作无 Token 返回 null。实现时检查 `parts[1]` 是否为 truthy。

4. **`verifyToken` 错误类型判断**：`jsonwebtoken` 抛出的错误通过 `err.name` 区分：
   - `"TokenExpiredError"` — 过期
   - `"JsonWebTokenError"` — 签名无效/格式错误
   - `"NotBeforeError"` — nbf 声明未满足
   
   推荐 import 方式：`import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken"`，然后使用 `err instanceof TokenExpiredError` 替代字符串比较（更可靠）。

5. **中间件执行顺序**：在实际路由中使用 `[authMiddleware, adminMiddleware]` 数组形式传递，确保先认证后授权。示例：
   ```typescript
   router.post("/wordbanks", authMiddleware, adminMiddleware, createWordBank);
   ```
   后续 Task（3.1 词库 CRUD）会按此模式使用。

6. **`jwtExpiresIn` 默认值变更**：从 `"2h"` 改为 `"7d"`，与 Task 验收标准一致。如需更细粒度的 Access/Refresh Token 双 Token 方案，留到后续 Task 实现。

7. **已完成的 bcrypt 配置无需修改**：Task 2.1 已正确实现 `SALT_ROUNDS=10` + `bcrypt.hash` + `bcrypt.compare`，本 Task 仅确认无误。
