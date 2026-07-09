# 测试用例 — Task 6.3: API 文档与安全配置

## 测试范围说明

| 维度 | 覆盖内容 |
|------|----------|
| 功能测试 | API 文档页面可访问、端点完整、Schema 标注、CORS/Helmet/Rate Limit 生效 |
| 边界测试 | Rate Limit 阈值边界、CORS 非白名单域名 |
| 异常测试 | 文档路径错误、环境变量缺失、异常高频请求 |
| 集成测试 | Swagger UI 正确渲染、安全头全局覆盖 |

---

## SUB-6.3.1: Swagger/OpenAPI 文档

### TC-001: API 文档页面可访问
- **类型**: 功能测试
- **关联验收标准**: `/api/docs` 可访问 API 文档页面
- **前置条件**: 服务正常运行
- **输入**:
  - 请求方式：GET
  - 请求路径：`/api/docs`
- **执行步骤**:
  1. 在浏览器中访问 `http://localhost:3001/api/docs`
  2. 观察页面渲染
- **预期输出**:
  - HTTP 状态码：200
  - Content-Type：`text/html`
  - 页面展示 Swagger UI 或 Scalar 交互式文档界面
- **清理**: 无

### TC-002: 所有 API 端点均在文档中列出
- **类型**: 功能测试
- **关联验收标准**: 所有 API 端点（auth、wordbanks、words、AI、user）均在文档中列出
- **前置条件**: 服务正常运行，API 文档已生成
- **输入**:
  - 请求方式：GET
  - 请求路径：`/api/docs`（或 OpenAPI JSON 端点如 `/api/docs/json`）
- **执行步骤**:
  1. 访问 API 文档页面
  2. 检查文档中列出的端点分组
- **预期输出**:
  - 文档中应包含以下分组的路由：
    - **Auth**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
    - **Users**: `GET /api/v1/users/me`, `GET /api/v1/users/stats`, `GET /api/v1/users/favorites`, `GET /api/v1/users/learning-records`
    - **Wordbanks**: `GET /api/v1/wordbanks`, `GET /api/v1/wordbanks/{id}`, `GET /api/v1/wordbanks/{id}/words`, `POST /api/v1/wordbanks`, `PUT /api/v1/wordbanks/{id}`, `DELETE /api/v1/wordbanks/{id}`
    - **Words**: `GET /api/v1/words`, `GET /api/v1/words/{id}`, `POST /api/v1/words`, `PUT /api/v1/words/{id}`, `DELETE /api/v1/words/{id}`, `POST /api/v1/words/{id}/learn`, `POST /api/v1/words/{id}/favorite`, `DELETE /api/v1/words/{id}/favorite`
    - **AI**: `POST /api/v1/words/generate`, `POST /api/v1/words/generate/stream`
    - **Daily Word**: `GET /api/v1/daily-word`, `POST /api/v1/daily-word/pin`
    - **Dashboard**: `GET /api/v1/admin/dashboard`
    - **Health**: `GET /api/v1/health`
- **清理**: 无

### TC-003: 每个端点标注请求/响应 Schema
- **类型**: 功能测试
- **关联验收标准**: 每个端点标注请求/响应 Schema、认证要求
- **前置条件**: 服务正常运行，API 文档已生成
- **输入**:
  - 请求方式：GET
  - 请求路径：`/api/docs`
- **执行步骤**:
  1. 访问 API 文档页面
  2. 展开 `POST /api/v1/auth/register` 端点
  3. 展开 `POST /api/v1/wordbanks` 端点
  4. 展开 `GET /api/v1/words` 端点
- **预期输出**:
  - `POST /api/v1/auth/register`：
    - Request Body Schema 包含 `username`、`email`、`password` 字段及类型
    - Response Schema 包含 `token`、`user` 对象
  - `POST /api/v1/wordbanks`：
    - 标注 🔒 认证要求（需 Bearer Token + Admin 角色）
    - Request Body Schema 包含 `name`、`description`、`isPublic` 等字段
  - `GET /api/v1/words`：
    - Query Parameters Schema（如有分页/搜索参数）
    - Response Schema 包含 `data` 数组、`pagination` 对象
- **清理**: 无

### TC-004: 认证端点标注清晰
- **类型**: 功能测试
- **关联验收标准**: 每个端点标注认证要求
- **前置条件**: 服务正常运行，API 文档已生成
- **输入**:
  - 请求方式：GET
  - 请求路径：`/api/docs`
- **执行步骤**:
  1. 检查公开端点（如 `GET /api/v1/wordbanks`）是否标注为公开或可选认证
  2. 检查需登录端点（如 `GET /api/v1/users/me`）是否标注需要 Bearer Token
  3. 检查管理员端点（如 `POST /api/v1/wordbanks`）是否标注需要 Admin 权限
- **预期输出**:
  - 公开端点标注 "无需认证" 或 "可选认证"
  - 需登录端点标注 🔒 图标或 "Requires Authentication"
  - 管理员端点额外标注 "Admin only"
- **清理**: 无

---

## SUB-6.3.2: 安全策略配置

### TC-005: CORS 开发环境允许本地前端
- **类型**: 功能测试
- **关联验收标准**: CORS 配置：生产环境仅允许指定域名
- **前置条件**: `NODE_ENV=development`，服务正常运行
- **输入**:
  - 请求方式：OPTIONS（预检请求）
  - 请求路径：`/api/v1/health`
  - 请求头：`Origin: http://localhost:10086`
- **执行步骤**:
  1. 发送 OPTIONS 预检请求，带 `Origin: http://localhost:10086`
  2. 检查响应头
- **预期输出**:
  - HTTP 状态码：204
  - `Access-Control-Allow-Origin`: `http://localhost:10086`
  - `Access-Control-Allow-Credentials`: `true`
- **清理**: 无

### TC-006: CORS 生产环境拒绝非白名单域名
- **类型**: 功能测试
- **关联验收标准**: CORS 配置：生产环境仅允许指定域名
- **前置条件**: `NODE_ENV=production`，服务正常运行
- **输入**:
  - 请求方式：OPTIONS（预检请求）
  - 请求路径：`/api/v1/health`
  - 请求头：`Origin: https://evil.example.com`
- **执行步骤**:
  1. 以 `NODE_ENV=production` 启动服务
  2. 发送 OPTIONS 预检请求，带 `Origin: https://evil.example.com`
  3. 检查响应头
- **预期输出**:
  - 响应头中**不包含** `Access-Control-Allow-Origin: https://evil.example.com`
  - 或 `Access-Control-Allow-Origin` 值为白名单域名（非请求域名），浏览器端 CORS 校验失败
- **清理**: 恢复 `NODE_ENV` 为开发环境

### TC-007: CORS 生产环境允许白名单域名
- **类型**: 功能测试
- **关联验收标准**: CORS 配置：生产环境仅允许指定域名
- **前置条件**: `NODE_ENV=production`，服务正常运行
- **输入**:
  - 请求方式：OPTIONS（预检请求）
  - 请求路径：`/api/v1/health`
  - 请求头：`Origin: https://english-dictionary.vercel.app`
- **执行步骤**:
  1. 以 `NODE_ENV=production` 启动服务
  2. 发送 OPTIONS 预检请求，带白名单域名
  3. 检查响应头
- **预期输出**:
  - HTTP 状态码：204
  - `Access-Control-Allow-Origin`: `https://english-dictionary.vercel.app`
- **清理**: 恢复 `NODE_ENV` 为开发环境

### TC-008: 登录接口 Rate Limit 生效
- **类型**: 功能测试
- **关联验收标准**: Rate Limit：登录接口限制（如 10 次/分钟/IP）
- **前置条件**: 服务正常运行，Rate Limit 已配置
- **输入**:
  - 请求方式：POST
  - 请求路径：`/api/v1/auth/login`
  - 请求体：`{ "email": "test@example.com", "password": "wrong" }`
- **执行步骤**:
  1. 在同一 IP 下，1 分钟内连续发送 11 次登录请求
  2. 观察第 11 次请求的响应
- **预期输出**:
  - 前 10 次请求正常返回 401（密码错误）或 200
  - 第 11 次请求返回 HTTP 状态码 429 Too Many Requests
  - 响应体包含限流提示信息（如 `{ "error": { "code": "RATE_LIMIT", "message": "请求过于频繁，请稍后再试" } }`）
  - 响应头包含 `Retry-After` 或 `X-RateLimit-*` 信息
- **清理**: 等待 1 分钟使限流计数器重置

### TC-009: AI 生成接口 Rate Limit 生效
- **类型**: 功能测试
- **关联验收标准**: AI 生成接口限制（如 5 次/分钟/用户）
- **前置条件**: 服务正常运行，已登录管理员账号
- **输入**:
  - 请求方式：POST
  - 请求路径：`/api/v1/words/generate`
  - 请求头：`Authorization: Bearer <admin_token>`
  - 请求体：`{ "word": "serendipity" }`
- **执行步骤**:
  1. 使用管理员 Token，1 分钟内连续发送 6 次 AI 生成请求
  2. 观察第 6 次请求的响应
- **预期输出**:
  - 前 5 次请求正常返回 200 或处理中
  - 第 6 次请求返回 HTTP 状态码 429 Too Many Requests
  - 限流基于用户 ID（而非 IP），同一用户超限被拒
- **清理**: 等待 1 分钟使限流计数器重置

### TC-010: Rate Limit 区分不同用户
- **类型**: 功能测试
- **关联验收标准**: AI 生成接口限制（如 5 次/分钟/用户）
- **前置条件**: 两个不同的管理员账号均已注册
- **输入**:
  - 用户 A Token + 用户 B Token
- **执行步骤**:
  1. 用户 A 发送 5 次 AI 生成请求（达到限额）
  2. 用户 A 发送第 6 次请求 → 预期 429
  3. 用户 B 发送第 1 次 AI 生成请求
- **预期输出**:
  - 用户 A 第 6 次请求：429
  - 用户 B 第 1 次请求：正常返回（不受用户 A 限额影响）
- **清理**: 等待 1 分钟使限流计数器重置

### TC-011: 安全头（Helmet）正确设置
- **类型**: 功能测试
- **关联验收标准**: 安全头配置（Helmet 或手动设置）
- **前置条件**: 服务正常运行，安全头中间件已集成
- **输入**:
  - 请求方式：GET
  - 请求路径：`/api/v1/health`
- **执行步骤**:
  1. 发送 GET 请求到任意端点
  2. 检查响应头
- **预期输出**:
  - `X-Content-Type-Options`: `nosniff`
  - `X-Frame-Options`: `DENY` 或 `SAMEORIGIN`
  - `X-XSS-Protection`: `0`（Helmet 默认禁用旧版浏览器 XSS 过滤器）
  - `Strict-Transport-Security`: `max-age=...`（生产环境应有 HSTS 头）
  - `Content-Security-Policy`: 存在且合理（不阻止 Swagger UI 渲染）
  - `X-DNS-Prefetch-Control`: `off`
  - 响应头中**不包含** `X-Powered-By: Express`
- **清理**: 无

### TC-012: Swagger UI 不被安全头阻止
- **类型**: 集成测试
- **关联验收标准**: API 文档自动生成可访问 + 安全头配置
- **前置条件**: 服务正常运行，Swagger UI 与 Helmet 均已配置
- **输入**:
  - 请求方式：GET（通过浏览器）
  - 请求路径：`/api/docs`
- **执行步骤**:
  1. 在浏览器中访问 `/api/docs`
  2. 检查 Swagger UI 是否正常渲染（CSS/JS/字体加载无 CSP 错误）
  3. 尝试在 Swagger UI 中发送 "Try it out" 请求
- **预期输出**:
  - Swagger UI 页面正常渲染，无样式丢失
  - "Try it out" 功能可正常发送请求并显示响应
  - 浏览器控制台无 CSP 相关报错
- **清理**: 无

---

## SUB-6.3.3: 环境变量与安全检查

### TC-013: `.env.example` 完整
- **类型**: 功能测试
- **关联验收标准**: `.env.example` 完整（列出所有需要的环境变量及说明）
- **前置条件**: 项目根目录
- **输入**: 无
- **执行步骤**:
  1. 检查项目根目录 `.env.example` 文件内容
  2. 对比 `server/src/app.ts` 和配置文件中用到的所有环境变量
  3. 逐一核实是否在 `.env.example` 中列出
- **预期输出**:
  - 以下变量必须在 `.env.example` 中列出并有中文注释说明：
    - `PORT` — 服务端口
    - `NODE_ENV` — 运行环境
    - `MONGODB_URI` — 数据库连接
    - `DB_MAX_POOL_SIZE` — 连接池大小（可选）
    - `DB_IDLE_TIMEOUT_MS` — 空闲超时（可选）
    - `DB_CONNECT_TIMEOUT_MS` — 连接超时（可选）
    - `JWT_SECRET` — JWT 签名密钥
    - `JWT_EXPIRES_IN` — Access Token 有效期
    - `JWT_REFRESH_EXPIRES_IN` — Refresh Token 有效期
    - `DEEPSEEK_API_KEY` — AI API 密钥
    - `DEEPSEEK_BASE_URL` — AI API 地址
    - `CACHE_ENABLED` — 缓存开关
    - `CACHE_TTL_*` — 各类缓存 TTL

### TC-014: `.env` 文件已在 `.gitignore` 中排除
- **类型**: 功能测试
- **关联验收标准**: `.env` 不提交到 Git
- **前置条件**: 仓库根目录和 `server/` 目录
- **输入**: 无
- **执行步骤**:
  1. 检查根目录 `.gitignore` 是否包含 `.env`
  2. 检查 `server/.gitignore` 是否包含 `.env`
  3. 执行 `git ls-files` 确认无 `.env` 被追踪
- **预期输出**:
  - 根目录 `.gitignore` 包含 `.env` 条目
  - `server/.gitignore` 包含 `.env` 条目
  - `git ls-files` 输出中无 `.env` 文件（不含 `.env.example`）
- **清理**: 无

### TC-015: `dist/` 构建产物未提交到 Git
- **类型**: 功能测试
- **关联验收标准**: `.gitignore` 包含 `dist/` 等
- **前置条件**: 仓库根目录
- **输入**: 无
- **执行步骤**:
  1. 检查 `.gitignore` 是否包含 `dist/`
  2. 执行 `git ls-files -- '*/dist/*'` 确认无构建产物被追踪
- **预期输出**:
  - `.gitignore` 包含 `dist/` 条目
  - 无 `dist/` 目录下文件被 Git 追踪
- **清理**: 无

### TC-016: 代码中无硬编码密钥
- **类型**: 功能测试
- **关联验收标准**: 敏感信息检查：无硬编码密钥
- **前置条件**: 项目源代码
- **输入**: 无
- **执行步骤**:
  1. 在 `server/src/` 目录中搜索硬编码的密钥/密码/Token
  2. 搜索模式包括：`JWT_SECRET`、`API_KEY`、`password`、`secret` 赋值
  3. 确认所有敏感值来自 `process.env.*`
- **预期输出**:
  - 所有密钥、密码、Token 均通过 `process.env.*` 读取，无硬编码在源码中
  - 无类似 `const JWT_SECRET = "my-secret"` 的硬编码
- **清理**: 无

### TC-017: `.env.example` 中有安全提示
- **类型**: 功能测试
- **关联验收标准**: `.env.example` 完整（列出所有需要的环境变量及说明）
- **前置条件**: 项目根目录 `.env.example`
- **输入**: 无
- **执行步骤**:
  1. 检查 `.env.example` 文件
- **预期输出**:
  - `JWT_SECRET` 的默认值不应是可用于生产的真实密钥（如 `change-me-in-production`）
  - 文件顶部有 "复制为 .env 后修改" 的说明
  - 敏感变量旁有 ⚠️ 警告提示
- **清理**: 无

### TC-018: 异常请求路径返回标准错误
- **类型**: 异常测试
- **关联验收标准**: 安全头配置 + API 文档覆盖
- **前置条件**: 服务正常运行
- **输入**:
  - 请求方式：GET
  - 请求路径：`/api/v1/nonexistent`
- **执行步骤**:
  1. 向未定义路径发送请求
- **预期输出**:
  - HTTP 状态码：404
  - 响应体包含结构化错误：`{ "error": { "code": "NOT_FOUND", "message": "..." } }`
  - 安全头仍然存在
  - 不泄露堆栈信息或服务器内部细节
- **清理**: 无

### TC-019: 生产环境不应暴露调试信息
- **类型**: 异常测试
- **关联验收标准**: 安全头配置 + 敏感信息检查
- **前置条件**: `NODE_ENV=production`
- **输入**:
  - 请求方式：POST
  - 请求路径：`/api/v1/auth/login`
  - 请求体：格式错误的 JSON（如 `{ invalid`）
- **执行步骤**:
  1. 发送格式错误的请求
  2. 检查错误响应
- **预期输出**:
  - HTTP 状态码：400 或 500
  - 响应体仅包含通用错误信息
  - 不暴露文件路径、堆栈追踪、数据库连接信息等内部细节
- **清理**: 恢复 `NODE_ENV` 为开发环境

### TC-020: API 文档端点不应受 Rate Limit 限制
- **类型**: 边界测试
- **关联验收标准**: Rate Limit 仅对关键接口生效
- **前置条件**: 服务正常运行，Rate Limit 已配置
- **输入**:
  - 请求方式：GET
  - 请求路径：`/api/docs`
- **执行步骤**:
  1. 短时间内连续请求 `/api/docs` 20 次
- **预期输出**:
  - 所有 20 次请求均返回 200
  - 不触发 Rate Limit（429）
- **清理**: 无

---

## 测试用例汇总

| 编号 | 名称 | 类型 | 关联子任务 |
|------|------|------|------------|
| TC-001 | API 文档页面可访问 | 功能测试 | SUB-6.3.1 |
| TC-002 | 所有 API 端点均在文档中列出 | 功能测试 | SUB-6.3.1 |
| TC-003 | 每个端点标注请求/响应 Schema | 功能测试 | SUB-6.3.1 |
| TC-004 | 认证端点标注清晰 | 功能测试 | SUB-6.3.1 |
| TC-005 | CORS 开发环境允许本地前端 | 功能测试 | SUB-6.3.2 |
| TC-006 | CORS 生产环境拒绝非白名单域名 | 功能测试 | SUB-6.3.2 |
| TC-007 | CORS 生产环境允许白名单域名 | 功能测试 | SUB-6.3.2 |
| TC-008 | 登录接口 Rate Limit 生效 | 功能测试 | SUB-6.3.2 |
| TC-009 | AI 生成接口 Rate Limit 生效 | 功能测试 | SUB-6.3.2 |
| TC-010 | Rate Limit 区分不同用户 | 功能测试 | SUB-6.3.2 |
| TC-011 | 安全头（Helmet）正确设置 | 功能测试 | SUB-6.3.2 |
| TC-012 | Swagger UI 不被安全头阻止 | 集成测试 | SUB-6.3.1 + SUB-6.3.2 |
| TC-013 | `.env.example` 完整 | 功能测试 | SUB-6.3.3 |
| TC-014 | `.env` 文件已在 `.gitignore` 中排除 | 功能测试 | SUB-6.3.3 |
| TC-015 | `dist/` 构建产物未提交到 Git | 功能测试 | SUB-6.3.3 |
| TC-016 | 代码中无硬编码密钥 | 功能测试 | SUB-6.3.3 |
| TC-017 | `.env.example` 中有安全提示 | 功能测试 | SUB-6.3.3 |
| TC-018 | 异常请求路径返回标准错误 | 异常测试 | SUB-6.3.2 |
| TC-019 | 生产环境不应暴露调试信息 | 异常测试 | SUB-6.3.2 + SUB-6.3.3 |
| TC-020 | API 文档端点不受 Rate Limit 限制 | 边界测试 | SUB-6.3.2 |

**总计**: 20 个测试用例
- 功能测试：15 个
- 集成测试：1 个
- 异常测试：2 个
- 边界测试：2 个
