# 测试用例 — Task 4.1: AI 词条生成 API 与 LLM Provider

> 生成日期：2026-07-08 | 共 16 个用例

---

## 一、功能测试（正向路径）

### TC-F01: 成功调用 LLM 生成完整词条
- **类型**: 功能测试
- **关联验收标准**: `POST /api/words/generate` — 接收 wordName，调用 LLM 生成词条内容并存储
- **前置条件**:
  - 管理员已登录，持有有效 JWT
  - 环境变量 `DEEPSEEK_API_KEY` 已正确配置
  - 测试词库 `test-wordbank` 已存在且 `_id` 已知
- **输入**:
  - 请求体：`{ "wordName": "grasp", "wordbankId": "<wordbank_id>" }`
  - Header：`Authorization: Bearer <admin_token>`
- **执行步骤**:
  1. 向 `POST /api/words/generate` 发送上述请求
  2. 等待 LLM 返回（预期 3~15 秒）
  3. 检查响应体和 HTTP 状态码
  4. 查询数据库确认单词文档已创建
- **预期输出**:
  - HTTP 状态码：`201`
  - 响应体包含：
    - `word: "grasp"`
    - `wordbankId: "<wordbank_id>"`
    - `coreMeaning` 不为空
    - `physicalImageType` 属于 `PHYSICAL_IMAGE_TYPES` 枚举值之一
    - `physicalImageDescription` 不为空
    - `extendedMeanings` 数组长度 ≥ 3，每项含 `evolutionDescription`、`meaning`、`partOfSpeech`、`exampleEn`、`exampleZh`
    - `collocations` 数组非空
- **清理**: 删除测试生成的单词文档

### TC-F02: 同一单词不重复生成（幂等性检查）
- **类型**: 功能测试
- **关联验收标准**: 同一单词不重复生成（检查单词是否已有完整词条内容）
- **前置条件**:
  - 单词 `"grasp"` 在测试词库中已存在且包含完整词条内容（coreMeaning、physicalImageDescription、extendedMeanings 均非空）
- **输入**:
  - 请求体：`{ "wordName": "grasp", "wordbankId": "<wordbank_id>" }`
- **执行步骤**:
  1. 向 `POST /api/words/generate` 发送请求
  2. 检查响应
- **预期输出**:
  - HTTP 状态码：`409`
  - 响应体 `code: "ALREADY_EXISTS"`，`message` 提示该单词已有完整词条
- **清理**: 无

### TC-F03: `force=true` 强制重新生成覆盖已有词条
- **类型**: 功能测试
- **关联验收标准**: 支持强制重新生成（`?force=true` 参数）
- **前置条件**:
  - 单词 `"grasp"` 在测试词库中已存在且包含完整词条内容
- **输入**:
  - 请求体：`{ "wordName": "grasp", "wordbankId": "<wordbank_id>" }`
  - Query：`?force=true`
- **执行步骤**:
  1. 记录该单词当前的 `updatedAt` 时间戳
  2. 向 `POST /api/words/generate?force=true` 发送请求
  3. 等待 LLM 返回
  4. 检查数据库
- **预期输出**:
  - HTTP 状态码：`200`
  - 数据库中该单词的 `updatedAt` 已更新（大于原时间戳）
  - 词条内容已被新生成的内容覆盖
- **清理**: 删除测试生成的单词文档

### TC-F04: LLM Provider 接口抽象 — 切换 Provider 行为一致
- **类型**: 功能测试
- **关联验收标准**: LLM Provider 接口抽象：定义统一的 `generateWordEntry(wordName)` 接口
- **前置条件**:
  - 系统已实现至少一个 LLM Provider（DeepSeek）
  - Provider 工厂函数可通过配置选择不同 Provider
- **输入**:
  - 分别配置两个 Provider（真实 DeepSeek + Mock Provider），调用 `generateWordEntry("test")`
- **执行步骤**:
  1. 用 Mock Provider 调用 `generateWordEntry("test")`，验证返回结构
  2. 用真实 DeepSeek Provider 调用 `generateWordEntry("test")`，验证返回结构
  3. 对比两者返回的 JSON 结构是否一致
- **预期输出**:
  - 两个 Provider 返回的数据结构完全一致（字段名、类型匹配 IPromptResult 接口）
  - Mock Provider 返回固定测试数据，便于单元测试
- **清理**: 无

### TC-F05: AI 生成结果结构化解析（JSON → 数据库字段）
- **类型**: 功能测试
- **关联验收标准**: AI 生成结果结构化解析（LLM 返回 JSON，解析后存入数据库各字段）
- **前置条件**:
  - Mock Provider 返回预定义 JSON
- **输入**:
  - Mock JSON：
    ```json
    {
      "physical_image": "GRASP",
      "physical_image_description": "The act of seizing or gripping firmly with the hand.",
      "core_meaning": "To understand or comprehend something fully.",
      "core_example_en": "She quickly grasped the concept.",
      "core_example_zh": "她很快理解了这个概念。",
      "extended_meanings": [
        {
          "evolution_description": "从物理抓握引申为心智上的抓住",
          "meaning": "理解、领会",
          "part_of_speech": "verb",
          "example_en": "I can't grasp why he did that.",
          "example_zh": "我无法理解他为什么那样做。"
        }
      ],
      "collocations": ["grasp the meaning", "grasp an opportunity"]
    }
    ```
- **执行步骤**:
  1. 调用解析函数将 JSON 映射到 IWord 字段
  2. 检查映射结果
- **预期输出**:
  - `physicalImageType` → `"grasp"`（小写）
  - `physicalImageDescription` → Mock 中的对应值
  - `coreMeaning` → Mock 中的 `core_meaning`
  - `coreExampleEn` / `coreExampleZh` → Mock 中的对应值
  - `extendedMeanings[0].evolutionDescription` → Mock 中的值
  - `collocations[]` → Mock 中的数组
- **清理**: 无

---

## 二、边界测试

### TC-B01: 单词名包含特殊字符（连字符、空格）
- **类型**: 边界测试
- **关联验收标准**: API 输入校验
- **前置条件**: 管理员已登录
- **输入**:
  - 请求体：`{ "wordName": "high-level", "wordbankId": "<wordbank_id>" }`
- **执行步骤**:
  1. 发送请求
  2. 检查 LLM 调用参数和响应
- **预期输出**:
  - 请求被正确接受（HTTP 200/201）
  - 或返回 400 校验失败（取决于设计决策，建议接受带连字符的复合词）
- **清理**: 删除可能生成的单词

### TC-B02: 单词名为空字符串
- **类型**: 边界测试
- **关联验收标准**: API 输入校验
- **前置条件**: 管理员已登录
- **输入**:
  - 请求体：`{ "wordName": "", "wordbankId": "<wordbank_id>" }`
- **执行步骤**:
  1. 发送请求
- **预期输出**:
  - HTTP 状态码：`400`
  - `code: "VALIDATION_ERROR"`，提示 `wordName` 不能为空
- **清理**: 无

### TC-B03: 单词名超长（如 200 字符）
- **类型**: 边界测试
- **关联验收标准**: API 输入校验
- **前置条件**: 管理员已登录
- **输入**:
  - 请求体：`{ "wordName": "<200个a字符>", "wordbankId": "<wordbank_id>" }`
- **执行步骤**:
  1. 发送请求
- **预期输出**:
  - HTTP 状态码：`400`
  - 或接受但 LLM 返回空/不完整内容 → 应返回友好错误
- **清理**: 无

---

## 三、异常测试

### TC-E01: LLM API Key 未配置
- **类型**: 异常测试
- **关联验收标准**: LLM API Key 通过环境变量配置
- **前置条件**:
  - 环境变量 `DEEPSEEK_API_KEY` 为空或未设置
- **输入**:
  - 请求体：`{ "wordName": "serendipity", "wordbankId": "<wordbank_id>" }`
- **执行步骤**:
  1. 发送生成请求
- **预期输出**:
  - HTTP 状态码：`503`
  - 响应体 `code: "LLM_NOT_CONFIGURED"`，message 明确提示管理员配置 API Key
  - 不暴露内部配置细节
- **清理**: 恢复环境变量

### TC-E02: LLM API 请求超时
- **类型**: 异常测试
- **关联验收标准**: 请求超时和错误处理（LLM 不可用时返回友好错误）
- **前置条件**:
  - 模拟网络延迟或使用超时极短的 Provider 配置（如 1ms timeout）
- **输入**:
  - 请求体：`{ "wordName": "timeout", "wordbankId": "<wordbank_id>" }`
- **执行步骤**:
  1. 发送生成请求
  2. 等待直到超时触发
- **预期输出**:
  - HTTP 状态码：`504` 或 `502`
  - 响应体 `code: "LLM_TIMEOUT"`，message 提示 AI 服务响应超时，请稍后重试
- **清理**: 恢复 Provider 配置

### TC-E03: LLM 返回非 JSON 格式（乱码/纯文本）
- **类型**: 异常测试
- **关联验收标准**: AI 生成结果结构化解析
- **前置条件**:
  - 使用 Mock Provider，配置返回 `"This is not JSON"` 纯文本
- **输入**:
  - 请求体：`{ "wordName": "garbage", "wordbankId": "<wordbank_id>" }`
- **执行步骤**:
  1. 发送生成请求
  2. 观察解析层行为
- **预期输出**:
  - HTTP 状态码：`502`
  - 响应体 `code: "LLM_PARSE_ERROR"`，message 提示 AI 返回格式异常
  - 不将脏数据写入数据库
  - 服务端日志记录原始返回内容（用于调试）
- **清理**: 恢复 Provider 配置

### TC-E04: LLM 返回 JSON 但缺少必要字段
- **类型**: 异常测试
- **关联验收标准**: AI 生成结果结构化解析；Prompt 工程要求完整字段
- **前置条件**:
  - Mock Provider 返回缺少 `extended_meanings` 字段的 JSON
- **输入**:
  - 请求体：`{ "wordName": "incomplete", "wordbankId": "<wordbank_id>" }`
- **执行步骤**:
  1. 发送生成请求
- **预期输出**:
  - HTTP 状态码：`502`
  - 响应体 `code: "LLM_PARSE_ERROR"`，提示 AI 返回内容不完整，缺少 `extended_meanings`
  - 不写入脏数据到数据库
- **清理**: 恢复 Provider 配置

### TC-E05: 词库不存在
- **类型**: 异常测试
- **关联验收标准**: API 输入校验
- **前置条件**: 管理员已登录
- **输入**:
  - 请求体：`{ "wordName": "hello", "wordbankId": "60f7c0a3e6b3f2a0d4e5f6a7" }`（不存在的 ObjectId）
- **执行步骤**:
  1. 发送请求
- **预期输出**:
  - HTTP 状态码：`404`
  - 响应体 `code: "NOT_FOUND"`，message 提示词库不存在
- **清理**: 无

### TC-E06: 未认证用户调用生成 API
- **类型**: 异常测试
- **关联验收标准**: 管理后台权限控制（继承 Task 3.2 的权限模型）
- **前置条件**: 无有效 JWT
- **输入**:
  - 请求体：`{ "wordName": "hello", "wordbankId": "<wordbank_id>" }`
  - Header：无 Authorization
- **执行步骤**:
  1. 发送请求
- **预期输出**:
  - HTTP 状态码：`401`
  - 响应体 `code: "UNAUTHORIZED"`
- **清理**: 无

### TC-E07: 普通用户（非管理员）调用生成 API
- **类型**: 异常测试
- **关联验收标准**: 仅管理员可调用 AI 生成
- **前置条件**: 普通用户已登录
- **输入**:
  - 请求体：`{ "wordName": "hello", "wordbankId": "<wordbank_id>" }`
  - Header：`Authorization: Bearer <user_token>`
- **执行步骤**:
  1. 发送请求
- **预期输出**:
  - HTTP 状态码：`403`
  - 响应体 `code: "FORBIDDEN"`
- **清理**: 无

### TC-E08: LLM API 返回 5xx 服务端错误
- **类型**: 异常测试
- **关联验收标准**: 请求超时和错误处理（LLM 不可用时返回友好错误）
- **前置条件**:
  - Mock Provider 模拟 LLM API 返回 HTTP 500
- **输入**:
  - 请求体：`{ "wordName": "error", "wordbankId": "<wordbank_id>" }`
- **执行步骤**:
  1. 发送生成请求
- **预期输出**:
  - HTTP 状态码：`502`
  - 响应体 `code: "LLM_SERVICE_ERROR"`，message 提示 AI 服务暂时不可用
  - 不泄露第三方 API 的具体错误信息
- **清理**: 恢复 Provider 配置

---

## 四、集成测试

### TC-I01: 完整链路 — LLM 生成 → 数据库存储 → API 查询可获取
- **类型**: 集成测试
- **关联验收标准**: 端到端验证
- **前置条件**:
  - 管理员已登录
  - DeepSeek API Key 可用
  - 测试词库已存在
- **输入**:
  - 请求体：`{ "wordName": "grasp", "wordbankId": "<wordbank_id>" }`
- **执行步骤**:
  1. `POST /api/words/generate` 生成词条
  2. 从响应中获取 `_id`
  3. `GET /api/words/<id>` 查询该单词
  4. 验证查询返回的内容与生成结果一致
- **预期输出**:
  - 步骤 3 返回 HTTP 200，数据与步骤 1 一致
  - `extendedMeanings` 数量 ≥ 3
  - `collocations` 非空
  - `physicalImageType` 为有效枚举值
- **清理**: 删除测试生成的单词

### TC-I02: Prompt 工程 — 多次生成同一单词结果稳定可解析
- **类型**: 集成测试
- **关联验收标准**: Prompt 工程 — 多次生成结果稳定可解析
- **前置条件**:
  - 管理员已登录
  - DeepSeek API Key 可用
- **输入**:
  - 第一次请求：`{ "wordName": "grasp", "wordbankId": "<wordbank_id>" }`
  - 第二次请求（不同 wordbankId，或 force=true）：`{ "wordName": "grasp", "wordbankId": "<wordbank_id_2>" }`
- **执行步骤**:
  1. 发送第一次生成请求（词库 A）
  2. 发送第二次生成请求（词库 B）
  3. 对比两次返回的 JSON 结构
- **预期输出**:
  - 两次调用均返回 HTTP 201
  - 两次返回的 JSON 结构一致（字段完整、类型正确）
  - 具体内容可以不同（LLM 天生具有随机性），但均可正确解析
- **清理**: 删除两次生成的单词文档

---

## 测试用例统计

| 类型 | 数量 | 编号 |
|------|------|------|
| 功能测试 | 5 | TC-F01 ~ TC-F05 |
| 边界测试 | 3 | TC-B01 ~ TC-B03 |
| 异常测试 | 8 | TC-E01 ~ TC-E08 |
| 集成测试 | 2 | TC-I01 ~ TC-I02 |
| **合计** | **16** | |

---

## 测试环境要求

| 资源 | 说明 |
|------|------|
| 测试数据库 | 独立 MongoDB 实例（或 `mongodb-memory-server`） |
| LLM API | 真实测试需有效 `DEEPSEEK_API_KEY`；单元测试使用 Mock Provider |
| 认证 Token | 预置管理员账号和普通用户账号 |
| 网络 | Mock Provider 可离线运行；真实 LLM 测试需网络 |
