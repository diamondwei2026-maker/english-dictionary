# English Dictionary — 后端 API 服务

面向中文母语者的认知语言学英语词典后端，提供 RESTful API。

## 技术栈

- Node.js 18+ / TypeScript / Express
- MongoDB Atlas + Mongoose
- JWT 认证
- DeepSeek AI 词条生成

## 目录结构

```
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
```

## 本地启动

环境要求：Node.js >= 18

```bash
npm install
cp .env.example .env    # 编辑 .env 填入真实配置
npm run dev             # 开发模式，端口 3001
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器（热重载） |
| `npm run build` | TypeScript 编译 |
| `npm start` | 生产模式启动 |
| `npm test` | 运行测试 |
