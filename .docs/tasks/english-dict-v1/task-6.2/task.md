# Task 6.2: Docker 容器化与部署配置

| 属性 | 值 |
|------|-----|
| ID | 6.2 |
| 状态 | pending |
| 优先级 | P2 |
| 依赖 | Task 6.1 |
| 阶段 | 阶段6: 优化与上线 |
| 预估工时 | 2-3 小时 |

## 描述

为后端服务编写 Dockerfile 和 docker-compose.yml，实现容器化部署。配置生产环境的启动脚本和环境变量管理。编写 CI/CD 配置（GitHub Actions 或类似），实现自动测试和部署。

## 验收标准

- [ ] `server/Dockerfile` — 多阶段构建，生产镜像精简
- [ ] `docker-compose.yml` — 编排 app + 数据库 + 可选 Redis
- [ ] `.env.example` 或 `.env.production` 模板文件
- [ ] `docker-compose up` 一键启动完整环境
- [ ] 健康检查端点 `GET /api/health` 返回服务状态
- [ ] CI/CD 配置：代码推送 → 自动测试 → 构建镜像 → 部署（或至少前两步）
- [ ] 部署文档（简要说明部署步骤）

## 子任务

### SUB-6.2.1: Docker 配置
- **描述**: 编写 Dockerfile 和 docker-compose.yml
- **验收标准**:
  - [ ] 多阶段构建，开发阶段含 devDependencies
  - [ ] 生产镜像仅含编译产物和生产依赖
  - [ ] docker-compose 编排 app + DB

### SUB-6.2.2: 部署与 CI/CD
- **描述**: 编写部署脚本和 CI 配置
- **验收标准**:
  - [ ] 健康检查端点可用
  - [ ] CI 流程（lint + test + build）可运行
  - [ ] 简要部署文档

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
