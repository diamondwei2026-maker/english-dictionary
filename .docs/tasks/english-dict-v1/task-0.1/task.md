# Task 0.1: 后端项目脚手架初始化

| 属性 | 值 |
|------|-----|
| ID | 0.1 |
| 状态 | done |
| 优先级 | P0 |
| 依赖 | 无 |
| 阶段 | 阶段0: 架构决策与项目初始化 |
| 预估工时 | 2-3 小时 |

## 描述

根据 `.docs/adr/server.md` 的技术选型决策，搭建后端项目脚手架。创建 `server/` 目录，初始化 Node.js/TypeScript 项目，安装核心依赖，配置 TypeScript 编译选项，建立清晰的分层目录结构。

当前状态：ADR 已确定技术栈，前端 Taro 项目在 `src/` 目录下运行正常。本任务是后端开发的起点。

## 验收标准

- [ ] `server/` 目录创建完成，具有清晰的分层结构（routes / controllers / services / models / middleware / utils / config）
- [ ] `package.json` 初始化完成，包含项目元信息和 npm scripts（dev / build / start / test）
- [ ] TypeScript 编译配置 `tsconfig.json` 就绪，strict 模式开启
- [ ] ESLint + Prettier 配置就绪，与前端代码风格统一（双引号、分号、箭头函数）
- [ ] 开发依赖安装完成（typescript, ts-node / tsx, nodemon, eslint, prettier, jest）
- [ ] `npm run dev` 可启动开发服务器并监听端口（默认 3001）
- [ ] 项目根目录 `README.md` 或 `server/README.md` 简要说明后端项目结构和启动方式

## 子任务

### SUB-0.1.1: 初始化 Node.js 项目
- **描述**: 在 `server/` 目录下执行 `npm init`，创建 `package.json`，安装 TypeScript 及相关开发依赖
- **验收标准**:
  - [ ] `server/package.json` 存在且配置正确
  - [ ] `tsconfig.json` 配置完成（target: ES2020, module: commonjs, strict: true）
  - [ ] ESLint + Prettier 配置与前端项目风格一致

### SUB-0.1.2: 创建分层目录结构
- **描述**: 按 ADR 架构设计创建目录结构，每个目录含 `.gitkeep` 或 `index.ts` 占位
- **验收标准**:
  - [ ] `routes/`、`controllers/`、`services/`、`models/`、`middleware/`、`utils/`、`config/` 目录全部创建
  - [ ] 入口文件 `server/src/index.ts` 可启动 Express/Fastify 服务器

### SUB-0.1.3: 配置开发工作流
- **描述**: 配置 npm scripts（dev/build/start/test）和 nodemon 自动重启
- **验收标准**:
  - [ ] `npm run dev` 启动开发服务器，文件变更自动重启
  - [ ] `npm run build` 编译 TypeScript 到 `dist/` 目录
  - [ ] `npm start` 从编译产物启动生产服务器

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
