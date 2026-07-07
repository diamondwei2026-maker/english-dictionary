# Task 2.2: JWT 认证中间件与密码加密

| 属性 | 值 |
|------|-----|
| ID | 2.2 |
| 状态 | pending |
| 优先级 | P0 |
| 依赖 | Task 2.1 |
| 阶段 | 阶段2: 用户认证 |
| 预估工时 | 2-3 小时 |

## 描述

完善认证体系：Task 2.1 的登录接口改为签发真实 JWT Token；创建 JWT 认证中间件用于保护需要登录的 API；区分普通用户和管理员（role=admin）的权限控制。

## 验收标准

- [ ] 登录接口签发 JWT Token（含 user_id、role，有效期 7 天）
- [ ] JWT 认证中间件 `authMiddleware` — 从 Authorization Header 提取 Token、验证、挂载 `req.user`
- [ ] 可选认证中间件 `optionalAuth` — Token 存在则解析，不存在则继续（用于公开接口但需要识别用户时）
- [ ] 管理员权限中间件 `adminMiddleware` — 校验 `req.user.role === 'admin'`
- [ ] JWT_SECRET 通过环境变量配置，不硬编码
- [ ] Token 过期或无效时返回 401 含明确错误信息
- [ ] 密码加密使用 bcrypt + salt（已在 Task 2.1 实现，本 Task 确认配置正确）

## 子任务

### SUB-2.2.1: JWT Token 签发
- **描述**: 在登录接口中签发真实 JWT，配置密钥和过期时间
- **验收标准**:
  - [ ] 使用 jsonwebtoken 库签发 Token
  - [ ] payload 包含 user_id、role
  - [ ] Token 有效期 7 天
  - [ ] JWT_SECRET 从环境变量读取

### SUB-2.2.2: 认证中间件
- **描述**: 编写 authMiddleware 和 optionalAuth 中间件
- **验收标准**:
  - [ ] `authMiddleware`：无 Token / 无效 Token / 过期 Token → 401
  - [ ] `optionalAuth`：无 Token → `req.user = null` 继续执行
  - [ ] 有效 Token → 解析 payload 挂载到 `req.user`

### SUB-2.2.3: 管理员权限中间件
- **描述**: 编写 adminMiddleware，校验用户角色
- **验收标准**:
  - [ ] `req.user.role !== 'admin'` → 403 Forbidden
  - [ ] `req.user.role === 'admin'` → 放行

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
