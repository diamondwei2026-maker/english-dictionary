# 测试用例 — Task 0.1: 后端项目脚手架初始化

## 测试范围分析

| 维度 | 覆盖内容 |
|------|---------|
| 功能测试 | 目录结构、配置文件正确性、服务器启动 |
| 边界测试 | Node.js 版本兼容、端口占用处理 |
| 异常测试 | 缺少依赖时启动失败、TS 编译错误拦截 |
| 集成测试 | TypeScript 编译 + Express 启动 + 端口监听联动 |

---

## 测试用例

### TC-001: 分层目录结构完整性检查
- **类型**: 功能测试
- **关联验收标准**: AC-1
- **前置条件**: 项目初始化脚本已执行（`npm install` 完成）
- **输入**:
  - 检查路径：`server/src/` 下的子目录
- **执行步骤**:
  1. 进入 `server/` 目录
  2. 验证 `server/src/` 存在
  3. 逐一检查以下目录均已创建：
     - `server/src/routes/`
     - `server/src/controllers/`
     - `server/src/services/`
     - `server/src/models/`
     - `server/src/middleware/`
     - `server/src/utils/`
     - `server/src/config/`
- **预期输出**:
  - 7 个分层子目录全部存在
  - 每个目录至少含一个占位文件（`.gitkeep` 或 `index.ts`）
- **清理**: 无

---

### TC-002: package.json 配置正确性
- **类型**: 功能测试
- **关联验收标准**: AC-2
- **前置条件**: 项目已初始化
- **输入**:
  - 读取 `server/package.json`
- **执行步骤**:
  1. 读取 `server/package.json` 内容
  2. 检查 `name` 字段存在且非空
  3. 检查 `scripts` 字段包含 `dev`、`build`、`start`、`test` 四项
  4. 检查 `main` 字段指向入口文件（如 `dist/index.js` 或 `src/index.ts`）
- **预期输出**:
  - `name` 字段：合理项目名称（如 `english-dictionary-server`）
  - `scripts.dev`：存在（如 `nodemon src/index.ts` 或 `tsx watch src/index.ts`）
  - `scripts.build`：存在（如 `tsc` 或 `tsc -p tsconfig.json`）
  - `scripts.start`：存在（如 `node dist/index.js`）
  - `scripts.test`：存在（如 `jest` 或 `jest --passWithNoTests`）
- **清理**: 无

---

### TC-003: TypeScript 编译配置正确性
- **类型**: 功能测试
- **关联验收标准**: AC-3
- **前置条件**: `server/tsconfig.json` 已创建
- **输入**:
  - 读取 `server/tsconfig.json`
- **执行步骤**:
  1. 读取 `server/tsconfig.json` 内容
  2. 验证 `compilerOptions.strict` 为 `true`
  3. 验证 `compilerOptions.target` 为 `ES2020` 或更高
  4. 验证 `compilerOptions.module` 为 `commonjs`
  5. 验证 `compilerOptions.outDir` 指向 `dist`（或合理编译输出目录）
  6. 验证 `compilerOptions.rootDir` 指向 `src`
  7. 验证 `compilerOptions.esModuleInterop` 为 `true`
  8. 验证 `compilerOptions.resolveJsonModule` 为 `true`
  9. 验证 `include` 字段包含 `src/**/*`
- **预期输出**:
  - `strict: true` ✓
  - `target: "ES2020"`（或更高如 "ES2022"）
  - `module: "commonjs"`
  - `outDir: "./dist"`
  - `rootDir: "./src"`
  - `esModuleInterop: true`
  - `include` 包含 `"src/**/*"`
- **清理**: 无

---

### TC-004: ESLint 配置与前端风格统一
- **类型**: 功能测试
- **关联验收标准**: AC-4
- **前置条件**: `server/.eslintrc.json`（或 `.eslintrc.js`、`eslint.config.js`）已创建
- **输入**:
  - 读取 ESLint 配置文件
  - 读取前端 ESLint 配置文件（如 `src/` 下或项目根目录）
- **执行步骤**:
  1. 读取 `server/` 下的 ESLint 配置文件
  2. 读取前端 ESLint 配置文件作为对照（检查 `D:\Users\weij\english-dictionary\.eslintrc` 或 `eslint.config.js` 或 `package.json` 中的 eslintConfig）
  3. 验证 `quotes` 规则：必须为 `"double"`（双引号）
  4. 验证 `semi` 规则：必须要求分号
  5. 验证 `arrow-parens` 规则：箭头函数参数使用括号（与前端统一）
  6. 验证 `@typescript-eslint` parser 已配置
- **预期输出**:
  - 引号规则：`"double"`（与前端一致）
  - 分号规则：`"always"` 或 `"error"`（与前端一致）
  - Parser：`@typescript-eslint/parser`
  - 如前端有 Prettier 配置，`server/` 下也应有一致的 `.prettierrc` 或 `package.json` 中的 prettier 配置
- **清理**: 无

---

### TC-005: Prettier 配置与前端统一
- **类型**: 功能测试
- **关联验收标准**: AC-4
- **前置条件**: `server/.prettierrc`（或 `server/package.json` 中的 `prettier` 字段）已创建
- **输入**:
  - 读取 `server/` 下的 Prettier 配置文件
  - 读取前端 Prettier 配置文件作为对照
- **执行步骤**:
  1. 读取 `server/.prettierrc`
  2. 读取前端 Prettier 配置（`D:\Users\weij\english-dictionary\.prettierrc` 或 `package.json` 中的 prettier 字段）
  3. 验证 `singleQuote` 为 `false`（双引号）
  4. 验证 `semi` 为 `true`
  5. 验证 `trailingComma`、`printWidth`、`tabWidth` 与前端一致
- **预期输出**:
  - `singleQuote: false`
  - `semi: true`
  - 其他字段与前端配置一致
- **清理**: 无

---

### TC-006: 开发依赖安装验证
- **类型**: 功能测试
- **关联验收标准**: AC-5
- **前置条件**: `npm install` 已完成
- **输入**:
  - 读取 `server/package.json` 的 `devDependencies`
- **执行步骤**:
  1. 读取 `server/package.json`
  2. 检查 `devDependencies` 中是否包含：
     - `typescript`
     - `ts-node` 或 `tsx`（至少一个 TS 执行器）
     - `nodemon` 或 `ts-node-dev`（开发热重载工具）
     - `eslint`
     - `prettier`
     - `jest` 或 `vitest`（测试框架）
  3. 检查 `dependencies` 中包含 `express`
  4. 验证 `node_modules/` 目录存在（依赖已实际安装）
- **预期输出**:
  - `devDependencies` 包含以上列出的所有包
  - `dependencies` 包含 `express`
  - `server/node_modules/` 目录存在且非空
- **清理**: 无

---

### TC-007: npm run dev 启动开发服务器
- **类型**: 功能测试
- **关联验收标准**: AC-6
- **前置条件**:
  - 所有依赖已安装
  - `server/src/index.ts` 入口文件存在，启动 Express 并监听指定端口
  - 端口 3001 未被占用
- **输入**:
  - 执行命令：`npm run dev`
- **执行步骤**:
  1. 进入 `server/` 目录
  2. 执行 `npm run dev`（后台运行）
  3. 等待服务器启动完成（约 3-5 秒）
  4. 向 `http://localhost:3001` 发送 HTTP GET 请求
  5. 关闭开发服务器
- **预期输出**:
  - 终端输出包含端口监听日志（如 `Server running on port 3001`）
  - HTTP GET `http://localhost:3001` 返回非 5xx 响应（200 OK、404 或任何有效 HTTP 响应）
  - 进程不报错退出
- **清理**: 终止 `npm run dev` 进程

---

### TC-008: npm run build TypeScript 编译
- **类型**: 功能测试
- **关联验收标准**: AC-2（`build` 脚本可达）
- **前置条件**:
  - 所有依赖已安装
  - `tsconfig.json` 配置正确
  - `server/src/` 下有至少一个 `.ts` 文件
- **输入**:
  - 执行命令：`npm run build`
- **执行步骤**:
  1. 进入 `server/` 目录
  2. 执行 `npm run build`
  3. 检查 `server/dist/` 目录
- **预期输出**:
  - 命令执行成功（exit code 0）
  - `server/dist/` 目录被创建
  - `dist/` 下包含编译后的 `.js` 文件（至少 `index.js` 和 `app.js`）
- **清理**: 删除 `server/dist/` 目录

---

### TC-009: npm start 生产启动
- **类型**: 功能测试
- **关联验收标准**: AC-2（`start` 脚本可达）
- **前置条件**:
  - `npm run build` 已成功执行
  - `dist/` 目录存在且包含编译产物
- **输入**:
  - 执行命令：`npm start`
- **执行步骤**:
  1. 进入 `server/` 目录
  2. 执行 `npm run build`
  3. 执行 `npm start`（后台运行）
  4. 向 `http://localhost:3001` 发送 HTTP GET 请求
  5. 关闭服务器
- **预期输出**:
  - `npm start` 成功启动（无编译步骤，直接执行 JS）
  - HTTP GET 请求返回有效响应
  - 进程正常退出
- **清理**: 终止 `npm start` 进程；删除 `dist/` 目录

---

### TC-010: 端口 3001 被占用时的错误处理
- **类型**: 异常测试
- **关联验收标准**: AC-6
- **前置条件**:
  - 端口 3001 已被其他进程占用（或手动启动两个实例模拟）
- **输入**:
  - 先占用端口 3001，再执行 `npm run dev`
- **执行步骤**:
  1. 启动第一个开发服务器实例占用端口 3001
  2. 启动第二个实例尝试监听同一端口
  3. 观察第二个实例的输出
- **预期输出**:
  - 第二个实例输出包含端口占用相关错误（如 `EADDRINUSE`）
  - 进程退出并返回非零 exit code，或输出明确错误信息后退出
  - 不出现静默失败或无限挂起
- **清理**: 关闭所有实例

---

### TC-011: TypeScript 类型错误阻止编译
- **类型**: 异常测试
- **关联验收标准**: AC-3（strict 模式）
- **前置条件**:
  - `tsconfig.json` 已配置 strict 模式
  - 源代码中存在类型错误
- **输入**:
  - 临时在 `server/src/index.ts` 中引入类型错误（如 `const x: number = "hello"`）
- **执行步骤**:
  1. 在入口文件中添加一行类型错误代码
  2. 执行 `npx tsc --noEmit`（或 `npm run build`）
  3. 恢复文件到原始内容
- **预期输出**:
  - `tsc` 命令报错并指出错误位置和原因
  - exit code 非零
  - 严格模式下所有类型不匹配都会报错
- **清理**: 恢复被修改的源文件

---

### TC-012: ESLint 规则检查可拦截风格违规
- **类型**: 功能测试
- **关联验收标准**: AC-4
- **前置条件**:
  - ESLint 配置正确
  - 有可检查的源文件
- **输入**:
  - 执行 `npx eslint src/ --ext .ts`
- **执行步骤**:
  1. 进入 `server/` 目录
  2. 执行 `npx eslint src/ --ext .ts`
  3. 检查输出
- **预期输出**:
  - ESLint 正常执行不报错（说明配置可用）
  - 如有格式违规，输出违规位置和规则名
  - 不会因配置缺失而崩溃或报 fatal error
- **清理**: 无

---

### TC-013: README 文档完整性
- **类型**: 功能测试
- **关联验收标准**: AC-7
- **前置条件**: 项目脚手架已搭建完成
- **输入**:
  - 读取 `server/README.md` 或项目根目录 `README.md`
- **执行步骤**:
  1. 检查 `server/README.md` 是否存在；如不存在，检查根目录 `README.md` 中是否包含后端相关内容
  2. 阅读内容，检查是否包含：
     - 项目简介（后端用途说明）
     - 目录结构说明
     - 本地启动方式（`npm install` + `npm run dev`）
     - 所需环境（Node.js 18+）
- **预期输出**:
  - README 文件存在
  - 包含项目简介、目录结构、启动方式、环境要求
- **清理**: 无

---

### TC-014: Node.js 最低版本兼容性
- **类型**: 边界测试
- **关联验收标准**: AC-2（package.json 中的 engines 声明）
- **前置条件**: `server/package.json` 已创建
- **输入**:
  - 读取 `server/package.json`
- **执行步骤**:
  1. 读取 `server/package.json`
  2. 检查 `engines.node` 字段是否声明 `>=18` 或 `>=18.0.0`
  3. 检查 `@types/node` 版本是否匹配 Node.js 18+
- **预期输出**:
  - `engines.node` 声明 `>=18` 或 `>=18.0.0`
  - `@types/node` devDependency 版本为 `^18` 或 `^20`
- **清理**: 无

---

## 测试用例汇总

| 编号 | 名称 | 类型 | 关联 AC |
|------|------|------|---------|
| TC-001 | 分层目录结构完整性检查 | 功能测试 | AC-1 |
| TC-002 | package.json 配置正确性 | 功能测试 | AC-2 |
| TC-003 | TypeScript 编译配置正确性 | 功能测试 | AC-3 |
| TC-004 | ESLint 配置与前端风格统一 | 功能测试 | AC-4 |
| TC-005 | Prettier 配置与前端统一 | 功能测试 | AC-4 |
| TC-006 | 开发依赖安装验证 | 功能测试 | AC-5 |
| TC-007 | npm run dev 启动开发服务器 | 功能测试 | AC-6 |
| TC-008 | npm run build TypeScript 编译 | 功能测试 | AC-2 |
| TC-009 | npm start 生产启动 | 功能测试 | AC-2 |
| TC-010 | 端口 3001 被占用时的错误处理 | 异常测试 | AC-6 |
| TC-011 | TypeScript 类型错误阻止编译 | 异常测试 | AC-3 |
| TC-012 | ESLint 规则检查可拦截风格违规 | 功能测试 | AC-4 |
| TC-013 | README 文档完整性 | 功能测试 | AC-7 |
| TC-014 | Node.js 最低版本兼容性 | 边界测试 | AC-2 |

**共 14 个测试用例**

| 类型 | 数量 |
|------|------|
| 功能测试 | 11 |
| 异常测试 | 2 |
| 边界测试 | 1 |
