# Coding Prompt — Task 0.1: 后端项目脚手架初始化

## 1. 任务目标

在项目根目录下创建 `server/` 目录，初始化 Node.js + Express + TypeScript 后端项目脚手架，包含完整的目录结构、编译配置、代码规范工具和开发工作流。

## 2. 技术上下文

- **运行时**: Node.js 18+ LTS
- **语言**: TypeScript 5.x（strict 模式）
- **框架**: Express 4.x
- **包管理**: npm（前端用 pnpm，后端独立使用 npm 避免 workspace 冲突）
- **构建**: `tsc` 编译到 `dist/`，`tsx` 用于开发热重载
- **测试**: Jest + ts-jest
- **代码规范**: ESLint + Prettier，与前端风格统一（双引号、分号、箭头函数括号）

### 涉及文件（全部新建）

| 文件 | 说明 |
|------|------|
| `server/package.json` | 项目元信息 + npm scripts + 依赖声明 |
| `server/tsconfig.json` | TypeScript 编译配置 |
| `server/.eslintrc.json` | ESLint 配置 |
| `server/.prettierrc` | Prettier 配置 |
| `server/.env.example` | 环境变量模板 |
| `server/.gitignore` | Git 忽略规则 |
| `server/src/index.ts` | 入口文件 — Express 服务器启动 |
| `server/src/app.ts` | Express 应用配置（中间件、路由挂载） |
| `server/src/config/index.ts` | 环境变量读取与配置导出 |
| `server/src/routes/index.ts` | 路由汇总入口 |
| `server/src/controllers/index.ts` | 控制器层占位 |
| `server/src/services/index.ts` | 服务层占位 |
| `server/src/models/index.ts` | 模型层占位 |
| `server/src/middleware/index.ts` | 中间件层占位 |
| `server/src/utils/index.ts` | 工具函数层占位 |
| `server/README.md` | 后端项目文档 |

## 3. 实现要求

### 3.1 `server/package.json`

```json
{
  "name": "english-dictionary-server",
  "version": "1.0.0",
  "description": "英语母语者词典 — 后端 API 服务",
  "main": "dist/index.js",
  "engines": { "node": ">=18" },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --passWithNoTests"
  }
}
```

**依赖清单**:
- `dependencies`: `express`, `cors`, `dotenv`, `morgan`
- `devDependencies`: `typescript`, `tsx`, `@types/node` (^20), `@types/express`, `@types/cors`, `@types/morgan`, `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`, `jest`, `ts-jest`, `@types/jest`

> ⚠️ 注意：ADB 阶段不需要安装 `mongoose`、`bcrypt`、`jsonwebtoken` 等业务依赖，这些将在后续 Task 中按需添加。

**关键约束** (对应 TC-002, TC-014):
- `main` 指向 `dist/index.js`
- `scripts` 必须包含 `dev` / `build` / `start` / `test` 四项
- `engines.node` 声明 `>=18`
- `@types/node` 版本使用 `^20`

### 3.2 `server/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**关键约束** (对应 TC-003, TC-011):
- `strict: true`
- `target: "ES2020"` 或更高
- `module: "commonjs"`
- `outDir: "./dist"`, `rootDir: "./src"`
- `esModuleInterop: true`, `resolveJsonModule: true`
- `include` 包含 `"src/**/*"`

### 3.3 `server/.eslintrc.json`

与前端代码风格统一：双引号、分号、箭头函数括号。

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "arrow-parens": ["error", "always"],
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off"
  },
  "env": {
    "node": true,
    "es2020": true
  },
  "ignorePatterns": ["dist/", "node_modules/"]
}
```

**关键约束** (对应 TC-004, TC-012):
- `quotes: ["error", "double"]`
- `semi: ["error", "always"]`
- `arrow-parens: ["error", "always"]`
- Parser 使用 `@typescript-eslint/parser`

### 3.4 `server/.prettierrc`

```json
{
  "singleQuote": false,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**关键约束** (对应 TC-005):
- `singleQuote: false` → 双引号
- `semi: true`
- `arrowParens: "always"`
- `trailingComma: "all"`, `printWidth: 100`, `tabWidth: 2`

### 3.5 `server/.env.example`

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB（后续 Task 配置）
MONGODB_URI=mongodb://localhost:27017/english-dictionary

# JWT（后续 Task 配置）
JWT_SECRET=change-me
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

# DeepSeek AI（后续 Task 配置）
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

### 3.6 `server/.gitignore`

```
node_modules/
dist/
.env
*.log
coverage/
```

### 3.7 `server/src/config/index.ts`

- **函数签名**: 无导出函数，直接导出配置对象
- **职责**: 使用 `dotenv` 加载 `.env`，读取环境变量，导出类型安全的配置对象
- **关键逻辑**:
  1. 调用 `dotenv.config()` 加载环境变量
  2. 导出 `config` 对象包含 `port`（默认 3001）、`nodeEnv`、`mongodbUri`、`jwtSecret` 等字段
  3. 每个字段从 `process.env` 读取并提供默认值

```typescript
import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/english-dictionary",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
};
```

### 3.8 `server/src/app.ts`

- **函数签名**: `export function createApp(): Express`
- **职责**: 创建并配置 Express 应用实例（中间件、路由挂载、错误处理）
- **关键逻辑**:
  1. 创建 Express 实例
  2. 挂载 `cors()` 中间件（允许跨域，开发环境允许 `localhost:10086`）
  3. 挂载 `express.json()` 解析 JSON 请求体
  4. 挂载 `morgan("dev")` 开发日志
  5. 挂载路由汇总（`/api/v1` 前缀）
  6. 挂载全局错误处理中间件
  7. 返回 app 实例

```typescript
import express, { Express } from "express";
import cors from "cors";
import morgan from "morgan";
import { routes } from "./routes";
import { errorHandler } from "./middleware";

export function createApp(): Express {
  const app = express();

  // CORS — 开发环境允许前端 localhost:10086
  app.use(cors({
    origin: process.env.NODE_ENV === "production"
      ? ["https://english-dictionary.vercel.app"]
      : ["http://localhost:10086", "http://localhost:3001"],
    credentials: true,
  }));

  app.use(express.json());
  app.use(morgan("dev"));

  // 健康检查
  app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 路由挂载
  app.use("/api/v1", routes);

  // 全局错误处理
  app.use(errorHandler);

  return app;
}
```

### 3.9 `server/src/index.ts`

- **职责**: 入口文件，创建 app 并启动 HTTP 服务器
- **关键逻辑**:
  1. 导入 `createApp` 和 `config`
  2. 创建 app 实例
  3. 调用 `app.listen(config.port)` 启动服务器
  4. 监听 `EADDRINUSE` 错误并输出明确信息后退出 (对应 TC-010)
  5. 输出启动日志：`Server running on port ${config.port}`

```typescript
import { createApp } from "./app";
import { config } from "./config";

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});

// 端口占用处理
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${config.port} is already in use. Please free the port and try again.`);
    process.exit(1);
  }
  throw err;
});
```

### 3.10 `server/src/routes/index.ts`

- **职责**: 路由汇总，导出 Express Router
- **关键逻辑**: 创建 Router 实例，预留子路由挂载点（auth/wordbanks/words/users），暂返回 404 提示

```typescript
import { Router } from "express";

export const routes = Router();

// 子路由占位（后续 Task 实现）
// routes.use("/auth", authRoutes);
// routes.use("/wordbanks", wordbankRoutes);
// routes.use("/words", wordRoutes);
// routes.use("/users", userRoutes);

// 兜底 404
routes.all("*", (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});
```

### 3.11 `server/src/middleware/index.ts`

- **职责**: 中间件汇总导出（当前只有 errorHandler）
- **关键逻辑**:
  1. 导出 `errorHandler` — 全局错误处理中间件
  2. 格式：`{ error: { code: string, message: string } }`

```typescript
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error("Unhandled error:", err.message);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    },
  });
}
```

### 3.12 各分层目录的 `index.ts` 占位文件

为以下目录创建占位 `index.ts`，导出空对象或注释说明用途：

- `server/src/controllers/index.ts` — `// Controller layer — request handlers`
- `server/src/services/index.ts` — `// Service layer — business logic`
- `server/src/models/index.ts` — `// Model layer — Mongoose schemas (to be added in later tasks)`
- `server/src/utils/index.ts` — `// Utility functions`

**关键约束** (对应 TC-001):
- 7 个分层目录必须全部创建：`routes/`, `controllers/`, `services/`, `models/`, `middleware/`, `utils/`, `config/`
- 每个目录至少一个 `.ts` 文件（不能只是空目录）

### 3.13 `server/README.md`

```markdown
# English Dictionary — 后端 API 服务

面向中文母语者的认知语言学英语词典后端，提供 RESTful API。

## 技术栈

- Node.js 18+ / TypeScript / Express
- MongoDB Atlas + Mongoose
- JWT 认证
- DeepSeek AI 词条生成

## 目录结构

server/
├── src/
│   ├── index.ts          # 入口 — Express 服务器启动
│   ├── app.ts            # Express 应用配置
│   ├── config/           # 环境变量与配置
│   ├── routes/           # 路由层
│   ├── controllers/      # 控制器层
│   ├── services/         # 服务层（业务逻辑）
│   ├── models/           # Mongoose 数据模型
│   ├── middleware/        # 中间件（认证、权限、错误处理）
│   └── utils/            # 工具函数
├── dist/                 # TypeScript 编译输出
├── package.json
├── tsconfig.json
└── .env.example

## 本地启动

环境要求：Node.js >= 18

npm install
cp .env.example .env    # 编辑 .env 填入真实配置
npm run dev             # 开发模式，端口 3001

## 可用脚本

npm run dev     # 开发服务器（热重载）
npm run build   # TypeScript 编译
npm start       # 生产模式启动
npm test        # 运行测试
```

**关键约束** (对应 TC-013):
- 包含项目简介
- 包含目录结构说明
- 包含本地启动步骤 (`npm install` + `npm run dev`)
- 包含环境要求（Node.js >= 18）

## 4. 代码规范要求

1. **双引号**：所有字符串使用双引号
2. **分号**：所有语句末尾加分号
3. **箭头函数**：参数始终使用括号（`(x) => x` 而非 `x => x`）
4. **类型注解**：所有函数参数和返回值有显式类型
5. **async/await**：使用 async/await 而非 Promise.then
6. **文件命名**：kebab-case 文件名（如 `error-handler.ts`），但此阶段保持简单用 camelCase
7. **导入顺序**：第三方库 → 内部模块 → 类型导入
8. **导出方式**：优先 named export，入口文件可用 default export

## 5. 测试要求

代码需能通过以下测试用例（参考 [test-cases.md](./test-cases.md)）：

| 测试用例 | 验证点 |
|---------|--------|
| TC-001 | 7 个分层目录 + 占位文件完整性 |
| TC-002 | package.json 字段和 scripts 正确性 |
| TC-003 | tsconfig.json strict 模式与编译选项 |
| TC-004 | ESLint 双引号/分号/箭头函数规则 |
| TC-005 | Prettier 双引号/分号配置 |
| TC-006 | devDependencies 包含所需包 |
| TC-007 | `npm run dev` 启动 → `localhost:3001` 可访问 |
| TC-008 | `npm run build` 编译输出到 `dist/` |
| TC-009 | `npm start` 从编译产物启动 |
| TC-010 | 端口 3001 被占用时输出 EADDRINUSE 错误 |
| TC-011 | TypeScript 类型错误阻止编译 |
| TC-012 | ESLint 可用且不报 fatal error |
| TC-013 | README 包含简介/结构/启动/环境 |
| TC-014 | engines.node >= 18 + @types/node ^20 |

## 6. 执行步骤

按以下顺序逐步执行：

1. **创建 `server/` 目录**
2. **创建所有子目录**（src/ 下的 7 个分层目录）
3. **写入 `package.json`** → 执行 `npm install` 安装依赖
4. **写入 `tsconfig.json`**
5. **写入 `.eslintrc.json` 和 `.prettierrc`**
6. **写入 `.env.example` 和 `.gitignore`**
7. **写入所有源代码文件**（config、app、index、routes、middleware、各占位 index.ts）
8. **写入 `server/README.md`**
9. **验证**：确保 `npm run build` 成功，`npm run dev` 可启动

## 7. 注意事项

- ⚠️ `npm install` 需在 `server/` 目录下执行，**不是**项目根目录
- ⚠️ 前端项目在 `client/` 目录下，不要混淆 — 后端在 `server/`
- ⚠️ 不要安装 mongoose、bcrypt、jsonwebtoken 等业务依赖 — 留给后续 Task
- ⚠️ `tsx` 用于开发热重载（替代 nodemon），它是 ts-node 的现代替代品，支持 ESM
- ⚠️ CORS 开发环境 origin 要允许 `localhost:10086`（Taro H5 默认端口）
- ⚠️ 确保 `dist/` 目录在 `.gitignore` 中
- ⚠️ `npm run build` 后 `dist/` 下应包含 `index.js` 和 `app.js`（及其他编译产物）
- ⚠️ 错误响应格式统一为 `{ error: { code: string, message: string } }`
