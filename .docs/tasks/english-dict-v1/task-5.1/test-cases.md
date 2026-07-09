# 测试用例 — Task 5.1: 学习记录与收藏功能

## TC-001: 记录学习 — 首次学习某单词
- **类型**: 功能测试
- **关联验收标准**: AC-1（POST /api/words/:id/learn — 记录用户学习该单词）
- **前置条件**:
  - 用户已登录，token 有效
  - 目标单词存在于数据库中（wordId: `60f7c1a2b3c4d5e6f7a8b9c0`）
  - 该用户之前未学习过该单词
- **输入**:
  - `POST /api/v1/words/60f7c1a2b3c4d5e6f7a8b9c0/learn`
  - Headers: `Authorization: Bearer <valid_token>`
- **执行步骤**:
  1. 以登录用户身份发起 POST 请求
  2. 查询数据库中 LearningRecord 集合
  3. 查询 User 集合中 learnedWords 数组
- **预期输出**:
  - HTTP 状态码：200
  - 响应体含 `{ learnCount: 1, lastLearnedAt: "<ISO时间>" }`
  - 数据库 `LearningRecord` 集合新增一条记录：`learnCount=1`、`lastLearnedAt` 为当前时间
  - 数据库 `User.learnedWords` 数组新增该 wordId
- **清理**: 删除刚创建的 LearningRecord，移除 User.learnedWords 中的 wordId

## TC-002: 记录学习 — 重复学习同一单词（累计次数）
- **类型**: 功能测试
- **关联验收标准**: AC-1（累计学习次数）
- **前置条件**:
  - 用户已登录
  - 用户已学习过该单词 1 次（learnCount=1，lastLearnedAt 为昨天）
- **输入**:
  - `POST /api/v1/words/60f7c1a2b3c4d5e6f7a8b9c0/learn`
- **执行步骤**:
  1. 再次发起 POST 请求
  2. 查询 LearningRecord
- **预期输出**:
  - HTTP 状态码：200
  - `learnCount` 从 1 变为 2
  - `lastLearnedAt` 更新为当前时间
  - `User.learnedWords` 不重复添加（SET 语义）
- **清理**: 重置 learnCount 为 1

## TC-003: 记录学习 — 未登录用户被拒绝
- **类型**: 异常测试
- **关联验收标准**: AC-1（需登录）
- **前置条件**:
  - 未携带 token 或 token 无效
- **输入**:
  - `POST /api/v1/words/60f7c1a2b3c4d5e6f7a8b9c0/learn`
  - 无 Authorization header
- **执行步骤**:
  1. 不带 token 发起请求
- **预期输出**:
  - HTTP 状态码：401
  - 响应体含 error 信息
  - 数据库无变化
- **清理**: 无

## TC-004: 记录学习 — 单词不存在
- **类型**: 异常测试
- **关联验收标准**: AC-1
- **前置条件**:
  - 用户已登录
  - wordId 为不存在的 24 位 hex ObjectId（如 `000000000000000000000000`）
- **输入**:
  - `POST /api/v1/words/000000000000000000000000/learn`
- **执行步骤**:
  1. 发起请求
- **预期输出**:
  - HTTP 状态码：404
  - 响应体 `{ error: { code: "WORD_NOT_FOUND", message: "单词不存在" } }`
- **清理**: 无

## TC-005: 获取学习记录列表
- **类型**: 功能测试
- **关联验收标准**: AC-2（GET /api/user/learning-records — 按最近学习时间排序）
- **前置条件**:
  - 用户已登录
  - 该用户有 3 条学习记录，分别学习了 wordA（3 次，昨天学）、wordB（1 次，今天学）、wordC（5 次，3 天前学）
- **输入**:
  - `GET /api/v1/user/learning-records?page=1&pageSize=20`
- **执行步骤**:
  1. 发起 GET 请求
  2. 检查返回列表顺序
- **预期输出**:
  - HTTP 状态码：200
  - 响应体含 `data` 数组，第一条为 wordB（今天学）、第二条为 wordA（昨天学）、第三条为 wordC（3 天前学）
  - 每条记录含 `wordId`、`word`（单词名）、`learnCount`、`lastLearnedAt`
  - 分页信息正确
- **清理**: 无

## TC-006: 获取用户学习统计
- **类型**: 功能测试
- **关联验收标准**: AC-3（GET /api/user/stats — 已学单词数、学习天数、今日学习数）
- **前置条件**:
  - 用户已登录
  - 共学习了 10 个不同的单词
  - 其中 3 个是今天学习的（lastLearnedAt 在今天）
  - 最早学习记录是 5 天前，中间有 2 天无学习（学习天数 = 3 天）
- **输入**:
  - `GET /api/v1/user/stats`
- **执行步骤**:
  1. 发起 GET 请求
- **预期输出**:
  - HTTP 状态码：200
  - 响应体：
    - `totalWordsLearned: 10`
    - `totalLearningDays: 3`（有学习记录的不同日期数）
    - `todayLearnedCount: 3`（今天学习的单词数）
    - `totalLearnCount: 22`（所有记录的 learnCount 总和，可选）
- **清理**: 无

## TC-007: 收藏单词 — 正常收藏
- **类型**: 功能测试
- **关联验收标准**: AC-4（POST /api/words/:id/favorite — 收藏单词）
- **前置条件**:
  - 用户已登录
  - 目标单词存在
  - 该单词未被该用户收藏
- **输入**:
  - `POST /api/v1/words/60f7c1a2b3c4d5e6f7a8b9c0/favorite`
- **执行步骤**:
  1. 发起 POST 请求
  2. 查询 UserFavorite 集合和 User.favoriteWords
- **预期输出**:
  - HTTP 状态码：201
  - 响应体 `{ favorited: true }`
  - `UserFavorite` 新增一条记录
  - `User.favoriteWords` 数组新增该 wordId
- **清理**: 删除收藏记录

## TC-008: 取消收藏
- **类型**: 功能测试
- **关联验收标准**: AC-5（DELETE /api/words/:id/favorite — 取消收藏）
- **前置条件**:
  - 用户已登录
  - 该单词已被该用户收藏
- **输入**:
  - `DELETE /api/v1/words/60f7c1a2b3c4d5e6f7a8b9c0/favorite`
- **执行步骤**:
  1. 发起 DELETE 请求
  2. 查询 UserFavorite 集合
- **预期输出**:
  - HTTP 状态码：200
  - 响应体 `{ favorited: false }`
  - `UserFavorite` 记录被删除
  - `User.favoriteWords` 中移除该 wordId
- **清理**: 无

## TC-009: 重复收藏 — 幂等处理
- **类型**: 边界测试
- **关联验收标准**: AC-4
- **前置条件**:
  - 用户已登录
  - 该单词已被该用户收藏
- **输入**:
  - `POST /api/v1/words/60f7c1a2b3c4d5e6f7a8b9c0/favorite`
- **执行步骤**:
  1. 再次发起收藏请求
- **预期输出**:
  - HTTP 状态码：200（幂等，不报 409 冲突）
  - 响应体 `{ favorited: true }`（已是收藏状态）
  - 数据库中无重复记录
- **清理**: 无

## TC-010: 获取收藏列表 — 分页
- **类型**: 功能测试
- **关联验收标准**: AC-6（GET /api/user/favorites — 获取用户收藏单词列表）
- **前置条件**:
  - 用户已登录
  - 用户收藏了 5 个单词
- **输入**:
  - `GET /api/v1/user/favorites?page=1&pageSize=3`
- **执行步骤**:
  1. 发起请求获取第 1 页（每页 3 条）
  2. 再请求第 2 页
- **预期输出**:
  - 第 1 页：HTTP 200，`data` 数组长度 3，`pagination.total = 5`，`pagination.totalPages = 2`
  - 第 2 页：HTTP 200，`data` 数组长度 2
  - 每条收藏含完整的单词信息（通过 populate）
- **清理**: 无

## TC-011: 单词详情返回 is_favorited 和 learn_count
- **类型**: 集成测试
- **关联验收标准**: AC-7（GET /api/words/:id 响应中增加 is_favorited、learn_count 字段）
- **前置条件**:
  - 用户 A 已登录，收藏了单词 X，学习了单词 X 3 次
  - 用户 B 未登录（或未收藏+未学习单词 X）
- **输入**:
  - 用户 A: `GET /api/v1/words/<word_x_id>`
  - 用户 B: `GET /api/v1/words/<word_x_id>`
- **执行步骤**:
  1. 用户 A（已登录）请求单词 X 详情
  2. 未登录用户请求同一单词
- **预期输出**:
  - 用户 A 响应含 `isFavorited: true`、`learnCount: 3`
  - 未登录用户响应含 `isFavorited: false`、`learnCount: 0`
  - 两个响应均不含其他用户的私有数据
- **清理**: 无

## TC-012: 前端收藏按钮 — 点击切换收藏状态
- **类型**: 功能测试
- **关联验收标准**: AC-8（前端单词详情页展示收藏按钮，调用真实 API）
- **前置条件**:
  - 用户已登录，浏览单词详情页
  - 单词当前未被收藏
- **输入**:
  - 点击收藏按钮
- **执行步骤**:
  1. 点击收藏按钮（空心/未选中状态）
  2. 观察 UI 和网络请求
  3. 再次点击收藏按钮
- **预期输出**:
  - 首次点击：发起 `POST /api/v1/words/:id/favorite`，按钮变为实心/已收藏状态
  - 再次点击：发起 `DELETE /api/v1/words/:id/favorite`，按钮恢复空心/未收藏状态
  - 网络请求期间按钮不重复触发
  - 操作失败时展示 Toast 错误提示，按钮状态回滚
- **清理**: 清理收藏状态

## TC-013: 前端用户中心 — 展示学习统计
- **类型**: 功能测试
- **关联验收标准**: AC-9（前端用户中心展示学习统计）
- **前置条件**:
  - 用户已登录，有一定学习记录
  - 已学 10 个单词，今日学习 3 个
- **输入**:
  - 进入用户中心/个人页
- **执行步骤**:
  1. 导航到个人中心页面
  2. 观察学习统计区域
- **预期输出**:
  - 显示"已学单词: 10"
  - 显示"今日已学: 3"
  - 数据来自 `GET /api/v1/user/stats`
  - 加载中显示骨架屏或 loading 状态
  - 加载失败时显示友好的错误提示+重试按钮
- **清理**: 无

## TC-014: 前端用户中心 — 展示收藏列表
- **类型**: 功能测试
- **关联验收标准**: AC-9
- **前置条件**:
  - 用户已登录，收藏了 5 个单词
- **输入**:
  - 进入用户中心"我的收藏"区域
- **执行步骤**:
  1. 导航到个人中心
  2. 切换到收藏列表 tab 或滚动到收藏区域
  3. 点击其中一个单词
- **预期输出**:
  - 展示收藏单词列表，每条显示单词名和核心义摘要
  - 数据来自 `GET /api/v1/user/favorites`
  - 点击单词跳转到单词详情页
  - 空收藏时展示"暂无收藏，去词库看看吧"引导文案
- **清理**: 无

## TC-015: 浏览单词自动记录学习
- **类型**: 功能测试
- **关联验收标准**: AC-9（浏览单词自动记录学习）
- **前置条件**:
  - 用户已登录
  - 前端单词详情页已加载
- **输入**:
  - 进入单词详情页（单词 X）
- **执行步骤**:
  1. 从词库列表点击进入单词 X 的详情页
  2. 观察网络请求
  3. 查看用户学习统计变化
- **预期输出**:
  - 页面加载后自动调用 `POST /api/v1/words/:id/learn`
  - 请求在后台静默执行，不影响页面渲染
  - 学习统计中该单词的 learnCount 增加 1
  - 如果已在本次会话中学习过，不重复调用（去重，5 分钟内不重复记录）
- **清理**: 重置学习记录

## TC-016: 未登录用户收藏按钮交互
- **类型**: 边界测试
- **关联验收标准**: AC-8
- **前置条件**:
  - 用户未登录
  - 浏览单词详情页
- **输入**:
  - 点击收藏按钮
- **执行步骤**:
  1. 未登录状态下点击收藏按钮
- **预期输出**:
  - 不发起 API 请求
  - 提示"请先登录"或跳转到登录页
  - 按钮保持未收藏状态
- **清理**: 无

---

## 测试用例统计

| 类型 | 数量 |
|------|------|
| 功能测试 | 10（TC-001, 002, 005, 006, 007, 008, 010, 012, 013, 014, 015） |
| 边界测试 | 2（TC-009, 016） |
| 异常测试 | 3（TC-003, 004） |
| 集成测试 | 1（TC-011） |
| 合计 | 16 |

## 覆盖的验收标准

| 验收标准 | 对应测试用例 |
|----------|-------------|
| AC-1: POST /api/words/:id/learn | TC-001, 002, 003, 004 |
| AC-2: GET /api/user/learning-records | TC-005 |
| AC-3: GET /api/user/stats | TC-006 |
| AC-4: POST /api/words/:id/favorite | TC-007, 009 |
| AC-5: DELETE /api/words/:id/favorite | TC-008 |
| AC-6: GET /api/user/favorites | TC-010 |
| AC-7: 单词详情返回 is_favorited, learn_count | TC-011 |
| AC-8: 前端收藏按钮 | TC-012, 016 |
| AC-9: 前端用户中心+自动记录 | TC-013, 014, 015 |
