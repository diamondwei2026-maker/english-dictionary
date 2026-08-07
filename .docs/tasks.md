# 短句翻译训练模块后端 — 开发任务列表

| 属性 | 值 |
|------|-----|
| 版本 | v1.0 |
| 创建日期 | 2026-08-06 |
| 需求标识 | training-backend |
| 关联计划 | [开发计划](./development-plan.md) |
| 总任务数 | 6 |

---

## 任务总览

| Task ID | 名称 | 阶段 | 状态 | 优先级 | 依赖 | 详情 |
|---------|------|------|------|--------|------|------|
| 0.1 | 创建 QuizQuestion / QuizAttempt 数据模型 | 阶段0: 数据模型+种子 | ✅ done | P0 | 无 | [task.md](./tasks/training-backend/task-0.1/task.md) |
| 0.2 | 种子数据：迁移 20 条 mock 题目入库 | 阶段0: 数据模型+种子 | ✅ done | P0 | 0.1 | [task.md](./tasks/training-backend/task-0.2/task.md) |
| 1.1 | 实现 Quiz 核心服务与判分引擎 | 阶段1: Quiz API | ✅ done | P0 | 0.2 | [task.md](./tasks/training-backend/task-1.1/task.md) |
| 1.2 | 实现 Quiz API 路由、控制器与校验 | 阶段1: Quiz API | ✅ done | P0 | 1.1 | [task.md](./tasks/training-backend/task-1.2/task.md) |
| 2.1 | 前端 Quiz API 集成 | 阶段2: 前端集成 | ✅ done | P0 | 1.2 | [task.md](./tasks/training-backend/task-2.1/task.md) |
| 3.1 | 英译中方向扩展 | 阶段3: 英译中 (后续) | ⏳ pending | P1 | 2.1 | [task.md](./tasks/training-backend/task-3.1/task.md) |

---

## 依赖关系图

```
Task 0.1 ──► Task 0.2 ──► Task 1.1 ──► Task 1.2 ──► Task 2.1 ──► Task 3.1
```

## 阶段集成验收清单 🔴

> 每个阶段的集成验收清单供 ai-master 的阶段集成 Gate（步骤 5.7）使用。
> 清单中的每条链路必须用 curl/浏览器操作真实验证。

### 阶段 0 集成验收

| 验收项 | 验证方式 | 涉及 Task | 通过标准 |
|--------|---------|-----------|---------|
| 数据模型可读写 | MongoDB Compass / Mongoose 查询 | 0.1, 0.2 | QuizQuestion / QuizAttempt 集合可查询到数据 |
| 种子数据完整 | 运行 seed 脚本 | 0.2 | 20 条题目全量入库，zh2en 方向 20 条可查 |

### 阶段 1 集成验收

| 验收项 | 验证方式 | 涉及 Task | 通过标准 |
|--------|---------|-----------|---------|
| 匿名获取题目 | `curl GET /api/v1/quiz/questions?direction=zh2en` | 1.1, 1.2 | 返回 10 道题目，包含 prompt/hint/reference/keywords |
| 提交判分 | `curl POST /api/v1/quiz/submit` | 1.1, 1.2 | 返回 score/correct/matched/missing/analysis |
| 已登录用户查历史 | `curl GET /api/v1/quiz/history` (带 JWT) | 1.1, 1.2 | 返回已答题目列表，含分页 |
| 已登录用户查统计 | `curl GET /api/v1/quiz/stats` (带 JWT) | 1.1, 1.2 | 返回 totalQuestions/correctRate/recentTrend |
| 单词专项练习题目 | `curl GET /api/v1/quiz/questions?direction=zh2en&wordId=xxx` | 1.1, 1.2 | 返回围绕该单词的题目 |
| 输入校验 | direction=invalid → 400; userInput="" → 400 | 1.2 | 返回对应错误码和 message |

### 阶段 2 集成验收

| 验收项 | 验证方式 | 涉及 Task | 通过标准 |
|--------|---------|-----------|---------|
| 完整答题流程 | 训练首页 → 点击中译英 → 服务端返回题目 → 逐题作答 → 服务端判分 → 完成页 | 2.1 | 10 题全部通过 API 获取和判分，完成页显示正确率 |
| 已登录答题记录保存 | 登录后答题 → 离开页面 → 重新进入 → 历史可查 | 2.1 | 答题记录在服务端持久化，跨页面不丢失 |
| 未登录可训练 | 清除 Token → 进入训练页 → 答题 → 判分正常 | 2.1 | 未登录用户体验与本地 mock 模式一致 |
| 网络异常降级 | 断网或 API 不可用 → 答题 | 2.1 | 前端提示错误信息，不白屏、不崩溃 |

### 阶段 3 集成验收

| 验收项 | 验证方式 | 涉及 Task | 通过标准 |
|--------|---------|-----------|---------|
| 英译中入口可用 | 训练首页 → 点击「短句英译中」 | 3.1 | 不再显示 "Coming Soon"，可进入答题页 |
| 英译中判分 | 提交英文翻译的中文 → 判分反馈 | 3.1 | 判分逻辑正确执行（bigram 重合度），返回 score/analysis |

---

## 执行顺序建议

1. Task 0.1 — 创建数据模型（无依赖，可立即开始）
2. Task 0.2 — 种子数据迁移（依赖 Task 0.1）
3. Task 1.1 — Quiz 核心服务（依赖 Task 0.2）
4. Task 1.2 — Quiz API 路由（依赖 Task 1.1）
5. Task 2.1 — 前端 API 集成（依赖 Task 1.2）
6. Task 3.1 — 英译中扩展（依赖 Task 2.1，P1 可选）
