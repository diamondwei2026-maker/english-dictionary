# 测试用例 — Task 2.2: JWT 认证中间件与密码加密

## 测试范围分析

| 维度 | 覆盖点 |
|------|--------|
| 功能测试 | Token 签发、认证中间件、可选认证、管理员权限、bcrypt 配置 |
| 边界测试 | Token 临界过期、空 Header、Bearer 格式变体 |
| 异常测试 | 无效签名、过期 Token、篡改 Token、缺失密钥 |
| 集成测试 | 登录接口返回真实 Token → 中间件验证通过、中间件与路由集成 |

---

## 一、JWT Token 签发（SUB-2.2.1）

### TC-001: 登录成功返回真实 JWT Token
- **类型**: 功能测试
- **关联验收标准**: 登录接口签发 JWT Token（含 user_id、role，有效期 7 天）
- **前置条件**: 已注册用户（phone: `13800138001`, password: `pass123`）
- **输入**:
  - POST `/api/v1/auth/login`
  - Body: `{ "phone": "13800138001", "password": "pass123" }`
- **执行步骤**:
  1. 发送登录请求
  2. 从响应中获取 `token` 字段
  3. 使用 jwt.decode 解码 Token（不验证签名）
- **预期输出**:
  - HTTP 状态码：200
  - 响应体 `token` 为有效 JWT 字符串（三段式，以 `eyJ` 开头）
  - 解码 payload 包含 `userId`（或 `user_id`）、`role` 字段
  - `role` 值为 `"user"`
  - `exp` 存在，且 `exp - iat ≈ 7 * 24 * 3600`（7天）
- **清理**: 无

### TC-002: Token payload 包含正确的用户标识
- **类型**: 功能测试
- **关联验收标准**: payload 包含 user_id、role
- **前置条件**: 已注册两个不同用户
- **输入**:
  - 用户 A（phone: `13800138001`）登录
  - 用户 B（phone: `13800138002`）登录
- **执行步骤**:
  1. 分别登录两个用户
  2. 解码两个 Token 的 payload
- **预期输出**:
  - 两个 Token 的 `userId` 不同，各自对应用户的 `_id`
  - 两个 Token 的 `role` 均为 `"user"`
- **清理**: 无

### TC-003: Token 使用 JWT_SECRET 环境变量签名
- **类型**: 功能测试
- **关联验收标准**: JWT_SECRET 通过环境变量配置，不硬编码
- **前置条件**: 环境变量 `JWT_SECRET=test-secret-key`
- **输入**: 登录获取的 Token
- **执行步骤**:
  1. 使用 `test-secret-key` 验证 Token → 成功
  2. 使用 `wrong-secret` 验证 Token → 失败（JsonWebTokenError）
  3. 检查源码中不存在硬编码的密钥字符串
- **预期输出**:
  - 正确密钥验证通过，错误密钥验证失败
  - 代码中无硬编码密钥（除 `config/index.ts` 的 fallback 默认值 `"dev-secret"`，仅开发环境使用）
- **清理**: 无

### TC-004: JWT_SECRET 未配置时使用默认值并记录警告
- **类型**: 异常测试
- **关联验收标准**: JWT_SECRET 通过环境变量配置
- **前置条件**: 删除/清空 `JWT_SECRET` 环境变量
- **输入**: 登录请求
- **执行步骤**:
  1. 清空 `JWT_SECRET` 环境变量
  2. 启动服务，发送登录请求
  3. 检查服务端日志
- **预期输出**:
  - 登录仍然成功（使用 fallback 默认值）
  - 服务端打印警告日志（如 `[WARN] JWT_SECRET not set, using default — this is insecure in production`）
- **清理**: 恢复 `JWT_SECRET` 环境变量

---

## 二、认证中间件 authMiddleware（SUB-2.2.2）

### TC-005: 有效 Token 通过认证
- **类型**: 功能测试
- **关联验收标准**: authMiddleware — 从 Authorization Header 提取 Token、验证、挂载 `req.user`
- **前置条件**: 
  - 已注册用户并获取有效 Token
  - 有一个受 `authMiddleware` 保护的测试路由 `GET /api/v1/me`
- **输入**:
  - Header: `Authorization: Bearer <valid_token>`
- **执行步骤**:
  1. 向受保护路由发送请求
  2. 在路由 handler 中检查 `req.user`
- **预期输出**:
  - HTTP 状态码：200（路由正常响应）
  - `req.user` 包含 `userId`（ObjectId）、`role` 字段
  - `req.user.userId` 等于登录用户的 `_id`
- **清理**: 无

### TC-006: 无 Authorization Header 返回 401
- **类型**: 异常测试
- **关联验收标准**: authMiddleware — 无 Token → 401
- **前置条件**: 受 `authMiddleware` 保护的路由
- **输入**: 不带 Authorization Header 的请求
- **执行步骤**:
  1. 直接请求受保护路由，不带任何认证头
- **预期输出**:
  - HTTP 状态码：401
  - 响应体: `{ "error": { "code": "UNAUTHORIZED", "message": "未提供认证令牌" } }`（或类似明确信息）
- **清理**: 无

### TC-007: Bearer 前缀错误返回 401
- **类型**: 异常测试
- **关联验收标准**: authMiddleware — 无效 Token → 401
- **前置条件**: 有效 Token 和受保护路由
- **输入**:
  - Header: `Authorization: Basic <valid_token>`（错误前缀）
  - Header: `Authorization: <valid_token>`（无前缀）
- **执行步骤**:
  1. 分别用两种错误格式请求
- **预期输出**:
  - 两次请求均返回 401
  - 错误信息指明 Authorization Header 格式应为 `Bearer <token>`
- **清理**: 无

### TC-008: 无效签名 Token 返回 401
- **类型**: 异常测试
- **关联验收标准**: Token 无效时返回 401 含明确错误信息
- **前置条件**: 受保护路由
- **输入**: 用不同密钥签发的 Token（如 `wrong-secret` 签发），格式正确但签名无效
- **执行步骤**:
  1. 用错误密钥签发一个 Token
  2. 向受保护路由发送请求
- **预期输出**:
  - HTTP 状态码：401
  - 错误信息明确指示 Token 无效（如 "令牌无效或签名错误"）
- **清理**: 无

### TC-009: 过期 Token 返回 401
- **类型**: 异常测试
- **关联验收标准**: Token 过期时返回 401 含明确错误信息
- **前置条件**: 
  - 受保护路由
  - 签发一个过期 Token（如设置 `expiresIn: "0s"` 或直接构造过期 payload）
- **输入**: 已过期的 Token
- **执行步骤**:
  1. 使用过期 Token 请求受保护路由
- **预期输出**:
  - HTTP 状态码：401
  - 错误信息明确指示 Token 已过期（如 "令牌已过期"）
  - 区分"过期"和"无效"的错误信息
- **清理**: 无

### TC-010: 篡改 payload 的 Token 返回 401
- **类型**: 异常测试
- **关联验收标准**: 无效 Token → 401
- **前置条件**: 有效 Token、受保护路由
- **输入**: 保留有效签名段但篡改 payload（手动拼接三段式）
- **执行步骤**:
  1. 解码有效 Token，修改 payload（如把 role 改为 admin），与原始签名拼接
  2. 向受保护路由发送请求
- **预期输出**:
  - HTTP 状态码：401
  - 错误信息指示 Token 无效
- **清理**: 无

### TC-011: 空 Token（Bearer 后无内容）返回 401
- **类型**: 边界测试
- **关联验收标准**: 无 Token → 401
- **前置条件**: 受保护路由
- **输入**: 
  - Header: `Authorization: Bearer `（Bearer 后无 Token）
  - Header: `Authorization: Bearer`（无空格无 Token）
- **执行步骤**:
  1. 分别发送两种请求
- **预期输出**:
  - 均返回 401
- **清理**: 无

---

## 三、可选认证中间件 optionalAuth（SUB-2.2.2）

### TC-012: 无 Token 时放行，req.user 为 null
- **类型**: 功能测试
- **关联验收标准**: optionalAuth — Token 不存在则继续
- **前置条件**: 受 `optionalAuth` 保护的测试路由
- **输入**: 不带 Authorization Header 的请求
- **执行步骤**:
  1. 请求可选认证路由，不带 Token
- **预期输出**:
  - HTTP 状态码：200（正常响应）
  - `req.user` 为 `null` 或 `undefined`
- **清理**: 无

### TC-013: 有效 Token 时解析并挂载 req.user
- **类型**: 功能测试
- **关联验收标准**: 有效 Token → 解析 payload 挂载到 `req.user`
- **前置条件**: 已登录用户的有效 Token、可选认证路由
- **输入**: 有效 Token
- **执行步骤**:
  1. 请求可选认证路由，带有效 Token
- **预期输出**:
  - HTTP 状态码：200
  - `req.user` 包含 `userId` 和 `role`
- **清理**: 无

### TC-014: 无效 Token 时放行，req.user 为 null
- **类型**: 功能测试
- **关联验收标准**: Token 无效时继续（不阻断请求），但不挂载用户信息
- **前置条件**: 可选认证路由
- **输入**: 无效签名的 Token
- **执行步骤**:
  1. 请求可选认证路由，带无效 Token
- **预期输出**:
  - HTTP 状态码：200
  - `req.user` 为 `null`（静默失败，不抛错）
- **清理**: 无

### TC-015: 过期 Token 时放行，req.user 为 null
- **类型**: 功能测试
- **关联验收标准**: Token 过期不阻断请求
- **前置条件**: 可选认证路由
- **输入**: 过期 Token
- **执行步骤**:
  1. 请求可选认证路由，带过期 Token
- **预期输出**:
  - HTTP 状态码：200
  - `req.user` 为 `null`
- **清理**: 无

---

## 四、管理员权限中间件 adminMiddleware（SUB-2.2.3）

### TC-016: 管理员用户通过权限检查
- **类型**: 功能测试
- **关联验收标准**: `req.user.role === 'admin'` → 放行
- **前置条件**: 
  - 数据库中有一个 `role: "admin"` 的用户
  - 该用户登录获取 Token
  - 路由链: `authMiddleware` → `adminMiddleware` → handler
- **输入**: 管理员 Token
- **执行步骤**:
  1. 管理员登录
  2. 请求需管理员权限的路由
- **预期输出**:
  - HTTP 状态码：200
  - 路由正常响应
- **清理**: 无

### TC-017: 普通用户被拒绝（403）
- **类型**: 功能测试
- **关联验收标准**: `req.user.role !== 'admin'` → 403 Forbidden
- **前置条件**: 
  - 普通用户（role: "user"）已登录
  - 受 `authMiddleware` + `adminMiddleware` 保护的路由
- **输入**: 普通用户 Token
- **执行步骤**:
  1. 普通用户登录
  2. 请求需管理员权限的路由
- **预期输出**:
  - HTTP 状态码：403
  - 响应体包含明确错误信息（如 "权限不足，需要管理员权限"）
- **清理**: 无

### TC-018: 未认证用户请求管理员路由返回 401（非 403）
- **类型**: 集成测试
- **关联验收标准**: authMiddleware 先于 adminMiddleware 执行
- **前置条件**: 受 `authMiddleware` + `adminMiddleware` 保护的路由
- **输入**: 不带 Token 的请求
- **执行步骤**:
  1. 不带 Token 请求管理员路由
- **预期输出**:
  - HTTP 状态码：401（由 authMiddleware 拦截，而非 403）
  - 说明中间件执行顺序正确
- **清理**: 无

---

## 五、密码加密（bcrypt 确认）

### TC-019: 数据库中存储的是 bcrypt hash 而非明文
- **类型**: 功能测试
- **关联验收标准**: 密码加密使用 bcrypt + salt
- **前置条件**: 已注册用户
- **输入**: 无（直接查询数据库）
- **执行步骤**:
  1. 注册一个用户（password: `Test1234`）
  2. 在 MongoDB 中查询该用户的 `passwordHash`
- **预期输出**:
  - `passwordHash` 以 `$2b$` 或 `$2a$` 开头（bcrypt hash 标识）
  - `passwordHash` 不等于 `"Test1234"`（非明文存储）
  - 每次注册相同密码，产生的 hash 不同（salt 随机）
- **清理**: 无

### TC-020: 密码验证正确区分大小写
- **类型**: 边界测试
- **关联验收标准**: bcrypt compare 正确验证
- **前置条件**: 已注册用户（password: `Test1234`）
- **输入**: 
  - 正确密码: `Test1234`
  - 错误密码: `test1234`（大小写不同）
- **执行步骤**:
  1. 用 `Test1234` 登录 → 应成功
  2. 用 `test1234` 登录 → 应失败
- **预期输出**:
  - 正确密码返回 200 + Token
  - 错误密码返回 401 "手机号或密码错误"
- **清理**: 无

---

## 六、端到端集成测试

### TC-021: 注册 → 登录 → 使用 Token 访问受保护路由（完整流程）
- **类型**: 集成测试
- **关联验收标准**: 全链路验证
- **前置条件**: 无（新用户）
- **输入**:
  - 注册: `{ "phone": "13900139000", "password": "Hello123" }`
- **执行步骤**:
  1. POST `/api/v1/auth/register` 注册
  2. POST `/api/v1/auth/login` 登录，获取 Token
  3. GET `/api/v1/me` 带 Token 获取当前用户信息
- **预期输出**:
  - 注册返回 201，含用户信息（不含 passwordHash）
  - 登录返回 200，含 Token
  - `/me` 返回 200，含当前登录用户信息
- **清理**: 无

### TC-022: Token 过期后需重新登录
- **类型**: 集成测试
- **关联验收标准**: Token 有效期 7 天，过期后不可用
- **前置条件**: 已注册用户
- **输入**: 模拟过期 Token（签发时设置 `expiresIn: "0s"`）
- **执行步骤**:
  1. 签发即时过期的 Token
  2. 立即用该 Token 请求受保护路由
  3. 重新登录获取新 Token
  4. 用新 Token 请求
- **预期输出**:
  - 过期 Token → 401
  - 重新登录 → 200 + 新 Token
  - 新 Token → 200（正常访问）
- **清理**: 无

---

## 测试用例统计

| 类型 | 数量 |
|------|------|
| 功能测试 | 12 |
| 边界测试 | 2 |
| 异常测试 | 5 |
| 集成测试 | 3 |
| **合计** | **22** |

| 子任务 | 覆盖用例 |
|--------|----------|
| SUB-2.2.1 JWT Token 签发 | TC-001 ~ TC-004 |
| SUB-2.2.2 认证中间件 | TC-005 ~ TC-015 |
| SUB-2.2.3 管理员权限中间件 | TC-016 ~ TC-018 |
| 密码加密确认 | TC-019 ~ TC-020 |
| 端到端集成 | TC-021 ~ TC-022 |
