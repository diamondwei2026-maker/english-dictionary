# Task 3.2: 单词 CRUD API 与管理后台权限

| 属性 | 值 |
|------|-----|
| ID | 3.2 |
| 状态 | pending |
| 优先级 | P0 |
| 依赖 | Task 3.1 |
| 阶段 | 阶段3: 词库与单词 CRUD |
| 预估工时 | 3-4 小时 |

## 描述

实现单词（Word）的完整 CRUD API，包括单词的引申义（ExtendedMeaning）和搭配（Collocation）作为嵌套资源。管理后台的写操作受 adminMiddleware 保护。搜索功能支持按单词名模糊搜索。

## 验收标准

- [ ] `GET /api/words` — 单词列表，支持按词库筛选（wordbank_id）、关键词搜索（q）、分页
- [ ] `GET /api/words/:id` — 单词详情，包含完整引申义链和搭配列表
- [ ] `POST /api/words` — 新增单词（需管理员），接收 name、phonetic、physical_image、core_meaning 及嵌套的 extended_meanings、collocations
- [ ] `PUT /api/words/:id` — 编辑单词（需管理员），支持嵌套资源的增删改
- [ ] `DELETE /api/words/:id` — 删除单词（需管理员），级联删除引申义和搭配
- [ ] `GET /api/wordbanks/:id/words` — 按词库获取单词列表
- [ ] 关键词搜索支持按单词名模糊匹配（LIKE %keyword%）
- [ ] 所有写操作受 adminMiddleware 保护
- [ ] 单词名在同一个词库内唯一

## 子任务

### SUB-3.2.1: 单词查询接口
- **描述**: 实现单词列表和详情查询
- **验收标准**:
  - [ ] 列表支持筛选、搜索、分页
  - [ ] 详情包含嵌套的引申义（按 meaning_order 排序）和搭配
  - [ ] 搜索结果高亮/相关度排序

### SUB-3.2.2: 单词写操作接口
- **描述**: 实现单词新增、编辑、删除
- **验收标准**:
  - [ ] 新增支持嵌套创建引申义和搭配（一个请求完成）
  - [ ] 编辑支持更新主字段 + 嵌套资源的增删改
  - [ ] 删除级联处理关联数据

### SUB-3.2.3: 管理后台权限集成
- **描述**: 确保所有写操作路由使用 adminMiddleware 保护
- **验收标准**:
  - [ ] 非管理员访问写接口 → 403
  - [ ] 管理员可正常操作
  - [ ] 读接口无需管理员权限（公开）

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
