import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./index.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "英语母语者词典 API",
      version: "1.0.0",
      description:
        "面向中文母语者的认知语言学英语词典后端 API。以物理意象（Physical Image）为切入点，帮助用户从原初的物理感知理解英语词汇。",
    },
    servers: [
      { url: `http://localhost:${config.port}`, description: "本地开发环境" },
      {
        url: "https://english-dictionary.onrender.com",
        description: "生产环境（Render）",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "在登录接口获取 Token，格式：Bearer <token>",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
            username: { type: "string", example: "张三" },
            phone: { type: "string", example: "13800138000" },
            role: { type: "string", enum: ["user", "admin"], example: "user" },
            learnedWords: {
              type: "array",
              items: { type: "string" },
              example: [],
            },
            favoriteWords: {
              type: "array",
              items: { type: "string" },
              example: [],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        WordBank: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
            name: { type: "string", example: "核心动词" },
            slug: { type: "string", example: "core-verbs" },
            description: { type: "string", example: "涵盖最常用的英语核心动词" },
            cover_image: { type: "string", example: "" },
            gradient: {
              type: "string",
              example: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            },
            is_public: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ExtendedMeaning: {
          type: "object",
          properties: {
            _id: { type: "string" },
            evolutionDescription: {
              type: "string",
              example: '从“握住”到“理解”——抓住一个概念如同抓住一个物体',
            },
            meaning: { type: "string", example: "理解，领会" },
            partOfSpeech: {
              type: "string",
              enum: ["noun", "verb", "adj", "adv", "prep", "conj", "pron", "other"],
              example: "verb",
            },
            exampleEn: { type: "string", example: "I can't grasp what you're saying." },
            exampleZh: { type: "string", example: "我无法理解你在说什么。" },
          },
        },
        Word: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
            word: { type: "string", example: "grasp" },
            wordbankId: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
            phonetic: { type: "string", example: "/ɡrɑːsp/" },
            coreMeaning: { type: "string", example: "抓，握" },
            coreExampleEn: { type: "string", example: "She grasped the rope firmly." },
            coreExampleZh: { type: "string", example: "她牢牢地抓住绳子。" },
            physicalImageType: {
              type: "string",
              enum: ["flow", "grasp", "break", "bear", "drive", "light", "leverage", "yield"],
              example: "grasp",
            },
            physicalImageDescription: {
              type: "string",
              example: "用手或工具紧紧抓住某个物体",
            },
            extendedMeanings: {
              type: "array",
              items: { $ref: "#/components/schemas/ExtendedMeaning" },
            },
            collocations: {
              type: "array",
              items: { type: "string" },
              example: ["grasp firmly", "grasp the concept"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string", example: "请求参数校验失败" },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 100 },
            totalPages: { type: "integer", example: 5 },
          },
        },
      },
    },
    security: [],
    tags: [
      { name: "Auth", description: "用户认证" },
      { name: "Users", description: "用户信息与学习记录" },
      { name: "Wordbanks", description: "词库管理" },
      { name: "Words", description: "单词管理" },
      { name: "AI", description: "AI 词条生成" },
      { name: "Daily Word", description: "今日一词" },
      { name: "Dashboard", description: "管理后台" },
      { name: "Health", description: "健康检查" },
    ],
    paths: {
      // ==================== Auth ====================
      "/api/v1/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "用户注册",
          description: "使用邮箱和密码注册新账号",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "email", "password"],
                  properties: {
                    username: { type: "string", example: "张三" },
                    email: { type: "string", format: "email", example: "zhangsan@example.com" },
                    password: { type: "string", format: "password", minLength: 6, example: "password123" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "注册成功",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            "409": {
              description: "邮箱已注册",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/api/v1/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "用户登录",
          description: "使用邮箱和密码登录，返回 JWT Token。接口限流：10次/分钟/IP。",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email", example: "zhangsan@example.com" },
                    password: { type: "string", format: "password", example: "password123" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "登录成功",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            "401": {
              description: "认证失败",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
            "429": {
              description: "请求过于频繁",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },

      // ==================== Users ====================
      "/api/v1/users/me": {
        get: {
          tags: ["Users"],
          summary: "当前用户信息",
          description: "获取当前登录用户的详细信息。🔒 需认证。",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "成功",
              content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
            },
            "401": {
              description: "未认证",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
      },
      "/api/v1/users/stats": {
        get: {
          tags: ["Users"],
          summary: "用户学习统计",
          description: "获取当前用户的学习统计数据。🔒 需认证。",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "成功",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      learnedWords: { type: "integer", example: 42 },
                      studiedDays: { type: "integer", example: 7 },
                      favorites: { type: "integer", example: 15 },
                    },
                  },
                },
              },
            },
            "401": { description: "未认证" },
          },
        },
      },
      "/api/v1/users/favorites": {
        get: {
          tags: ["Users"],
          summary: "用户收藏列表",
          description: "获取当前用户收藏的单词列表。🔒 需认证。",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "成功",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Word" },
                  },
                },
              },
            },
            "401": { description: "未认证" },
          },
        },
      },
      "/api/v1/users/learning-records": {
        get: {
          tags: ["Users"],
          summary: "学习记录列表",
          description: "获取当前用户的学习记录。🔒 需认证。",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "成功",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            _id: { type: "string" },
                            word: { $ref: "#/components/schemas/Word" },
                            reviewCount: { type: "integer" },
                            lastReviewedAt: { type: "string", format: "date-time" },
                          },
                        },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                },
              },
            },
            "401": { description: "未认证" },
          },
        },
      },

      // ==================== Wordbanks ====================
      "/api/v1/wordbanks": {
        get: {
          tags: ["Wordbanks"],
          summary: "词库列表",
          description: "获取所有公开词库（可选认证 — 管理员可看到私有词库）。",
          security: [],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: {
            "200": {
              description: "成功",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/WordBank" } },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Wordbanks"],
          summary: "新增词库",
          description: "创建新词库。🔒 需 Admin 权限。",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "description"],
                  properties: {
                    name: { type: "string", example: "核心动词" },
                    description: { type: "string", example: "涵盖最常用的英语核心动词" },
                    gradient: {
                      type: "string",
                      example: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    },
                    is_public: { type: "boolean", default: true },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "创建成功",
              content: { "application/json": { schema: { $ref: "#/components/schemas/WordBank" } } },
            },
            "401": { description: "未认证" },
            "403": { description: "权限不足（非 Admin）" },
          },
        },
      },
      "/api/v1/wordbanks/{id}": {
        get: {
          tags: ["Wordbanks"],
          summary: "词库详情",
          description: "获取指定词库的详细信息。",
          security: [],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "词库 ID" },
          ],
          responses: {
            "200": {
              description: "成功",
              content: { "application/json": { schema: { $ref: "#/components/schemas/WordBank" } } },
            },
            "404": { description: "词库不存在" },
          },
        },
        put: {
          tags: ["Wordbanks"],
          summary: "编辑词库",
          description: "更新词库信息。🔒 需 Admin 权限。",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    gradient: { type: "string" },
                    is_public: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "更新成功" },
            "401": { description: "未认证" },
            "403": { description: "权限不足" },
            "404": { description: "词库不存在" },
          },
        },
        delete: {
          tags: ["Wordbanks"],
          summary: "删除词库",
          description: "删除词库及其下所有单词。🔒 需 Admin 权限。",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "删除成功", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
            "401": { description: "未认证" },
            "403": { description: "权限不足" },
            "404": { description: "词库不存在" },
          },
        },
      },
      "/api/v1/wordbanks/{id}/words": {
        get: {
          tags: ["Wordbanks"],
          summary: "词库下单词列表",
          description: "获取指定词库下的单词列表（可选认证）。",
          security: [],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "词库 ID" },
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: {
            "200": {
              description: "成功",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Word" } },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ==================== Words ====================
      "/api/v1/words": {
        get: {
          tags: ["Words"],
          summary: "单词列表",
          description: "获取单词列表，支持搜索和按词库筛选（可选认证）。",
          security: [],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "search", in: "query", schema: { type: "string" }, description: "按单词名搜索" },
            { name: "wordbankId", in: "query", schema: { type: "string" }, description: "按词库 ID 筛选" },
          ],
          responses: {
            "200": {
              description: "成功",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Word" } },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Words"],
          summary: "新增单词",
          description: "创建新单词（含引申义和搭配）。🔒 需 Admin 权限。",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["word", "wordbankId", "coreMeaning", "coreExampleEn", "coreExampleZh", "physicalImageType", "physicalImageDescription"],
                  properties: {
                    word: { type: "string", example: "grasp" },
                    wordbankId: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
                    phonetic: { type: "string", example: "/ɡrɑːsp/" },
                    coreMeaning: { type: "string", example: "抓，握" },
                    coreExampleEn: { type: "string", example: "She grasped the rope." },
                    coreExampleZh: { type: "string", example: "她抓住绳子。" },
                    physicalImageType: { type: "string", enum: ["flow", "grasp", "break", "bear", "drive", "light", "leverage", "yield"] },
                    physicalImageDescription: { type: "string", example: "用手抓住物体" },
                    extendedMeanings: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ExtendedMeaning" },
                    },
                    collocations: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "创建成功",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Word" } } },
            },
            "401": { description: "未认证" },
            "403": { description: "权限不足" },
          },
        },
      },
      "/api/v1/words/{id}": {
        get: {
          tags: ["Words"],
          summary: "单词详情",
          description: "获取单词完整详情（含引申义和搭配）。",
          security: [],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "单词 ID" },
          ],
          responses: {
            "200": {
              description: "成功",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Word" } } },
            },
            "404": { description: "单词不存在" },
          },
        },
        put: {
          tags: ["Words"],
          summary: "编辑单词",
          description: "更新单词信息。🔒 需 Admin 权限。",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Word" },
              },
            },
          },
          responses: {
            "200": { description: "更新成功" },
            "401": { description: "未认证" },
            "403": { description: "权限不足" },
            "404": { description: "单词不存在" },
          },
        },
        delete: {
          tags: ["Words"],
          summary: "删除单词",
          description: "删除单词。🔒 需 Admin 权限。",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "删除成功" },
            "401": { description: "未认证" },
            "403": { description: "权限不足" },
            "404": { description: "单词不存在" },
          },
        },
      },
      "/api/v1/words/{id}/learn": {
        post: {
          tags: ["Words"],
          summary: "记录学习",
          description: "标记单词为已学习。🔒 需认证。",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "单词 ID" },
          ],
          responses: {
            "200": {
              description: "记录成功",
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "已记录学习" } } } } },
            },
            "401": { description: "未认证" },
            "404": { description: "单词不存在" },
          },
        },
      },
      "/api/v1/words/{id}/favorite": {
        post: {
          tags: ["Words"],
          summary: "收藏单词",
          description: "将单词添加到收藏列表。🔒 需认证。",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "单词 ID" },
          ],
          responses: {
            "200": {
              description: "收藏成功",
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "已收藏" } } } } },
            },
            "401": { description: "未认证" },
            "404": { description: "单词不存在" },
          },
        },
        delete: {
          tags: ["Words"],
          summary: "取消收藏",
          description: "将单词从收藏列表移除。🔒 需认证。",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" }, description: "单词 ID" },
          ],
          responses: {
            "200": {
              description: "取消成功",
              content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "已取消收藏" } } } } },
            },
            "401": { description: "未认证" },
            "404": { description: "单词不存在" },
          },
        },
      },

      // ==================== AI ====================
      "/api/v1/words/generate": {
        post: {
          tags: ["AI"],
          summary: "AI 词条生成",
          description: "调用 AI 为指定单词名生成完整词条。🔒 需 Admin 权限。接口限流：5次/分钟/用户。",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["word"],
                  properties: {
                    word: { type: "string", example: "serendipity" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "生成成功",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Word" } } },
            },
            "401": { description: "未认证" },
            "403": { description: "权限不足" },
            "429": { description: "请求过于频繁" },
          },
        },
      },
      "/api/v1/words/generate/stream": {
        post: {
          tags: ["AI"],
          summary: "AI 词条生成（SSE 流式）",
          description: "通过 Server-Sent Events 流式返回 AI 生成的词条内容。🔒 需 Admin 权限。接口限流：5次/分钟/用户（与普通生成共享配额）。",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["word"],
                  properties: {
                    word: { type: "string", example: "serendipity" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "SSE 流式事件",
              content: { "text/event-stream": { schema: { type: "string" } } },
            },
            "401": { description: "未认证" },
            "403": { description: "权限不足" },
            "429": { description: "请求过于频繁" },
          },
        },
      },

      // ==================== Daily Word ====================
      "/api/v1/daily-word": {
        get: {
          tags: ["Daily Word"],
          summary: "今日一词",
          description: "获取今日推荐的单词。公开接口，可选认证。",
          security: [],
          responses: {
            "200": {
              description: "成功",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      word: { $ref: "#/components/schemas/Word" },
                      isPinned: { type: "boolean", example: false },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/daily-word/pin": {
        post: {
          tags: ["Daily Word"],
          summary: "置顶今日一词",
          description: "管理员手动指定今日一词。🔒 需 Admin 权限。",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["wordId"],
                  properties: {
                    wordId: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "置顶成功" },
            "401": { description: "未认证" },
            "403": { description: "权限不足" },
          },
        },
      },

      // ==================== Dashboard ====================
      "/api/v1/admin/dashboard": {
        get: {
          tags: ["Dashboard"],
          summary: "管理后台数据概览",
          description: "获取管理后台 Dashboard 统计数据。🔒 需 Admin 权限。",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "成功",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      wordbankCount: { type: "integer", example: 5 },
                      wordCount: { type: "integer", example: 150 },
                      userCount: { type: "integer", example: 320 },
                      recentWords: { type: "array", items: { $ref: "#/components/schemas/Word" } },
                    },
                  },
                },
              },
            },
            "401": { description: "未认证" },
            "403": { description: "权限不足" },
          },
        },
      },

      // ==================== Health ====================
      "/api/v1/health": {
        get: {
          tags: ["Health"],
          summary: "健康检查",
          description: "服务健康检查端点（公开）。",
          security: [],
          responses: {
            "200": {
              description: "服务正常",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  // 不使用 apis glob 扫描（tsx 运行时 JSDoc 注释可能丢失），全部内联定义
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
