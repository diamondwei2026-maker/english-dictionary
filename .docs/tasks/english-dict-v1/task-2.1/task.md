# Task 2.1: 用户注册与登录 API

| 属性 | 值 |
|------|-----|
| ID | 2.1 |
| 状态 | done |
| 优先级 | P0 |
| 依赖 | Task 1.3 |
| 阶段 | 阶段2: 用户认证 |
| 预估工时 | 3-4 小时 |

## 描述

实现用户认证相关的 API 端点：手机号注册和手机号+密码登录。注册需要校验手机号格式、检查重复、密码强度验证；登录成功后返回用户信息。

本 Task 先实现核心业务逻辑（controller + service 层），JWT Token 签发和认证中间件在 Task 2.2 中完成。

## 验收标准

- [ ] `POST /api/auth/register` — 接收 phone、password、nickname，创建用户并返回用户信息（不含密码）
- [ ] `POST /api/auth/login` — 接收 phone、password，验证后返回用户信息（此时可先返回占位 token，正式 JWT 在 2.2 完成）
- [ ] 手机号格式校验（11 位中国大陆手机号）
- [ ] 手机号唯一性检查（重复注册返回明确错误）
- [ ] 密码强度验证（至少 6 位，含字母和数字）
- [ ] 密码使用 bcrypt 加密存储
- [ ] 输入验证和错误处理（缺少字段、格式错误 → 400）
- [ ] API 路由注册到 Express/Fastify 应用

## 子任务

### SUB-2.1.1: 实现注册接口
- **描述**: 编写 controller + service 实现用户注册逻辑
- **验收标准**:
  - [ ] 接收 phone、password、nickname（nickname 可选，默认用手机号脱敏）
  - [ ] 手机号格式校验通过正则
  - [ ] 重复手机号返回 409 Conflict
  - [ ] 密码 bcrypt hash 后存储
  - [ ] 成功返回 201，包含 id、phone、nickname、created_at

### SUB-2.1.2: 实现登录接口
- **描述**: 编写 controller + service 实现用户登录逻辑
- **验收标准**:
  - [ ] 接收 phone、password
  - [ ] 手机号不存在返回 401（不区分"用户不存在"和"密码错误"，防撞库）
  - [ ] bcrypt.compare 验证密码
  - [ ] 成功返回 200，包含 id、phone、nickname、token（占位或 JWT）

### SUB-2.1.3: 输入验证与错误处理
- **描述**: 使用验证库（如 zod / joi / class-validator）统一处理输入验证
- **验收标准**:
  - [ ] 通用验证中间件或工具函数
  - [ ] 验证失败返回 400 含具体错误信息
  - [ ] 全局错误处理中间件兜底

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
