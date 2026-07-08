# 测试用例 — Task 3.2: 单词 CRUD API 与管理后台权限

## TC-001: 获取单词列表（无筛选、默认分页）
- **类型**: 功能测试
- **关联验收标准**: `GET /api/words` — 单词列表，支持按词库筛选、关键词搜索、分页
- **前置条件**: 数据库中存在多个单词（至少 30 个）属于不同词库
- **输入**:
  - 请求: `GET /api/words`（无 query 参数）
- **执行步骤**:
  1. 发送 GET 请求，不带任何认证 Token
  2. 检查响应体结构和分页信息
- **预期输出**:
  - HTTP 状态码: 200
  - 响应体包含 `data` 数组（默认最多 20 条）和 `pagination` 对象
  - `pagination` 包含 `total`、`page`（默认 1）、`pageSize`（默认 20）、`totalPages`
  - 每个单词对象基本字段完整（_id、word、wordbankId、phonetic、coreMeaning 等）
  - 列表按 `createdAt` 降序排列
- **清理**: 无

---

## TC-002: 单词列表按词库筛选
- **类型**: 功能测试
- **关联验收标准**: `GET /api/words` — 支持按词库筛选（wordbank_id）
- **前置条件**: 词库 A（id=wb_a）有 3 个单词，词库 B（id=wb_b）有 5 个单词
- **输入**:
  - 请求: `GET /api/words?wordbank_id=wb_a`
- **执行步骤**:
  1. 发送 GET 请求，携带 `wordbank_id` 参数
  2. 验证返回的单词全部属于词库 A
- **预期输出**:
  - HTTP 状态码: 200
  - `data` 数组长度为 3
  - 所有单词的 `wordbankId` 均为 `wb_a`
  - `pagination.total` 为 3
- **清理**: 无

---

## TC-003: 单词列表关键词模糊搜索
- **类型**: 功能测试
- **关联验收标准**: 关键词搜索支持按单词名模糊匹配（LIKE %keyword%）
- **前置条件**: 数据库中存在 `apple`、`pineapple`、`application` 三个单词
- **输入**:
  - 请求: `GET /api/words?q=app`
- **执行步骤**:
  1. 发送 GET 请求，携带 `q=app`
  2. 验证返回结果包含所有匹配的单词
- **预期输出**:
  - HTTP 状态码: 200
  - `data` 数组包含 `apple`、`pineapple`、`application`（名称中包含 "app" 的所有单词）
  - `pagination.total` 为 3
- **清理**: 无

---

## TC-004: 单词列表分页第 2 页
- **类型**: 功能测试
- **关联验收标准**: `GET /api/words` — 分页
- **前置条件**: 数据库中有 25 个单词
- **输入**:
  - 请求: `GET /api/words?page=2&pageSize=10`
- **执行步骤**:
  1. 发送 GET 请求，指定 page=2, pageSize=10
  2. 验证返回第 2 页的数据
- **预期输出**:
  - HTTP 状态码: 200
  - `data` 数组长度为 10（第 11-20 条）
  - `pagination.page` 为 2
  - `pagination.pageSize` 为 10
  - `pagination.total` 为 25
  - `pagination.totalPages` 为 3
- **清理**: 无

---

## TC-005: 单词列表分页超出范围
- **类型**: 边界测试
- **关联验收标准**: `GET /api/words` — 分页
- **前置条件**: 数据库中有 10 个单词
- **输入**:
  - 请求: `GET /api/words?page=99&pageSize=20`
- **执行步骤**:
  1. 发送 GET 请求，page 远大于实际页数
  2. 验证返回空数组
- **预期输出**:
  - HTTP 状态码: 200
  - `data` 数组长度为 0
  - `pagination.total` 为 10
- **清理**: 无

---

## TC-006: 获取单词详情（完整嵌套数据）
- **类型**: 功能测试
- **关联验收标准**: `GET /api/words/:id` — 单词详情，包含完整引申义链和搭配列表
- **前置条件**: 单词 `flow` 存在，包含 2 个引申义（各有 evolutionDescription、meaning、partOfSpeech、exampleEn、exampleZh）和 3 个搭配
- **输入**:
  - 请求: `GET /api/words/<wordId>`
- **执行步骤**:
  1. 发送 GET 请求获取单词详情
  2. 验证响应中嵌套数据结构完整
- **预期输出**:
  - HTTP 状态码: 200
  - 响应体包含完整单词字段（word、phonetic、coreMeaning、coreExampleEn、coreExampleZh、physicalImageType、physicalImageDescription）
  - `extendedMeanings` 为数组，长度为 2，每个元素包含 `_id`、`evolutionDescription`、`meaning`、`partOfSpeech`、`exampleEn`、`exampleZh`
  - `collocations` 为字符串数组，长度为 3
  - 包含 `wordbankId`、`createdAt`、`updatedAt`
- **清理**: 无

---

## TC-007: 获取不存在的单词详情
- **类型**: 异常测试
- **关联验收标准**: `GET /api/words/:id`
- **前置条件**: 传入的 ObjectId 格式合法但数据库中不存在
- **输入**:
  - 请求: `GET /api/words/507f1f77bcf86cd799439011`（合法 ObjectId 但不存在）
- **执行步骤**:
  1. 发送 GET 请求
  2. 验证返回 404
- **预期输出**:
  - HTTP 状态码: 404
  - 错误信息中包含 NOT_FOUND 或"不存在"等提示
- **清理**: 无

---

## TC-008: 获取单词详情 — 无效 ObjectId 格式
- **类型**: 异常测试
- **关联验收标准**: `GET /api/words/:id`
- **前置条件**: 无
- **输入**:
  - 请求: `GET /api/words/invalid-id-format`
- **执行步骤**:
  1. 发送 GET 请求，id 格式非法
  2. 验证返回 400
- **预期输出**:
  - HTTP 状态码: 400
  - 错误信息中提示 ID 格式无效
- **清理**: 无

---

## TC-009: 管理员新增单词（含嵌套数据）
- **类型**: 功能测试
- **关联验收标准**: `POST /api/words` — 新增单词（需管理员）
- **前置条件**: 管理员已登录，Token 有效；词库 `wb_a` 存在
- **输入**:
  - 请求: `POST /api/words`
  - Header: `Authorization: Bearer <admin_token>`
  - Body:
    ```json
    {
      "word": "flow",
      "wordbankId": "<wb_a_id>",
      "phonetic": "/floʊ/",
      "coreMeaning": "沿阻力最小路径持续运动",
      "coreExampleEn": "Water flows downhill.",
      "coreExampleZh": "水往低处流。",
      "physicalImageType": "flow",
      "physicalImageDescription": "液体沿最小阻力路径持续流动",
      "extendedMeanings": [
        {
          "evolutionDescription": "流体沿固定方向持续流动 → 思想/语言的连贯状态",
          "meaning": "（思想/语言）连贯流畅",
          "partOfSpeech": "adj",
          "exampleEn": "She delivered a flow speech.",
          "exampleZh": "她发表了一篇流畅的演讲。"
        },
        {
          "evolutionDescription": "流动 → 动作/状态的连续进行",
          "meaning": "（动作/过程）顺利进行",
          "partOfSpeech": "verb",
          "exampleEn": "The meeting flowed smoothly.",
          "exampleZh": "会议进行得很顺利。"
        }
      ],
      "collocations": ["flow rate", "go with the flow", "cash flow"]
    }
    ```
- **执行步骤**:
  1. 以管理员 Token 发送 POST 请求
  2. 验证创建成功
  3. 查询数据库确认嵌套数据已存储
- **预期输出**:
  - HTTP 状态码: 201
  - 响应体包含创建后的完整单词对象（含 `_id`）
  - `extendedMeanings` 数组长度为 2，每个子文档有独立的 `_id`
  - `collocations` 数组长度为 3
  - `wordbankId` 与请求一致
- **清理**: 删除创建的单词

---

## TC-010: 管理员新增单词 — 仅必填字段（最小有效请求）
- **类型**: 边界测试
- **关联验收标准**: `POST /api/words` — 新增单词
- **前置条件**: 管理员已登录，Token 有效；词库 `wb_a` 存在
- **输入**:
  - 请求: `POST /api/words`
  - Header: `Authorization: Bearer <admin_token>`
  - Body:
    ```json
    {
      "word": "minimal",
      "wordbankId": "<wb_a_id>",
      "coreMeaning": "最少的",
      "coreExampleEn": "It requires minimal effort.",
      "coreExampleZh": "它只需最少的努力。",
      "physicalImageType": "flow",
      "physicalImageDescription": "描述最简状态"
    }
    ```
- **执行步骤**:
  1. 发送 POST 请求（不含 phonetic、extendedMeanings、collocations 等可选字段）
  2. 验证创建成功，可选字段使用默认值
- **预期输出**:
  - HTTP 状态码: 201
  - `phonetic` 为 null 或不存在
  - `extendedMeanings` 为空数组 `[]`
  - `collocations` 为空数组 `[]`
- **清理**: 删除创建的单词

---

## TC-011: 在同一词库中创建重名单词
- **类型**: 异常测试
- **关联验收标准**: 单词名在同一个词库内唯一
- **前置条件**: 词库 `wb_a` 中已存在单词 `flow`
- **输入**:
  - 请求: `POST /api/words`
  - Header: `Authorization: Bearer <admin_token>`
  - Body: `{ "word": "flow", "wordbankId": "<wb_a_id>", "coreMeaning": "...", ... }`
- **执行步骤**:
  1. 以管理员 Token 发送 POST 请求，word 和 wordbankId 与已有单词相同
  2. 验证返回冲突错误
- **预期输出**:
  - HTTP 状态码: 409
  - 错误信息提示该词库内单词名重复
- **清理**: 无

---

## TC-012: 在不同词库中创建同名单词
- **类型**: 边界测试
- **关联验收标准**: 单词名在同一个词库内唯一
- **前置条件**: 词库 `wb_a` 中存在 `flow`；词库 `wb_b` 中无 `flow`
- **输入**:
  - 请求: `POST /api/words`
  - Header: `Authorization: Bearer <admin_token>`
  - Body: `{ "word": "flow", "wordbankId": "<wb_b_id>", "coreMeaning": "...", ... }`
- **执行步骤**:
  1. 以管理员 Token 创建同名单词，但属于不同词库
  2. 验证创建成功
- **预期输出**:
  - HTTP 状态码: 201（同名但不同词库允许）
- **清理**: 删除创建的单词

---

## TC-013: 新增单词 — 缺少必填字段
- **类型**: 异常测试
- **关联验收标准**: `POST /api/words` — 新增单词
- **前置条件**: 管理员已登录，Token 有效
- **输入**:
  - 请求: `POST /api/words`
  - Header: `Authorization: Bearer <admin_token>`
  - Body: `{ "word": "incomplete" }`（缺少 wordbankId、coreMeaning 等必填字段）
- **执行步骤**:
  1. 发送 POST 请求，缺少必填字段
  2. 验证返回校验错误
- **预期输出**:
  - HTTP 状态码: 400
  - 错误信息中包含缺失字段名列表
- **清理**: 无

---

## TC-014: 新增单词 — physicalImageType 非法枚举值
- **类型**: 异常测试
- **关联验收标准**: `POST /api/words` — 新增单词
- **前置条件**: 管理员已登录
- **输入**:
  - 请求: `POST /api/words`
  - Header: `Authorization: Bearer <admin_token>`
  - Body: `{ "word": "test", "wordbankId": "...", "coreMeaning": "...", "coreExampleEn": "...", "coreExampleZh": "...", "physicalImageType": "invalid_type", "physicalImageDescription": "..." }`
- **执行步骤**:
  1. 发送 POST 请求，physicalImageType 不在枚举值中
  2. 验证返回校验错误
- **预期输出**:
  - HTTP 状态码: 400
  - 错误信息提示 physicalImageType 必须为指定的枚举值之一
- **清理**: 无

---

## TC-015: 新增单词 — 嵌套 extendedMeaning 字段不完整
- **类型**: 异常测试
- **关联验收标准**: `POST /api/words` — 接收嵌套的 extended_meanings
- **前置条件**: 管理员已登录
- **输入**:
  - 请求: `POST /api/words`
  - Header: `Authorization: Bearer <admin_token>`
  - Body: 所有必填字段齐全，但 `extendedMeanings` 中某个元素缺少 `meaning` 字段
- **执行步骤**:
  1. 发送 POST 请求，extendedMeanings 中某个子文档不完整
  2. 验证返回校验错误
- **预期输出**:
  - HTTP 状态码: 400
  - 错误信息提示嵌套字段缺失
- **清理**: 无

---

## TC-016: 非管理员新增单词
- **类型**: 异常测试
- **关联验收标准**: 所有写操作受 adminMiddleware 保护
- **前置条件**: 普通用户已登录，Token 有效（role=user）
- **输入**:
  - 请求: `POST /api/words`
  - Header: `Authorization: Bearer <user_token>`（role=user）
  - Body: 完整合法的单词数据
- **执行步骤**:
  1. 以普通用户 Token 发送 POST 请求
  2. 验证返回 403
- **预期输出**:
  - HTTP 状态码: 403
  - 错误信息提示权限不足、需要管理员权限
- **清理**: 无

---

## TC-017: 未认证用户新增单词
- **类型**: 异常测试
- **关联验收标准**: 所有写操作受 adminMiddleware 保护
- **前置条件**: 无
- **输入**:
  - 请求: `POST /api/words`（不带 Authorization Header）
  - Body: 完整合法的单词数据
- **执行步骤**:
  1. 不带 Token 发送 POST 请求
  2. 验证返回 401
- **预期输出**:
  - HTTP 状态码: 401
  - 错误信息提示未提供认证令牌
- **清理**: 无

---

## TC-018: 管理员编辑单词（更新主字段 + 嵌套数据）
- **类型**: 功能测试
- **关联验收标准**: `PUT /api/words/:id` — 编辑单词，支持嵌套资源的增删改
- **前置条件**: 管理员已登录；单词 `flow` 存在，有 2 个引申义
- **输入**:
  - 请求: `PUT /api/words/<word_id>`
  - Header: `Authorization: Bearer <admin_token>`
  - Body:
    ```json
    {
      "phonetic": "/floʊ/ (updated)",
      "coreMeaning": "更新后的核心义",
      "extendedMeanings": [
        {
          "_id": "<existing_meaning_1_id>",
          "evolutionDescription": "更新后的演化描述",
          "meaning": "更新后的引申义",
          "partOfSpeech": "adj",
          "exampleEn": "Updated example.",
          "exampleZh": "更新后的例句。"
        }
      ],
      "collocations": ["updated collocation"]
    }
    ```
- **执行步骤**:
  1. 以管理员 Token 发送 PUT 请求，更新部分字段 + 嵌套数据
  2. 验证更新成功
- **预期输出**:
  - HTTP 状态码: 200
  - `phonetic` 已更新为新值
  - `coreMeaning` 已更新
  - `extendedMeanings` 数组仅包含 1 个元素（替换了原有数据）
  - `collocations` 已更新为新数组
  - 未传入的字段（如 `word`）保持不变
- **清理**: 恢复原数据或删除

---

## TC-019: 管理员编辑单词 — 部分字段更新
- **类型**: 功能测试
- **关联验收标准**: `PUT /api/words/:id` — 编辑单词
- **前置条件**: 管理员已登录；单词 `flow` 存在
- **输入**:
  - 请求: `PUT /api/words/<word_id>`
  - Header: `Authorization: Bearer <admin_token>`
  - Body: `{ "phonetic": "/fləʊ/" }`（仅更新音标）
- **执行步骤**:
  1. 发送 PUT 请求，仅传入 phonetic
  2. 验证仅该字段被更新，其余不变
- **预期输出**:
  - HTTP 状态码: 200
  - `phonetic` 已更新
  - `word`、`coreMeaning` 等其余字段保持原值
- **清理**: 恢复原数据

---

## TC-020: 管理员编辑不存在的单词
- **类型**: 异常测试
- **关联验收标准**: `PUT /api/words/:id`
- **前置条件**: 管理员已登录
- **输入**:
  - 请求: `PUT /api/words/507f1f77bcf86cd799439011`（不存在）
  - Header: `Authorization: Bearer <admin_token>`
  - Body: `{ "phonetic": "/test/" }`
- **执行步骤**:
  1. 发送 PUT 请求，目标单词不存在
  2. 验证返回 404
- **预期输出**:
  - HTTP 状态码: 404
  - 错误信息提示单词不存在
- **清理**: 无

---

## TC-021: 非管理员编辑单词
- **类型**: 异常测试
- **关联验收标准**: 所有写操作受 adminMiddleware 保护
- **前置条件**: 普通用户已登录（role=user）；单词 `flow` 存在
- **输入**:
  - 请求: `PUT /api/words/<word_id>`
  - Header: `Authorization: Bearer <user_token>`
  - Body: `{ "phonetic": "/test/" }`
- **执行步骤**:
  1. 以普通用户 Token 发送 PUT 请求
  2. 验证返回 403
- **预期输出**:
  - HTTP 状态码: 403
  - 错误信息提示权限不足
- **清理**: 无

---

## TC-022: 管理员删除单词（带嵌套数据）
- **类型**: 功能测试
- **关联验收标准**: `DELETE /api/words/:id` — 删除单词，级联删除引申义和搭配
- **前置条件**: 管理员已登录；单词 `flow` 存在，包含 2 个引申义和 3 个搭配
- **输入**:
  - 请求: `DELETE /api/words/<word_id>`
  - Header: `Authorization: Bearer <admin_token>`
- **执行步骤**:
  1. 以管理员 Token 发送 DELETE 请求
  2. 验证删除成功
  3. 再次查询该单词 → 404
  4. 查询数据库确认嵌套数据已级联删除
- **预期输出**:
  - HTTP 状态码: 200（或 204）
  - 响应体包含成功提示信息
  - 数据库中该单词及其嵌套的 extendedMeanings、collocations 均被删除
- **清理**: 无（单词已删除）

---

## TC-023: 管理员删除不存在的单词
- **类型**: 异常测试
- **关联验收标准**: `DELETE /api/words/:id`
- **前置条件**: 管理员已登录
- **输入**:
  - 请求: `DELETE /api/words/507f1f77bcf86cd799439011`（不存在）
  - Header: `Authorization: Bearer <admin_token>`
- **执行步骤**:
  1. 发送 DELETE 请求，目标不存在
  2. 验证返回 404
- **预期输出**:
  - HTTP 状态码: 404
  - 错误信息提示单词不存在
- **清理**: 无

---

## TC-024: 非管理员删除单词
- **类型**: 异常测试
- **关联验收标准**: 所有写操作受 adminMiddleware 保护
- **前置条件**: 普通用户已登录（role=user）；单词 `flow` 存在
- **输入**:
  - 请求: `DELETE /api/words/<word_id>`
  - Header: `Authorization: Bearer <user_token>`
- **执行步骤**:
  1. 以普通用户 Token 发送 DELETE 请求
  2. 验证返回 403
- **预期输出**:
  - HTTP 状态码: 403
  - 错误信息提示权限不足
- **清理**: 无

---

## TC-025: 按词库获取单词列表
- **类型**: 功能测试
- **关联验收标准**: `GET /api/wordbanks/:id/words` — 按词库获取单词列表
- **前置条件**: 词库 `wb_a` 存在，其中有 5 个单词
- **输入**:
  - 请求: `GET /api/wordbanks/<wb_a_id>/words`
- **执行步骤**:
  1. 发送 GET 请求（无需认证）
  2. 验证返回该词库下的所有单词
- **预期输出**:
  - HTTP 状态码: 200
  - `data` 数组长度为 5
  - 所有单词的 `wordbankId` 均为 `wb_a`
  - 支持分页参数（page、pageSize）
- **清理**: 无

---

## TC-026: 按不存在的词库获取单词列表
- **类型**: 异常测试
- **关联验收标准**: `GET /api/wordbanks/:id/words`
- **前置条件**: 无
- **输入**:
  - 请求: `GET /api/wordbanks/507f1f77bcf86cd799439011/words`（词库不存在）
- **执行步骤**:
  1. 发送 GET 请求，词库 ID 不存在
  2. 验证返回 404
- **预期输出**:
  - HTTP 状态码: 404
  - 错误信息提示词库不存在
- **清理**: 无

---

## TC-027: 单词搜索无结果
- **类型**: 边界测试
- **关联验收标准**: 关键词搜索支持按单词名模糊匹配
- **前置条件**: 数据库中存在单词
- **输入**:
  - 请求: `GET /api/words?q=xyznonexistent123`
- **执行步骤**:
  1. 发送 GET 请求，关键词不匹配任何单词
  2. 验证返回空列表
- **预期输出**:
  - HTTP 状态码: 200
  - `data` 为空数组
  - `pagination.total` 为 0
- **清理**: 无

---

## TC-028: 同时使用词库筛选和关键词搜索
- **类型**: 功能测试
- **关联验收标准**: 列表支持筛选 + 搜索组合
- **前置条件**: 词库 A 有 `apple`、`application`；词库 B 有 `pineapple`、`banana`
- **输入**:
  - 请求: `GET /api/words?wordbank_id=<wb_a_id>&q=app`
- **执行步骤**:
  1. 发送 GET 请求，同时带 wordbank_id 和 q
  2. 验证返回交集结果
- **预期输出**:
  - HTTP 状态码: 200
  - `data` 仅包含词库 A 中名称匹配 "app" 的单词（`apple`、`application`）
  - 不包含词库 B 的 `pineapple`
- **清理**: 无

---

## TC-029: 获取单词详情 — extendedMeanings 按顺序排列
- **类型**: 功能测试
- **关联验收标准**: 详情包含嵌套的引申义
- **前置条件**: 单词 `flow` 存在，包含 3 个引申义（按数组顺序存储）
- **输入**:
  - 请求: `GET /api/words/<wordId>`
- **执行步骤**:
  1. 发送 GET 请求
  2. 验证 extendedMeanings 数组保持插入顺序
- **预期输出**:
  - HTTP 状态码: 200
  - `extendedMeanings` 数组中元素的顺序与创建时的顺序一致
- **清理**: 无

---

## TC-030: 单词列表 pageSize 超过最大限制
- **类型**: 边界测试
- **关联验收标准**: `GET /api/words` — 分页
- **前置条件**: 数据库中有足够多的单词
- **输入**:
  - 请求: `GET /api/words?pageSize=9999`
- **执行步骤**:
  1. 发送 GET 请求，pageSize 远超合理上限
  2. 验证被限制到最大值
- **预期输出**:
  - HTTP 状态码: 200
  - 实际 pageSize 被限制为最大值（如 100）
  - `pagination.pageSize` 为 100
- **清理**: 无

---

## TC-031: 管理员新增单词 — extendedMeaning 的 partOfSpeech 非法值
- **类型**: 异常测试
- **关联验收标准**: `POST /api/words` — 接收嵌套的 extended_meanings
- **前置条件**: 管理员已登录
- **输入**:
  - Body 中 extendedMeanings[0].partOfSpeech 为 `"gerund"`（不在枚举中）
- **执行步骤**:
  1. 发送 POST 请求
  2. 验证校验失败
- **预期输出**:
  - HTTP 状态码: 400
  - 错误信息提示 partOfSpeech 必须为合法词性枚举值
- **清理**: 无

---

## TC-032: 管理员新增单词 — wordbankId 指向不存在的词库
- **类型**: 异常测试
- **关联验收标准**: `POST /api/words` — 新增单词
- **前置条件**: 管理员已登录
- **输入**:
  - Body 中 wordbankId 为合法 ObjectId 但不对应任何词库
- **执行步骤**:
  1. 发送 POST 请求
  2. 验证返回 404 或 400
- **预期输出**:
  - HTTP 状态码: 404
  - 错误信息提示词库不存在
- **清理**: 无

---

## TC-033: 管理员删除单词后，词库中不再包含该单词
- **类型**: 集成测试
- **关联验收标准**: `DELETE /api/words/:id` + `GET /api/wordbanks/:id/words`
- **前置条件**: 管理员已登录；词库 `wb_a` 中有 3 个单词
- **输入**:
  - 先删除词库 A 中的一个单词
  - 再查询词库 A 的单词列表
- **执行步骤**:
  1. `DELETE /api/words/<word_1_id>`（管理员 Token）
  2. `GET /api/wordbanks/<wb_a_id>/words`
  3. 验证单词数量减少
- **预期输出**:
  - 删除成功，返回 200
  - 词库单词列表仅剩 2 个单词
- **清理**: 无（已删除）

---

## TC-034: 过期 Token 无法执行写操作
- **类型**: 异常测试
- **关联验收标准**: 写操作受 adminMiddleware 保护
- **前置条件**: 使用已过期的 Token
- **输入**:
  - 请求: `POST /api/words`
  - Header: `Authorization: Bearer <expired_token>`
  - Body: 完整单词数据
- **执行步骤**:
  1. 发送 POST 请求，使用过期 Token
  2. 验证返回 401
- **预期输出**:
  - HTTP 状态码: 401
  - 错误信息提示 Token 已过期
- **清理**: 无

---

## TC-035: 单词列表 page 为负数时兜底为第 1 页
- **类型**: 边界测试
- **关联验收标准**: `GET /api/words` — 分页
- **前置条件**: 数据库中有单词
- **输入**:
  - 请求: `GET /api/words?page=-1`
- **执行步骤**:
  1. 发送 GET 请求，page 为负数
  2. 验证被兜底为第 1 页
- **预期输出**:
  - HTTP 状态码: 200
  - `pagination.page` 实际为 1
- **清理**: 无

---

## 测试用例统计

| 维度 | 数量 |
|------|------|
| 功能测试 | 13 |
| 边界测试 | 6 |
| 异常测试 | 15 |
| 集成测试 | 1 |
| **合计** | **35** |

## 验收标准覆盖矩阵

| 验收标准 | 覆盖用例 |
|----------|---------|
| `GET /api/words` 列表+筛选+搜索+分页 | TC-001, TC-002, TC-003, TC-004, TC-005, TC-028, TC-030, TC-035 |
| `GET /api/words/:id` 详情含嵌套数据 | TC-006, TC-007, TC-008, TC-029 |
| `POST /api/words` 新增（管理员） | TC-009, TC-010, TC-011, TC-012, TC-013, TC-014, TC-015, TC-031, TC-032 |
| `PUT /api/words/:id` 编辑+嵌套增删改 | TC-018, TC-019, TC-020, TC-021 |
| `DELETE /api/words/:id` 删除+级联 | TC-022, TC-023, TC-024 |
| `GET /api/wordbanks/:id/words` | TC-025, TC-026, TC-033 |
| 关键词搜索模糊匹配 | TC-003, TC-027, TC-028 |
| 写操作受 adminMiddleware 保护 | TC-016, TC-017, TC-021, TC-024, TC-034 |
| 单词名在同一个词库内唯一 | TC-011, TC-012 |
