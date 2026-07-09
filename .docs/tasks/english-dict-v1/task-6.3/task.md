# Task 6.3: API 文档与安全配置

| 属性 | 值 |
|------|-----|
| ID | 6.3 |
| 状态 | done |
| 优先级 | P2 |
| 依赖 | Task 6.2 |
| 阶段 | 阶段6: 优化与上线 |
| 预估工时 | 2-3 小时 |

## 描述

为后端 API 生成 OpenAPI/Swagger 文档，方便前端开发和后续维护。配置生产环境安全策略：HTTPS、CORS 白名单、Rate Limit、Helmet 安全头等。

## 验收标准

- [ ] API 文档自动生成（Swagger UI 或 Scalar），可访问 `/api/docs`
- [ ] 所有 API 端点（auth、wordbanks、words、AI、user）均在文档中列出
- [ ] 每个端点标注请求/响应 Schema、认证要求
- [ ] CORS 配置：生产环境仅允许指定域名
- [ ] Rate Limit：登录接口限制（如 10 次/分钟/IP），AI 生成接口限制（如 5 次/分钟/用户）
- [ ] 安全头配置（Helmet 或手动设置）
- [ ] 敏感信息检查：无硬编码密钥、`.env` 不提交到 Git
- [ ] `.env.example` 完整（列出所有需要的环境变量及说明）

## 子任务

### SUB-6.3.1: Swagger/OpenAPI 文档
- **描述**: 集成 Swagger 或等效工具，生成 API 文档
- **验收标准**:
  - [ ] `/api/docs` 可访问 API 文档页面
  - [ ] 所有端点有文档说明
  - [ ] 请求/响应 Schema 完整

### SUB-6.3.2: 安全策略配置
- **描述**: 配置 CORS、Rate Limit、安全头
- **验收标准**:
  - [ ] CORS 白名单按环境区分
  - [ ] 关键接口 Rate Limit 生效
  - [ ] 安全头正确设置

### SUB-6.3.3: 环境变量与安全检查
- **描述**: 整理所有环境变量，做安全检查
- **验收标准**:
  - [ ] `.env.example` 完整
  - [ ] Git 历史中无敏感信息
  - [ ] `.gitignore` 包含 `.env`、`dist/` 等

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
