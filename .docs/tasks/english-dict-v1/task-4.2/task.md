# Task 4.2: SSE 流式响应支持

| 属性 | 值 |
|------|-----|
| ID | 4.2 |
| 状态 | pending |
| 优先级 | P2 |
| 依赖 | Task 4.1 |
| 阶段 | 阶段4: AI 词条生成 |
| 预估工时 | 2-3 小时 |

## 描述

为 AI 词条生成接口增加 Server-Sent Events (SSE) 流式响应支持。当 LLM 支持 streaming 时，通过 SSE 将生成进度实时推送给前端，改善用户体验（当前端等待 AI 生成时看到逐字输出而非长时间 loading）。

## 验收标准

- [ ] `POST /api/words/generate/stream` — SSE 端点，实时推送 AI 生成进度
- [ ] SSE 事件类型定义：`thinking`（LLM 思考中）、`content`（生成内容片段）、`done`（完成，含完整结果）、`error`（生成失败）
- [ ] 前端可连接 SSE 端点并实时展示生成进度
- [ ] LLM Provider 层支持 streaming 模式（对支持 streaming 的 Provider）
- [ ] 对不支持 streaming 的 Provider，降级为非流式并一次性返回结果
- [ ] 连接中断和超时处理

## 子任务

### SUB-4.2.1: 后端 SSE 端点实现
- **描述**: 在 Express/Fastify 中实现 SSE 端点
- **验收标准**:
  - [ ] SSE 端点正确设置 response headers（Content-Type: text/event-stream）
  - [ ] 事件类型按规范输出
  - [ ] 生成完成或出错时正确关闭连接

### SUB-4.2.2: LLM Streaming 适配
- **描述**: 在 Provider 层增加 streaming 支持
- **验收标准**:
  - [ ] 支持 streaming 的 Provider 以 chunk 方式输出
  - [ ] 不支持 streaming 的 Provider 一次性返回（降级）

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
