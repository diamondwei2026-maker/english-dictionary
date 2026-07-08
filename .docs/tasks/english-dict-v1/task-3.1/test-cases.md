# 测试用例 — Task 3.1: 词库 CRUD API

> 基于 [task.md](./task.md) 验收标准生成，API 路径遵循现有约定 `/api/v1/wordbanks`。
> **注意**：当前 WordBank Model 缺少 `slug`、`cover_image`、`is_public` 字段 — 实现 CRUD 前需先更新 Model。

---

### TC-001: 获取公开词库列表（无认证）
- **类型**: 功能测试
- **关联验收标准**: `GET /api/wordbanks` — 词库列表，公开词库无需登录
- **前置条件**: 数据库存在 3 个公开词库（is_public=true）和 2 个私有词库（is_public=false）
- **输入**:
  - 请求：`GET /api/v1/wordbanks`
  - Header：无 Authorization
- **执行步骤**:
  1. 发送 GET 请求到 `/api/v1/wordbanks`（无认证头）
  2. 检查响应体结构
- **预期输出**:
  - HTTP 状态码：200
  - 响应体：`{ data: [...], pagination: { total: 3, page: 1, pageSize: 20 } }`
  - data 数组中仅包含 `is_public: true` 的词库（3 个）
  - 每个词库包含 `_id`, `name`, `slug`, `description`, `cover_image`, `gradient`, `is_public`, `createdAt`
- **清理**: 无

### TC-002: 词库列表分页查询
- **类型**: 功能测试
- **关联验收标准**: 分页查询返回 total、page、pageSize
- **前置条件**: 数据库存在 25 个公开词库
- **输入**:
  - 请求：`GET /api/v1/wordbanks?page=2&pageSize=10`
- **执行步骤**:
  1. 发送带分页参数的 GET 请求
  2. 检查分页元数据
- **预期输出**:
  - HTTP 状态码：200
  - 响应体：`pagination` 字段包含 `{ total: 25, page: 2, pageSize: 10 }`
  - `data` 数组长度为 10（第二页数据）
  - 第一页数据不在结果中
- **清理**: 无

### TC-003: 分页默认参数
- **类型**: 边界测试
- **关联验收标准**: 分页查询返回 total、page、pageSize
- **前置条件**: 数据库存在 5 个公开词库
- **输入**:
  - 请求：`GET /api/v1/wordbanks`（不传 page/pageSize）
- **执行步骤**:
  1. 发送无分页参数的 GET 请求
  2. 检查默认分页行为
- **预期输出**:
  - HTTP 状态码：200
  - `pagination.page` 为 1，`pagination.pageSize` 为默认值（如 20）
  - `pagination.total` 为 5
- **清理**: 无

### TC-004: 管理员可查看所有词库（含私有）
- **类型**: 功能测试
- **关联验收标准**: 公开/私有词库区分，普通用户只看到公开词库
- **前置条件**: 管理员已登录，有有效 JWT Token；数据库存在公开和私有词库
- **输入**:
  - 请求：`GET /api/v1/wordbanks`
  - Header：`Authorization: Bearer <admin_token>`
- **执行步骤**:
  1. 用管理员 Token 发送 GET 请求
  2. 检查返回词库集合
- **预期输出**:
  - HTTP 状态码：200
  - `pagination.total` 包含公开 + 私有词库总数
  - data 数组中同时包含 `is_public: true` 和 `is_public: false` 的词库
- **清理**: 无

### TC-005: 普通用户仅看到公开词库
- **类型**: 功能测试
- **关联验收标准**: 公开/私有词库区分（is_public 字段），普通用户只看到公开词库
- **前置条件**: 普通用户已登录；数据库存在公开和私有词库
- **输入**:
  - 请求：`GET /api/v1/wordbanks`
  - Header：`Authorization: Bearer <user_token>`
- **执行步骤**:
  1. 用普通用户 Token 发送 GET 请求
  2. 检查返回词库集合
- **预期输出**:
  - HTTP 状态码：200
  - data 数组仅包含 `is_public: true` 的词库
  - 私有词库不出现在结果中
- **清理**: 无

### TC-006: 获取词库详情（含单词数量）
- **类型**: 功能测试
- **关联验收标准**: `GET /api/wordbanks/:id` — 词库详情（含单词数量统计）
- **前置条件**: 存在一个公开词库且该词库下有 5 个单词
- **输入**:
  - 请求：`GET /api/v1/wordbanks/<wordbank_id>`
- **执行步骤**:
  1. 发送 GET 请求获取词库详情
  2. 检查详情字段
- **预期输出**:
  - HTTP 状态码：200
  - 响应体包含 `name`, `slug`, `description`, `cover_image`, `gradient`, `is_public`
  - 响应体包含 `wordCount: 5`（单词数量统计字段）
- **清理**: 无

### TC-007: 获取不存在词库的详情
- **类型**: 异常测试
- **关联验收标准**: `GET /api/wordbanks/:id`
- **前置条件**: 数据库中不存在该 ID
- **输入**:
  - 请求：`GET /api/v1/wordbanks/507f1f77bcf86cd799439011`（不存在的 ObjectId）
- **执行步骤**:
  1. 发送 GET 请求查询不存在的词库 ID
- **预期输出**:
  - HTTP 状态码：404
  - 响应体：`{ error: { code: "NOT_FOUND", message: "词库不存在" } }`
- **清理**: 无

### TC-008: 新增词库（管理员）
- **类型**: 功能测试
- **关联验收标准**: `POST /api/wordbanks` — 新增词库（需管理员权限）
- **前置条件**: 管理员已登录
- **输入**:
  - 请求：`POST /api/v1/wordbanks`
  - Header：`Authorization: Bearer <admin_token>`
  - Body：`{ "name": "商务英语", "slug": "business-english", "description": "常用商务词汇与表达", "cover_image": "https://example.com/cover.jpg", "is_public": true, "gradient": "linear-gradient(135deg, #667eea, #764ba2)" }`
- **执行步骤**:
  1. 发送 POST 请求创建新词库
  2. 验证数据库写入
- **预期输出**:
  - HTTP 状态码：201
  - 响应体包含 `_id` 字段，且所有传入字段被正确保存
  - 数据库中存在该词库记录
- **清理**: 删除创建的测试词库

### TC-009: 新增词库 slug 重复（409）
- **类型**: 异常测试
- **关联验收标准**: slug 唯一性校验
- **前置条件**: 数据库已存在 slug=`business-english` 的词库；管理员已登录
- **输入**:
  - 请求：`POST /api/v1/wordbanks`
  - Header：`Authorization: Bearer <admin_token>`
  - Body：`{ "name": "商务英语 V2", "slug": "business-english", "description": "重复 slug" }`
- **执行步骤**:
  1. 发送 POST 请求使用已存在的 slug
- **预期输出**:
  - HTTP 状态码：409
  - 响应体：`{ error: { code: "CONFLICT", message: "slug 已存在" } }`
- **清理**: 无

### TC-010: 新增词库缺少必填字段
- **类型**: 异常测试
- **关联验收标准**: 接收 name、slug、description、cover_image，新增接口校验必填字段（name, slug）
- **前置条件**: 管理员已登录
- **输入**:
  - 请求：`POST /api/v1/wordbanks`
  - Header：`Authorization: Bearer <admin_token>`
  - Body：`{ "description": "缺少 name 和 slug" }`
- **执行步骤**:
  1. 发送 POST 请求，body 中缺少 name 和 slug
- **预期输出**:
  - HTTP 状态码：400
  - 响应体：`{ error: { code: "VALIDATION_ERROR", message: "…", errors: [{ field: "name", … }, { field: "slug", … }] } }`
- **清理**: 无

### TC-011: 非管理员新增词库被拒绝
- **类型**: 异常测试
- **关联验收标准**: POST /api/wordbanks 需管理员权限
- **前置条件**: 普通用户已登录
- **输入**:
  - 请求：`POST /api/v1/wordbanks`
  - Header：`Authorization: Bearer <user_token>`
  - Body：`{ "name": "测试", "slug": "test", "description": "测试词库" }`
- **执行步骤**:
  1. 用普通用户 Token 发送 POST 请求
- **预期输出**:
  - HTTP 状态码：403
  - 响应体：`{ error: { code: "FORBIDDEN", message: "权限不足，需要管理员权限" } }`
- **清理**: 无

### TC-012: 未认证新增词库被拒绝
- **类型**: 异常测试
- **关联验收标准**: POST /api/wordbanks 需管理员权限
- **前置条件**: 无
- **输入**:
  - 请求：`POST /api/v1/wordbanks`（无 Authorization Header）
  - Body：`{ "name": "测试", "slug": "test", "description": "测试词库" }`
- **执行步骤**:
  1. 无 Token 发送 POST 请求
- **预期输出**:
  - HTTP 状态码：401
  - 响应体：`{ error: { code: "UNAUTHORIZED", message: "…" } }`
- **清理**: 无

### TC-013: 编辑词库（管理员）
- **类型**: 功能测试
- **关联验收标准**: `PUT /api/wordbanks/:id` — 编辑词库（需管理员权限）
- **前置条件**: 存在一个词库；管理员已登录
- **输入**:
  - 请求：`PUT /api/v1/wordbanks/<wordbank_id>`
  - Header：`Authorization: Bearer <admin_token>`
  - Body：`{ "name": "商务英语（更新）", "description": "更新后的描述" }`
- **执行步骤**:
  1. 发送 PUT 请求更新词库
  2. 再次 GET 该词库验证更新
- **预期输出**:
  - HTTP 状态码：200
  - 响应体 `name` 和 `description` 已更新为新值
  - 未传入的字段保持原值不变
- **清理**: 恢复原值或删除测试数据

### TC-014: 部分更新词库（仅更新 name）
- **类型**: 功能测试
- **关联验收标准**: 编辑接口仅更新传入字段（部分更新）
- **前置条件**: 存在词库 name="原名称", description="原描述"；管理员已登录
- **输入**:
  - 请求：`PUT /api/v1/wordbanks/<wordbank_id>`
  - Header：`Authorization: Bearer <admin_token>`
  - Body：`{ "name": "新名称" }`
- **执行步骤**:
  1. 发送 PUT 请求仅传 name 字段
  2. GET 该词库验证
- **预期输出**:
  - HTTP 状态码：200
  - `name` 更新为 "新名称"
  - `description` 保持 "原描述" 不变
  - `slug` 保持原值不变
- **清理**: 恢复原值

### TC-015: 编辑不存在的词库
- **类型**: 异常测试
- **关联验收标准**: PUT /api/wordbanks/:id
- **前置条件**: 管理员已登录
- **输入**:
  - 请求：`PUT /api/v1/wordbanks/507f1f77bcf86cd799439011`
  - Body：`{ "name": "不存在的词库" }`
- **执行步骤**:
  1. 发送 PUT 请求到不存在的 ID
- **预期输出**:
  - HTTP 状态码：404
  - 响应体：`{ error: { code: "NOT_FOUND", message: "词库不存在" } }`
- **清理**: 无

### TC-016: 编辑词库 slug 重复（409）
- **类型**: 异常测试
- **关联验收标准**: slug 唯一性校验
- **前置条件**: 数据库存在词库 A（slug=s1）和词库 B（slug=s2）；管理员已登录；尝试将词库 A 的 slug 改为 s2
- **输入**:
  - 请求：`PUT /api/v1/wordbanks/<词库A_ID>`
  - Body：`{ "slug": "s2" }`
- **执行步骤**:
  1. 发送 PUT 请求将 slug 改为已存在的值
- **预期输出**:
  - HTTP 状态码：409
  - 响应体：`{ error: { code: "CONFLICT", message: "slug 已存在" } }`
- **清理**: 无

### TC-017: 删除词库（管理员）
- **类型**: 功能测试
- **关联验收标准**: `DELETE /api/wordbanks/:id` — 删除词库（需管理员权限）
- **前置条件**: 存在一个词库；管理员已登录
- **输入**:
  - 请求：`DELETE /api/v1/wordbanks/<wordbank_id>`
  - Header：`Authorization: Bearer <admin_token>`
- **执行步骤**:
  1. 发送 DELETE 请求
  2. 再次 GET 该词库验证已删除
- **预期输出**:
  - HTTP 状态码：200（或 204）
  - 响应体包含成功删除信息
  - 数据库查询该词库返回 null/不存在
- **清理**: 已通过删除操作清理

### TC-018: 删除词库级联删除关联单词
- **类型**: 集成测试
- **关联验收标准**: 删除词库同时删除关联单词
- **前置条件**: 存在词库 A，词库 A 下有 3 个单词；管理员已登录
- **输入**:
  - 请求：`DELETE /api/v1/wordbanks/<词库A_ID>`
  - Header：`Authorization: Bearer <admin_token>`
- **执行步骤**:
  1. 记录词库 A 下单词的 ID
  2. 发送 DELETE 请求删除词库 A
  3. 查询原词库 A 下的单词是否仍存在
- **预期输出**:
  - HTTP 状态码：200（或 204）
  - 词库 A 已被删除
  - 词库 A 下的 3 个单词全部被删除（级联删除）
  - 其他词库下的单词未受影响
- **清理**: 已通过级联删除清理

### TC-019: 非管理员删除词库被拒绝
- **类型**: 异常测试
- **关联验收标准**: DELETE /api/wordbanks/:id 需管理员权限
- **前置条件**: 普通用户已登录；存在一个词库
- **输入**:
  - 请求：`DELETE /api/v1/wordbanks/<wordbank_id>`
  - Header：`Authorization: Bearer <user_token>`
- **执行步骤**:
  1. 用普通用户 Token 发送 DELETE 请求
- **预期输出**:
  - HTTP 状态码：403
  - 响应体：`{ error: { code: "FORBIDDEN", message: "…" } }`
  - 词库仍然存在于数据库
- **清理**: 无

### TC-020: 删除不存在的词库
- **类型**: 异常测试
- **关联验收标准**: DELETE /api/wordbanks/:id
- **前置条件**: 管理员已登录
- **输入**:
  - 请求：`DELETE /api/v1/wordbanks/507f1f77bcf86cd799439011`
  - Header：`Authorization: Bearer <admin_token>`
- **执行步骤**:
  1. 发送 DELETE 请求到不存在的 ID
- **预期输出**:
  - HTTP 状态码：404
  - 响应体：`{ error: { code: "NOT_FOUND", message: "词库不存在" } }`
- **清理**: 无

### TC-021: 请求体格式异常处理
- **类型**: 边界测试
- **关联验收标准**: 错误格式统一为 `{ error: { code: string, message: string } }`
- **前置条件**: 管理员已登录
- **输入**:
  - 请求：`POST /api/v1/wordbanks`
  - Header：`Authorization: Bearer <admin_token>`
  - Body：整数 `123`（非 JSON 对象）或空字符串
- **执行步骤**:
  1. 发送非 JSON 对象请求体
- **预期输出**:
  - HTTP 状态码：400
  - 响应体：`{ error: { code: "VALIDATION_ERROR", message: "请求体格式错误" } }`
- **清理**: 无
