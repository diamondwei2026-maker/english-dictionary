# Task 2.3: 前端认证集成

| 属性 | 值 |
|------|-----|
| ID | 2.3 |
| 状态 | pending |
| 优先级 | P0 |
| 依赖 | Task 2.2 |
| 阶段 | 阶段2: 用户认证 |
| 预估工时 | 2-3 小时 |

## 描述

将前端现有的 mock 登录逻辑替换为真实的后端 API 调用。包括：创建 API 请求模块、Token 存储与自动携带、登录状态管理、路由守卫。尽可能小改动，复用现有 UI 组件。

## 验收标准

- [ ] 前端 API 基础模块创建（`src/api/` 或 `src/services/`），封装请求方法
- [ ] 登录/注册页面改为调用真实 API（`POST /api/auth/login`、`POST /api/auth/register`）
- [ ] Token 存储在 localStorage，每次请求通过 Authorization Header 自动携带
- [ ] 登录状态管理：登录成功 → 存储 Token + 用户信息 → 跳转首页
- [ ] 401 响应自动清除 Token 并跳转登录页
- [ ] 开发环境配置 API 代理（Taro devServer.proxy），解决跨域问题
- [ ] 微信小程序兼容：API 请求适配 Taro.request

## 子任务

### SUB-2.3.1: 创建 API 请求模块
- **描述**: 封装 Taro.request 或 fetch，统一处理 Token、错误、loading
- **验收标准**:
  - [ ] 请求自动携带 Authorization Header
  - [ ] 401/403 错误统一处理
  - [ ] 支持 H5 和微信小程序双端

### SUB-2.3.2: 替换登录/注册逻辑
- **描述**: 修改登录和注册页面，调用真实 API
- **验收标准**:
  - [ ] 登录页：表单提交 → API 调用 → 成功跳转 / 失败提示
  - [ ] 注册页：表单提交 → API 调用 → 成功跳转登录页
  - [ ] 加载状态和错误提示友好

### SUB-2.3.3: 登录状态管理
- **描述**: 全局用户状态管理，Token 持久化
- **验收标准**:
  - [ ] 刷新页面后 Token 仍有效（localStorage）
  - [ ] 用户信息在全局状态中可访问
  - [ ] 退出登录清除 Token 和用户信息

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
