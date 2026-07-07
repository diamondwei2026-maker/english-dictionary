# Task 4.1: AI 词条生成 API 与 LLM Provider

| 属性 | 值 |
|------|-----|
| ID | 4.1 |
| 状态 | pending |
| 优先级 | P1 |
| 依赖 | Task 3.2 |
| 阶段 | 阶段4: AI 词条生成 |
| 预估工时 | 3-4 小时 |

## 描述

实现 AI 词条自动生成 API，接入真实 LLM（大语言模型），根据单词名自动生成物理意象描述、核心义、引申义演化链、例句和常见搭配。需要设计 LLM Provider 抽象层以支持未来切换模型，并精心设计 Prompt 以获得结构化、符合认知语言学要求的输出。

## 验收标准

- [ ] `POST /api/words/generate` — 接收 wordName，调用 LLM 生成词条内容并存储到数据库
- [ ] LLM Provider 接口抽象：定义统一的 `generateWordEntry(wordName)` 接口
- [ ] 至少实现一个 Provider（如 OpenAI / Claude / 国产大模型）
- [ ] Prompt 工程：生成的词条包含物理意象、核心义、3+ 条引申义链（含逻辑演化描述）、例句、搭配
- [ ] AI 生成结果结构化解析（LLM 返回 JSON，解析后存入数据库各字段）
- [ ] 同一单词不重复生成（检查单词是否已有完整词条内容）
- [ ] 支持强制重新生成（`?force=true` 参数）
- [ ] LLM API Key 通过环境变量配置
- [ ] 请求超时和错误处理（LLM 不可用时返回友好错误）

## 子任务

### SUB-4.1.1: LLM Provider 抽象层
- **描述**: 定义 Provider 接口，实现首个 Provider
- **验收标准**:
  - [ ] 统一的 Provider 接口（generateWordEntry）
  - [ ] Provider 工厂函数支持按配置切换
  - [ ] API Key 从环境变量或配置读取

### SUB-4.1.2: Prompt 工程
- **描述**: 设计并测试 AI 生成词条的 Prompt
- **验收标准**:
  - [ ] Prompt 指导 LLM 按认知语言学方法生成内容
  - [ ] 输出为结构化 JSON，包含 physical_image、core_meaning、extended_meanings[]、collocations[]
  - [ ] 多次生成结果稳定可解析

### SUB-4.1.3: AI 生成 API 实现
- **描述**: 实现 Controller + Service，将 LLM 生成结果写入数据库
- **验收标准**:
  - [ ] API 接收单词名，触发 AI 生成，存储结果
  - [ ] 已生成完整词条的单词默认不重复生成
  - [ ] force=true 可强制重新生成

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
