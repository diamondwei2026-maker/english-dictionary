# Coding Prompt — Task 2.3: 前端认证集成

## 1. 任务目标

将前端 `pages/auth/index.tsx` 中的 mock 登录/注册逻辑替换为真实后端 API 调用，新建 API 请求封装模块，实现 Token 持久化与登录状态管理。

## 2. 技术上下文

- **语言/框架**: Taro 3.6.23 + React 18.2 + TypeScript 5.1
- **H5 dev server 端口**: 10086（`client/config/dev.ts`）
- **后端 API 基路径**: `/api/v1`（开发环境通过 Taro devServer.proxy 代理到 `http://localhost:3000`）
- **API 认证方式**: `Authorization: Bearer <token>` Header

### 后端 API 契约（已由 Task 2.1/2.2 实现）

| 方法 | 路径 | 请求体 | 成功响应 | 错误响应 |
|------|------|--------|---------|---------|
| POST | `/api/v1/auth/register` | `{ phone, password, username? }` | 201 `{ id, phone, username, role, createdAt }` | 400 `{ error: { code, message, errors? } }` |
| POST | `/api/v1/auth/login` | `{ phone, password }` | 200 `{ id, phone, username, role, token }` | 401 `{ error: { code, message } }` |

> ⚠️ 注意：注册成功**只返回用户信息不返回 token**（需跳转登录页）；登录成功才返回 `token`。

### 涉及文件

| 操作 | 文件 | 说明 |
|------|------|------|
| **新建** | `client/src/api/request.ts` | 通用请求封装（Taro.request 适配层） |
| **新建** | `client/src/api/auth.ts` | 认证 API 模块（login, register） |
| **新建** | `client/src/api/index.ts` | API 模块统一导出 |
| **修改** | `client/src/hooks/useAuth.ts` | 增加 Token 持久化读写、logout 函数 |
| **修改** | `client/src/pages/auth/index.tsx` | 替换 mock 逻辑为真实 API 调用 |
| **修改** | `client/config/dev.ts` | 新增 devServer.proxy 配置 |
| **修改** | `client/config/index.ts` | 如 H5 devServer 不在 dev.ts 需在此配置 |

### 外部依赖

无新增 npm 依赖。使用 Taro 内置 `Taro.request`（跨端兼容 H5 + 微信小程序）。

## 3. 实现要求

### 3.1 新建 `client/src/api/request.ts` — 通用请求封装

**职责**: 封装 `Taro.request`，统一处理 Token 注入、错误拦截、响应解析。

**关键设计**:

```typescript
// 类型定义
interface ApiError {
  code: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

interface ApiResponse<T = unknown> {
  data: T;
}

// 核心函数签名
async function request<T>(url: string, options?: RequestOptions): Promise<T>
```

**关键逻辑**:

1. **BASE_URL**: 开发环境设为空字符串 `""`（由 devServer.proxy 代理），生产环境从环境变量读取。Taro 中环境变量通过 `process.env.TARO_APP_API_BASE` 或直接硬编码生产域名。简化处理：开发时请求相对路径 `/api/v1/...`。

2. **Token 注入**: 每次请求前从 `localStorage.getItem('token')` 读取，若存在则设置 Header: `Authorization: Bearer ${token}`。

3. **请求发起**: 使用 `Taro.request`（非 `fetch`），确保 H5 和微信小程序双端可用：
   ```typescript
   import Taro from '@tarojs/taro';
   const res = await Taro.request({
     url: `${BASE_URL}${path}`,
     method: options.method || 'GET',
     data: options.data,
     header: {
       'Content-Type': 'application/json',
       ...(token ? { Authorization: `Bearer ${token}` } : {}),
       ...options.headers,
     },
   });
   ```

4. **401 拦截**: 当 `res.statusCode === 401` 时：
   - 清除 `localStorage.removeItem('token')`
   - 调用 `setGlobalUser(null)` 清除用户状态
   - 使用 `Taro.redirectTo({ url: '/pages/auth/index?mode=login' })` 跳转登录页
   - 抛出错误（调用方 catch 后可展示提示）

5. **通用错误处理**: 当 `statusCode >= 400` 时，解析响应体中的 `error` 对象并抛出，保留 `code`、`message`、`errors` 字段供上层使用。

6. **成功响应**: 直接返回 `res.data`（Taro.request 的 data 字段已是解析后的 JSON）。

### 3.2 新建 `client/src/api/auth.ts` — 认证 API 模块

**职责**: 封装登录和注册的 API 调用。

**函数签名**:

```typescript
import { request } from './request';

interface LoginParams {
  phone: string;
  password: string;
}

interface RegisterParams {
  phone: string;
  password: string;
  username?: string;
}

interface LoginResult {
  id: string;
  phone: string;
  username: string;
  role: 'user' | 'admin';
  token: string;
}

interface RegisterResult {
  id: string;
  phone: string;
  username: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export function login(params: LoginParams): Promise<LoginResult>
export function register(params: RegisterParams): Promise<RegisterResult>
```

**实现**:

```typescript
export function login(params: LoginParams) {
  return request<LoginResult>('/api/v1/auth/login', {
    method: 'POST',
    data: params,
  });
}

export function register(params: RegisterParams) {
  return request<RegisterResult>('/api/v1/auth/register', {
    method: 'POST',
    data: params,
  });
}
```

### 3.3 新建 `client/src/api/index.ts` — 统一导出

```typescript
export { login, register } from './auth';
export { request } from './request';
```

### 3.4 修改 `client/src/hooks/useAuth.ts` — 增强认证状态管理

**修改内容**:

1. **新增 `TOKEN_KEY` 常量**: `const TOKEN_KEY = 'auth_token';`

2. **新增 `logout()` 函数**:
   ```typescript
   export function logout(): void {
     localStorage.removeItem(TOKEN_KEY);
     setGlobalUser(null);
     Taro.redirectTo({ url: '/pages/auth/index?mode=login' });
   }
   ```
   注意：在非 Taro 组件环境中使用 `Taro.redirectTo` 是安全的（Taro API 全局可用）。

3. **新增 `getToken()` / `setToken()` 辅助函数**:
   ```typescript
   export function getToken(): string | null {
     return localStorage.getItem(TOKEN_KEY);
   }
   export function setToken(token: string): void {
     localStorage.setItem(TOKEN_KEY, token);
   }
   ```

4. **保留现有逻辑**: `globalUser` 单例、`listeners` Set、`getGlobalUser`、`setGlobalUser`、`onUserChange`、`useAuth` hook 全部保留不动。

### 3.5 修改 `client/src/pages/auth/index.tsx` — 替换 mock 为真实 API

**改动范围**: 仅修改 `handleSubmit` 函数，以及删除不再需要的 import。

**需要删除的 import**:
```typescript
// 删除这两行
import { mockUsers } from "../../data/mockData";
import type { AuthUser } from "../../data/types";
```

**需要新增的 import**:
```typescript
import { login, register } from "../../api/auth";
import { setToken, setGlobalUser } from "../../hooks/useAuth";
```

**`handleSubmit` 新逻辑**:

```
handleSubmit():
  1. 前端校验（保持现有逻辑不变）：
     - cleanPhone = phone.replace(/\s/g, "")
     - 空字段校验 → setError("请填写所有必填字段")
     - 手机号格式校验 → setError("请输入有效的手机号")
     - 注册模式用户名非空校验 → setError("请填写用户名")
     - 注册模式密码长度 < 6 → setError("密码至少需要6位")
     - 注册模式纯数字密码 → setError("密码必须包含字母和数字")

  2. setLoading(true), setError("")

  3. if (isLogin):
       try:
         result = await login({ phone: cleanPhone, password })
         setToken(result.token)                         // 持久化 token
         setGlobalUser({                                // 更新全局状态
           id: result.id,
           username: result.username,
           phone: result.phone,
           role: result.role,
         })
         Taro.showToast({ title: "登录成功", icon: "success" })
         setTimeout → role === 'admin'
           ? redirectTo /pages/admin/index?tab=overview
           : redirectTo /pages/profile/index

       catch (error):
         // 提取后端返回的错误信息
         msg = error?.message || "登录失败，请稍后重试"
         // 如果 401 已经被 request.ts 拦截并跳转，这里可能不会执行到
         // 但也可能是网络错误等
         setError(msg)

     else (register):
       try:
         await register({ phone: cleanPhone, password, username: username.trim() })
         Taro.showToast({ title: "注册成功", icon: "success" })
         setTimeout → setMode("login")  // 切换到登录 Tab
         setPhone(""); setPassword(""); setUsername("")  // 清空表单

       catch (error):
         msg = error?.message || "注册失败，请稍后重试"
         setError(msg)

  4. finally: setLoading(false)
```

**错误信息提取**：`request.ts` 在非 401 的错误时 throw 一个 Error，message 设置为后端返回的 `error.message`。因此 `catch` 中直接取 `error.message` 即可。

**保留不变的部分**：
- Tab 切换（login/register）的 UI 和逻辑 — 完全不动
- 表单输入、focus 样式 — 完全不动
- 密码可见性切换 — 完全不动
- 演示提示框（登录页底部黄色提示）— 更新文案：去掉"演示密码为 123456"，改为提示"密码需同时包含字母和数字"

### 3.6 修改 `client/config/dev.ts` — 配置 API 代理

Taro H5 devServer 基于 webpack-dev-server，可在 `dev.ts` 的 `h5` 字段下配置 `devServer.proxy`：

```typescript
export default {
  env: {
    NODE_ENV: '"development"',
  },
  mini: {},
  h5: {
    devServer: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  },
};
```

> ⚠️ 注意：确认 Taro 3.6 支持 `h5.devServer.proxy` 配置。如果 Taro 的 config 合并机制不支持此字段（Taro 使用 webpack-chain），备选方案是在 `config/index.ts` 的 `h5.webpackChain` 中手动添加 proxy 配置，或在项目根目录创建 `client/.env.development` 文件通过环境变量指定 API 地址。

**备选方案（如果 devServer.proxy 不生效）**：在 `client/src/api/request.ts` 中设置开发环境 BASE_URL 为 `http://localhost:3000`，同时确保后端 CORS 已允许 `http://localhost:10086`（已配置）。

## 4. 代码规范要求

- 使用 `async/await`，不手动写 Promise 链
- TypeScript 类型：所有 API 请求/响应必须有明确类型定义
- 保持现有代码风格：inline style 对象、中文注释
- 不引入新的 npm 依赖
- 错误处理：API 层统一拦截 401，业务层 catch 展示友好提示
- Taro API 调用：使用 `Taro.request` 而非 `fetch`（保证小程序兼容）
- localStorage key 统一用 `auth_token`

## 5. 测试要求

代码必须能通过以下测试用例（详见 `test-cases.md`）：

| 编号 | 用例 | 关键验证点 |
|------|------|-----------|
| TC-001 | 登录正常流程 | API 调用 → token 存储 → 跳转 |
| TC-002 | 密码错误 | 后端 401 → 错误提示 → 不跳转 |
| TC-003 | 手机号未注册 | 后端 401 → 错误提示 |
| TC-004 | 空字段校验 | 前端拦截 → 不发起 API 请求 |
| TC-005 | 手机号格式校验 | 前端拦截 |
| TC-006 | 注册正常流程 | API 调用 → 成功提示 → 切换登录 Tab |
| TC-007 | 手机号已注册 | 后端错误 → 提示 |
| TC-010 | Token 自动携带 | 后续请求含 Authorization Header |
| TC-011 | 401 自动处理 | 清除 token → 跳转登录页 |
| TC-012 | 刷新保持登录 | localStorage 读 token → 状态恢复 |
| TC-013 | 退出登录 | 清除 token + user |
| TC-016 | Loading 状态 | 按钮禁用 + "处理中..." |

## 6. 注意事项

1. **后端密码校验规则**：后端要求密码至少 6 位且**同时包含字母和数字**。注册页需要在前端做对应的密码格式校验（至少 6 位 + 必须含字母和数字），与后端校验保持一致，避免用户提交后才被后端拒绝。

2. **注册成功后不自动登录**：后端 `POST /api/v1/auth/register` 返回 201 但不返回 token。注册成功后应**切换到登录 Tab**让用户手动登录，而非自动登录。

3. **401 拦截与页面跳转**：`request.ts` 中的 401 拦截调用 `Taro.redirectTo` 跳转登录页。这是全局行为，任何 API 调用返回 401 都会触发，不仅限于登录接口。

4. **Taro.request 与 fetch 差异**：
   - `Taro.request` 返回 `{ data, statusCode, header }`，`data` 已是解析后的 JSON 对象
   - 在 H5 环境下 Taro 内部会将 `Taro.request` 转为 `fetch` 调用
   - 在小程序环境下使用原生 `wx.request`
   - **禁止使用** `fetch()` 或 `axios`，统一用 `Taro.request`

5. **开发环境跨域**：优先使用 Taro devServer.proxy（方案 A）；如果 Taro 3.6 不支持 `h5.devServer.proxy`，则使用直接跨域方案（方案 B：`BASE_URL = 'http://localhost:3000'` + 后端 CORS 白名单 `localhost:10086`）。后端 CORS 已配置允许 `localhost:10086`。

6. **TypeScript 类型共享**：`client/src/data/types.ts` 中已有 `AuthUser` 类型（`{ id, username, phone, role }`），API 层新增的类型（`LoginResult` 等）直接在 `api/auth.ts` 中定义，不修改 `types.ts` 以避免影响其他页面。

7. **最小改动原则**：只改动认证相关的文件和逻辑。不修改以下文件：
   - `app.tsx`、`app.config.ts` — 不动
   - `useNavigate.ts` — 不动
   - 其他页面组件（home, libraries, profile, admin 等）— 不动
   - `mockData.ts` — 不动（后续 Task 逐步移除）
