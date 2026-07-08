# 测试用例 — Task 4.2: SSE 流式响应支持

> 关联 Task: [task.md](./task.md) | 生成日期: 2026-07-08

---

## 测试范围概述

| 维度 | 用例数 | 覆盖内容 |
|------|--------|---------|
| 功能测试 | 5 | SSE 端点正常流程、事件类型、认证鉴权 |
| Streaming 测试 | 3 | Provider streaming 输出、增量内容、事件顺序 |
| Fallback 测试 | 2 | 非 streaming Provider 降级、同构返回 |
| 异常测试 | 5 | 输入校验、LLM 错误、连接中断、超时 |
| 边界测试 | 3 | 长单词名、大响应体、并发连接 |

**总计: 18 个测试用例**

---

## 功能测试

### TC-001: SSE 端点正常接收请求并推送事件流
- **类型**: 功能测试
- **关联验收标准**: SSE 端点正确设置 response headers（Content-Type: text/event-stream）
- **前置条件**: 
  - 管理员已登录，持有有效 JWT Token
  - DeepSeek API Key 已配置
  - 目标词库 `64a1b2c3d4e5f6a7b8c9d0e1` 已存在
- **输入**:
  - 请求: `POST /api/v1/words/generate/stream`
  - Header: `Authorization: Bearer <admin_token>`
  - Body: `{ "wordName": "grasp", "wordbankId": "64a1b2c3d4e5f6a7b8c9d0e1" }`
- **执行步骤**:
  1. 使用 EventSource 兼容客户端（如 fetch + ReadableStream）发起 POST 请求
  2. 逐行读取 SSE 事件流
  3. 等待 `done` 事件后连接关闭
- **预期输出**:
  - HTTP 状态码: `200`
  - Response Header: `Content-Type: text/event-stream`
  - Response Header: `Cache-Control: no-cache`
  - Response Header: `Connection: keep-alive`
  - 事件流包含至少一个 `thinking` 事件
  - 事件流包含至少一个 `content` 事件
  - 最终事件为 `done`，data 中包含完整词条 JSON
- **清理**: 删除生成的单词记录

### TC-002: SSE 事件类型完整性 — 包含所有四种事件
- **类型**: 功能测试
- **关联验收标准**: 事件类型按规范输出（thinking / content / done / error）
- **前置条件**: 同 TC-001
- **输入**: 同 TC-001
- **执行步骤**:
  1. 发起 SSE 请求
  2. 记录每个事件的 `event:` 字段值
  3. 统计事件类型分布
- **预期输出**:
  - 至少出现一次 `event: thinking`
  - 至少出现一次 `event: content`
  - 最后一个事件为 `event: done`
  - `done` 事件的 `data` 字段包含:
    - `word`: "grasp"
    - `coreMeaning`: 非空字符串
    - `physicalImageType`: 枚举值之一
    - `extendedMeanings`: 长度 ≥ 1 的数组
    - `collocations`: 长度 ≥ 1 的数组
  - 流结束后连接正常关闭
- **清理**: 删除生成的单词记录

### TC-003: 未认证用户访问 SSE 端点返回 401
- **类型**: 功能测试
- **关联验收标准**: 认证中间件生效
- **前置条件**: 无（不登录）
- **输入**:
  - 请求: `POST /api/v1/words/generate/stream`
  - Header: 无 Authorization
  - Body: `{ "wordName": "test", "wordbankId": "64a1b2c3d4e5f6a7b8c9d0e1" }`
- **执行步骤**:
  1. 直接发起请求，不携带 Token
- **预期输出**:
  - HTTP 状态码: `401`
  - 响应体包含错误码 `UNAUTHORIZED`
  - **非** SSE 流（普通 JSON 错误响应）
- **清理**: 无

### TC-004: 非管理员用户访问 SSE 端点返回 403
- **类型**: 功能测试
- **关联验收标准**: 管理员权限中间件生效
- **前置条件**: 
  - 存在普通用户 `user`（role ≠ admin），已获取其 Token
- **输入**:
  - Header: `Authorization: Bearer <user_token>`
  - Body: `{ "wordName": "test", "wordbankId": "64a1b2c3d4e5f6a7b8c9d0e1" }`
- **执行步骤**:
  1. 使用普通用户 Token 发起请求
- **预期输出**:
  - HTTP 状态码: `403`
  - 响应体包含错误码 `FORBIDDEN`
- **清理**: 无

### TC-005: SSE 事件数据格式符合 SSE 规范
- **类型**: 功能测试
- **关联验收标准**: 事件类型按规范输出
- **前置条件**: 同 TC-001
- **输入**: 同 TC-001
- **执行步骤**:
  1. 发起 SSE 请求
  2. 逐行解析原始 SSE 文本
  3. 验证每条事件格式
- **预期输出**:
  - 每个事件以 `event:` 行开始
  - 每个事件以 `data:` 行携带 JSON payload
  - `data:` 行内容为合法 JSON 字符串
  - 事件之间以空行 `\n\n` 分隔
  - 每行以 `\n`（LF）结尾
  - 无多余空行或格式错误
- **清理**: 删除生成的单词记录

---

## Streaming 测试

### TC-006: Streaming Provider 产生多个 content 事件（增量输出）
- **类型**: Streaming 测试
- **关联验收标准**: LLM Provider 层支持 streaming 模式
- **前置条件**: 
  - DeepSeek API 支持 streaming（`stream: true`）
  - 同 TC-001
- **输入**: 同 TC-001
- **执行步骤**:
  1. 发起 SSE 请求
  2. 计数所有 `content` 事件
  3. 记录每个 `content` 事件的 data 内容
- **预期输出**:
  - `content` 事件数量 ≥ 2（流式输出应分多块到达）
  - 每个 `content` 事件的 `data.chunk` 为非空字符串
  - 多个 chunk 按序拼接后可组成完整的 LLM 输出文本
  - `done` 事件在最后一个 `content` 事件之后到达
- **清理**: 删除生成的单词记录

### TC-007: thinking 事件在 content 事件之前触发
- **类型**: Streaming 测试
- **关联验收标准**: 事件类型定义 — thinking 表示 LLM 思考中
- **前置条件**: 同 TC-001
- **输入**: 同 TC-001
- **执行步骤**:
  1. 发起 SSE 请求
  2. 记录第一个事件类型
  3. 记录第二个事件类型
- **预期输出**:
  - 第一个事件为 `event: thinking`
  - `thinking` 的 `data` 包含 `{ "status": "generating" }` 或类似状态信息
  - 后续事件为 `content` 或 `done`（不会先出现 `content` 再出现 `thinking`）
- **清理**: 删除生成的单词记录

### TC-008: 大单词（复杂词）的流式输出不丢数据
- **类型**: Streaming 测试
- **关联验收标准**: 连接中断和超时处理
- **前置条件**: 同 TC-001
- **输入**: 
  - Body: `{ "wordName": "comprehensive", "wordbankId": "64a1b2c3d4e5f6a7b8c9d0e1" }`
- **执行步骤**:
  1. 发起 SSE 请求（复杂词汇通常产生更长的 LLM 输出）
  2. 收集所有 `content` 事件的 chunk
  3. 收集 `done` 事件中的完整词条
  4. 验证数据完整性
- **预期输出**:
  - 所有 chunk 拼接后的文本长度 > 500 字符
  - `done` 事件中的 `coreMeaning`、`extendedMeanings` 等字段完整
  - 无截断、无乱码
  - 所有 chunk 顺序正确
- **清理**: 删除生成的单词记录

---

## Fallback 测试

### TC-009: 非 Streaming Provider 降级为一次性返回
- **类型**: Fallback 测试
- **关联验收标准**: 对不支持 streaming 的 Provider，降级为非流式并一次性返回结果
- **前置条件**: 
  - 创建一个 `FakeNonStreamingProvider` 实现 `LLMProvider`，但 `supportsStreaming` 为 `false`
  - 或通过环境变量/配置强制使用非流式模式
- **输入**: 同 TC-001
- **执行步骤**:
  1. 配置使用不支持 streaming 的 Provider
  2. 发起 SSE 请求
  3. 收集所有事件
- **预期输出**:
  - HTTP 状态码: `200`
  - 事件流不包含 `thinking` 或 `content` 事件
  - 仅包含一个 `done` 事件
  - `done` 事件的 `data` 包含完整词条（与非流式接口 `/words/generate` 返回字段一致）
  - 无 `error` 事件
- **清理**: 恢复原 Provider 配置

### TC-010: 降级返回数据与非流式接口数据结构一致
- **类型**: Fallback 测试
- **关联验收标准**: 降级后返回完整结果
- **前置条件**: 同 TC-009
- **输入**: 同 TC-009
- **执行步骤**:
  1. 对同一单词，分别调用 `/words/generate`（非流式）和 `/words/generate/stream`（降级流式）
  2. 对比两者的核心字段
- **预期输出**:
  - `/words/generate/stream` 的 `done` 事件 data 包含:
    - `word` 字段
    - `coreMeaning` 字段
    - `physicalImageType` 字段
    - `physicalImageDescription` 字段
    - `extendedMeanings` 数组（每项含 meaning, partOfSpeech, exampleEn 等）
    - `collocations` 数组
  - 字段结构与 `/words/generate` 返回体一致（允许内容因 LLM 随机性不同）
- **清理**: 删除生成的两条单词记录

---

## 异常测试

### TC-011: 无效 wordName → error 事件
- **类型**: 异常测试
- **关联验收标准**: error 事件 — 生成失败时推送错误信息
- **前置条件**: 同 TC-001
- **输入**:
  - Body: `{ "wordName": "", "wordbankId": "64a1b2c3d4e5f6a7b8c9d0e1" }`
- **执行步骤**:
  1. 发起 SSE 请求（空单词名）
  2. 读取事件流
- **预期输出**:
  - 出现 `event: error`
  - `error` 事件的 `data` 包含:
    - `code`: `"VALIDATION_ERROR"`
    - `message`: 描述性错误信息
  - 连接在 error 事件后关闭
  - 无 `done` 事件
- **清理**: 无

### TC-012: 无效 wordbankId → error 事件
- **类型**: 异常测试
- **关联验收标准**: error 事件
- **前置条件**: 同 TC-001
- **输入**:
  - Body: `{ "wordName": "test", "wordbankId": "invalid-id" }`
- **执行步骤**:
  1. 发起 SSE 请求（非法 wordbankId 格式）
  2. 读取事件流
- **预期输出**:
  - 出现 `event: error`
  - `error` 事件的 `data.code` 为 `"VALIDATION_ERROR"`
- **清理**: 无

### TC-013: LLM API 故障 → error 事件
- **类型**: 异常测试
- **关联验收标准**: error 事件 — LLM 服务不可用时优雅降级
- **前置条件**: 
  - 设置 `DEEPSEEK_API_KEY` 为无效值以触发 API 认证错误
- **输入**: 同 TC-001
- **执行步骤**:
  1. 使用无效 API Key 发起 SSE 请求
  2. 读取事件流
- **预期输出**:
  - 出现 `event: error`
  - `error` 事件的 `data.code` 为 `"LLM_SERVICE_ERROR"`
  - `error` 事件的 `data.message` 为人类可读的中文错误信息
  - 连接正常关闭
- **清理**: 恢复有效 API Key

### TC-014: 客户端主动断开连接，服务端正确清理
- **类型**: 异常测试
- **关联验收标准**: 连接中断处理
- **前置条件**: 同 TC-001
- **输入**: 同 TC-001
- **执行步骤**:
  1. 发起 SSE 请求
  2. 在收到第一个 `content` 事件后，立即在客户端调用 `reader.cancel()` 或关闭连接
  3. 检查服务端日志/状态
- **预期输出**:
  - 服务端不崩溃
  - 服务端检测到 `req.on('close')` 事件，停止向该连接写入
  - 底层 LLM 请求的 AbortController 被触发（abort）
  - 服务端日志记录 "client disconnected" 或类似信息
- **清理**: 无

### TC-015: LLM 响应超时 → error 事件
- **类型**: 异常测试
- **关联验收标准**: 超时处理
- **前置条件**: 
  - 将 Provider 的超时阈值临时调低（如 100ms）以触发超时
- **输入**: 同 TC-001
- **执行步骤**:
  1. 使用极短超时配置发起 SSE 请求
  2. 读取事件流
- **预期输出**:
  - 出现 `event: error`
  - `error` 事件的 `data.code` 为 `"LLM_TIMEOUT"`
  - 连接在 error 后关闭
  - 流中没有 `done` 事件
- **清理**: 恢复正常超时配置

---

## 边界测试

### TC-016: 极长单词名（接近100字符上限）
- **类型**: 边界测试
- **关联验收标准**: SSE 端点正常处理边界输入
- **前置条件**: 同 TC-001
- **输入**:
  - Body: `{ "wordName": "pneumonoultramicroscopicsilicovolcanoconiosis", "wordbankId": "64a1b2c3d4e5f6a7b8c9d0e1" }`（45字符的医学词汇）
- **执行步骤**:
  1. 发起 SSE 请求
  2. 收集所有事件直到 done 或 error
- **预期输出**:
  - 不因单词名过长而崩溃
  - 如 LLM 无法识别：返回 `error` 事件（`LLM_PARSE_ERROR` 或 `LLM_SERVICE_ERROR`）
  - 如 LLM 成功处理：正常返回 `thinking → content* → done` 事件流
  - 任一情况下，连接正常关闭，无服务端崩溃
- **清理**: 如果生成了单词记录则删除

### TC-017: 并发 SSE 连接 — 多个管理员同时生成不同单词
- **类型**: 边界测试
- **关联验收标准**: SSE 端点稳定性
- **前置条件**: 
  - 管理员已登录
  - 词库中存在多个待生成单词
- **输入**:
  - 同时发起 3 个 SSE 请求，分别生成 "run", "break", "light"
- **执行步骤**:
  1. 使用 `Promise.all` 同时发起 3 个 SSE 请求
  2. 每个请求独立收集事件流
  3. 检查每个流是否独立完成
- **预期输出**:
  - 所有 3 个连接独立建立，互不干扰
  - 每个连接各自收到完整的事件序列（thinking → content* → done）
  - 每个连接的 `done` 事件 data.word 与请求的 wordName 一致
  - 服务端不崩溃，无内存泄漏
  - 3 个连接的 `done` 事件数据不混淆
- **清理**: 删除 3 条生成的单词记录

### TC-018: LLM 返回超大响应体时的流式处理
- **类型**: 边界测试
- **关联验收标准**: SSE 端点稳定性
- **前置条件**: 同 TC-001
- **输入**:
  - 选择可能生成大量引申义的单词（如 "run"、"set" 等多义词）
  - Body: `{ "wordName": "set", "wordbankId": "64a1b2c3d4e5f6a7b8c9d0e1" }`
- **执行步骤**:
  1. 发起 SSE 请求
  2. 收集所有 content 事件
  3. 等待 done 事件并检查数据完整性
- **预期输出**:
  - 大量 chunk 按序到达（content 事件 > 5 个）
  - `done` 事件 data 中的 JSON 完整可解析
  - 没有因响应体过大导致截断或 OOM
  - 所有 extendedMeanings 条目完整
- **清理**: 删除生成的单词记录

---

## 测试数据准备

执行测试前需要准备以下数据：

| 数据 | 说明 |
|------|------|
| 管理员账号 | role=admin 的测试用户，用于获取 JWT Token |
| 普通用户账号 | role=user 的测试用户 |
| 目标词库 | 一个有效的 wordbank 文档，其 `_id` 用作 `wordbankId` |
| 有效 API Key | DeepSeek API Key（集成测试需要） |
| 无效 API Key | 用于测试 LLM 错误场景 |

## 环境依赖

| 依赖 | 说明 |
|------|------|
| MongoDB | 测试数据库实例 |
| DeepSeek API | 可达的 API 端点（或 Mock Server） |
| Node.js | 服务端运行环境 |

## 自动化建议

- TC-001 ~ TC-010（功能/流式/降级）建议写为自动化集成测试
- TC-011 ~ TC-015（异常）建议自动化（可通过 Mock LLM Provider 实现）
- TC-016 ~ TC-018（边界）中 TC-017（并发）建议自动化，其余可手动验证
- Provider 层建议使用 **依赖注入** 或 **工厂方法** 以便在测试中替换 Mock Provider
