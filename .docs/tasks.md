# 英语母语者词典 — 开发任务列表

| 属性 | 值 |
|------|-----|
| 版本 | v1.0 |
| 创建日期 | 2026-07-07 |
| 需求标识 | english-dict-v1 |
| 关联计划 | [开发计划](./development-plan.md) |
| 总任务数 | 18 |

---

## 任务总览

| Task ID | 名称 | 阶段 | 状态 | 优先级 | 依赖 | 详情 |
|---------|------|------|------|--------|------|------|
| 0.1 | 后端项目脚手架初始化 | 阶段0: 架构决策与项目初始化 | ✅ done | P0 | 无 | [task.md](./tasks/english-dict-v1/task-0.1/task.md) |
| 0.2 | 数据库 Schema 设计 | 阶段0: 架构决策与项目初始化 | ✅ done | P0 | 0.1 | [task.md](./tasks/english-dict-v1/task-0.2/task.md) |
| 1.1 | 数据库表创建与 Migration | 阶段1: 数据层 | ✅ done | P0 | 0.2 | [task.md](./tasks/english-dict-v1/task-1.1/task.md) |
| 1.2 | ORM 模型定义 | 阶段1: 数据层 | ✅ done | P0 | 1.1 | [task.md](./tasks/english-dict-v1/task-1.2/task.md) |
| 1.3 | Seed 数据脚本与连接池配置 | 阶段1: 数据层 | ✅ done | P0 | 1.2 | [task.md](./tasks/english-dict-v1/task-1.3/task.md) |
| 2.1 | 用户注册与登录 API | 阶段2: 用户认证 | ✅ done | P0 | 1.3 | [task.md](./tasks/english-dict-v1/task-2.1/task.md) |
| 2.2 | JWT 认证中间件与密码加密 | 阶段2: 用户认证 | ✅ done | P0 | 2.1 | [task.md](./tasks/english-dict-v1/task-2.2/task.md) |
| 2.3 | 前端认证集成 | 阶段2: 用户认证 | ⏳ pending | P0 | 2.2 | [task.md](./tasks/english-dict-v1/task-2.3/task.md) |
| 3.1 | 词库 CRUD API | 阶段3: 词库与单词 CRUD | ⏳ pending | P0 | 2.2 | [task.md](./tasks/english-dict-v1/task-3.1/task.md) |
| 3.2 | 单词 CRUD API 与管理后台权限 | 阶段3: 词库与单词 CRUD | ⏳ pending | P0 | 3.1 | [task.md](./tasks/english-dict-v1/task-3.2/task.md) |
| 3.3 | 前端数据层集成 | 阶段3: 词库与单词 CRUD | ⏳ pending | P0 | 3.2 | [task.md](./tasks/english-dict-v1/task-3.3/task.md) |
| 4.1 | AI 词条生成 API 与 LLM Provider | 阶段4: AI 词条生成 | ⏳ pending | P1 | 3.2 | [task.md](./tasks/english-dict-v1/task-4.1/task.md) |
| 4.2 | SSE 流式响应支持 | 阶段4: AI 词条生成 | ⏳ pending | P2 | 4.1 | [task.md](./tasks/english-dict-v1/task-4.2/task.md) |
| 4.3 | 前端 AI 功能集成 | 阶段4: AI 词条生成 | ⏳ pending | P1 | 4.1 | [task.md](./tasks/english-dict-v1/task-4.3/task.md) |
| 5.1 | 学习记录与收藏功能 | 阶段5: 增强功能 | ⏳ pending | P1 | 3.3 | [task.md](./tasks/english-dict-v1/task-5.1/task.md) |
| 5.2 | 今日一词推荐与管理后台概览 | 阶段5: 增强功能 | ⏳ pending | P1 | 5.1 | [task.md](./tasks/english-dict-v1/task-5.2/task.md) |
| 6.1 | 缓存与搜索优化 | 阶段6: 优化与上线 | ⏳ pending | P2 | 5.2 | [task.md](./tasks/english-dict-v1/task-6.1/task.md) |
| 6.2 | Docker 容器化与部署配置 | 阶段6: 优化与上线 | ⏳ pending | P2 | 6.1 | [task.md](./tasks/english-dict-v1/task-6.2/task.md) |
| 6.3 | API 文档与安全配置 | 阶段6: 优化与上线 | ⏳ pending | P2 | 6.2 | [task.md](./tasks/english-dict-v1/task-6.3/task.md) |

---

## 依赖关系图

```
Task 0.1 ──► Task 0.2 ──► Task 1.1 ──► Task 1.2 ──► Task 1.3
                                                         │
                                                         ▼
                                                    Task 2.1 ──► Task 2.2 ──► Task 2.3
                                                                      │
                                                                      ▼
                                                                 Task 3.1 ──► Task 3.2 ──► Task 3.3
                                                                                    │
                                                                     ┌──────────────┼──────────────┐
                                                                     ▼              ▼              ▼
                                                                Task 4.1      Task 5.1      Task 4.3
                                                                     │              │
                                                                     ▼              ▼
                                                                Task 4.2      Task 5.2
                                                                                    │
                                                                                    ▼
                                                                               Task 6.1 ──► Task 6.2 ──► Task 6.3
```

## 执行顺序建议

1. **Task 0.1** — 后端项目脚手架初始化（无依赖，可立即开始）
2. **Task 0.2** — 数据库 Schema 设计（依赖 Task 0.1）
3. **Task 1.1** — 数据库表创建与 Migration（依赖 Task 0.2）
4. **Task 1.2** — ORM 模型定义（依赖 Task 1.1）
5. **Task 1.3** — Seed 数据脚本与连接池配置（依赖 Task 1.2）
6. **Task 2.1** — 用户注册与登录 API（依赖 Task 1.3）
7. **Task 2.2** — JWT 认证中间件与密码加密（依赖 Task 2.1）
8. **Task 2.3** — 前端认证集成（依赖 Task 2.2）
9. **Task 3.1** — 词库 CRUD API（依赖 Task 2.2）
10. **Task 3.2** — 单词 CRUD API 与管理后台权限（依赖 Task 3.1）
11. **Task 3.3** — 前端数据层集成（依赖 Task 3.2）
12. **Task 4.1** — AI 词条生成 API 与 LLM Provider（依赖 Task 3.2，与 3.3 可并行）
13. **Task 4.3** — 前端 AI 功能集成（依赖 Task 4.1）
14. **Task 4.2** — SSE 流式响应支持（依赖 Task 4.1，可选）
15. **Task 5.1** — 学习记录与收藏功能（依赖 Task 3.3）
16. **Task 5.2** — 今日一词推荐与管理后台概览（依赖 Task 5.1）
17. **Task 6.1** — 缓存与搜索优化（依赖 Task 5.2）
18. **Task 6.2** — Docker 容器化与部署配置（依赖 Task 6.1）
19. **Task 6.3** — API 文档与安全配置（依赖 Task 6.2）
