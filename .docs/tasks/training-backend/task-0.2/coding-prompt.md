# Coding Prompt — Task 0.2: 种子数据 — 迁移 20 条 mock 题目入库

---

### 1. 任务目标

将 `client/src/data/quizEngine.ts` 中 `mockQuizItems` 的 20 条中译英题目迁移为 MongoDB 种子数据，写入 `server/src/seed/` 并接入主种子流程。

---

### 2. 技术上下文

- **语言/框架**: Node.js + Express + TypeScript (ESM: `"type": "module"`)
- **ODM**: Mongoose
- **涉及文件**:
  - **(新建)** `server/src/seed/quiz.seed.ts` — quiz 种子函数（已确认该路径不存在 ✅）
  - **(修改)** `server/src/seed/index.ts` — 主种子脚本，接入 quiz 种子（已读取当前内容 ✅）
- **数据库集合**: `quizquestions` (已由 Task 0.1 的 QuizQuestion Model 定义 Schema)
- **依赖 Task 产出**:
  - Task 0.1 的 `QuizQuestion` Model — 已导出在 `server/src/models/index.ts:17-18` ✅
  - Task 0.1 的 `QuizAttempt` Model — 已导出在 `server/src/models/index.ts:19-20` ✅
  - 现有 `Word` / `WordBank` Model — 由 `server/src/seed/index.ts` 种子脚本插入 ✅

- **已有代码探查结果** 🔴:
  - `QuizQuestion` Model（`server/src/models/QuizQuestion.ts`）导出了 `IQuizQuestion` interface 和 `QuizQuestion` Mongoose Model，字段: `prompt`, `hint`, `direction` (enum `'zh2en' | 'en2zh'`), `reference`, `keywords: string[]`, `analysis`, `wordId?` (ref Word), `wordbankId?` (ref WordBank) + timestamps
  - 现有种子脚本 `server/src/seed/index.ts` 执行顺序: 清空数据 → WordBank → Word → User → disconnect。Quiz 种子需要在 Word 之后、disconnect 之前插入
  - 现有种子脚本使用的 mock 数据来源: `figma/src/app/data/mockData.ts`（导入路径写为 `../../../client/src/data/mockData.js`，但该文件在 client/ 中不存在，**仅在 figma/ 目录中存在**）
  - 现有种子脚本插入的 Word: `flow`, `grasp`, `break`, `bear`, `drive`, `illuminate`, `leverage`, `yield`
  - `npm run seed` 通过 `package.json` 中的脚本定义执行

### ⚠️ 关键发现: quiz wordId 与 word 数据库不匹配

`quizEngine.ts` 中的 `mockQuizItems` 和 `figma/src/app/data/mockData.ts` 中的 `mockWords` 使用**不同的 wordId 命名空间**:

| quiz wordId | 实际英文词 (来自 hint) | mockData wordId | mockData word | DB 中是否存在 |
|-------------|----------------------|-----------------|---------------|--------------|
| w1 | flow | w1 | flow | ✅ 存在 |
| w2 | submit | w2 | grasp | ❌ 不存在 |
| w3 | impact | w3 | break | ❌ 不存在 |
| w4 | framework | w4 | bear | ❌ 不存在 |
| w5 | evidence | w5 | drive | ❌ 不存在 |
| w6 | assess | w6 | illuminate | ❌ 不存在 |
| w7 | joint | w7 | leverage | ❌ 不存在 |
| w8 | build | w8 | yield | ❌ 不存在 |

**结论**: 当前 Word 集合中只有 "flow" 一词能找到匹配，其余 17 道题目的 `wordId` / `wordbankId` 应为 `null`。种子逻辑应通过**英文单词名**匹配，而非通过 quiz 的 wordId 字符串匹配。在种子函数中硬编码一个 `QUIZ_WORD_MAP`（quiz wordId → 英文单词名），然后按英文单词名查询 Word 集合。

---

### 3. 已有代码当前内容（修改前）

**`server/src/seed/index.ts`**:
```
- 第 1-13 行: import 语句 (mongoose, config, 6 个 Model, mockLibraries/mockWords/mockUsers from mockData.js)
- 第 80-179 行: async seed() 函数
  - 连接 MongoDB
  - 清空旧数据 (LearningRecord → UserFavorite → Collocation → Word → WordBank → User)
  - 插入 WordBank → Word → User
  - 断开连接
```
**注意**: 当前 `seed()` 的 clear 逻辑**已经清除所有数据**后重建，QuizQuestion 集合也会被间接清空（如果 seed 脚本在 clear 阶段添加 `QuizQuestion.deleteMany({})`），但从幂等角度考虑，需要在 clear 阶段增加 `QuizAttempt.deleteMany({})` 和 `QuizQuestion.deleteMany({})`。

---

### 4. 实现要求

#### 4.1 文件 `server/src/seed/quiz.seed.ts`（新建）

- **导出函数**: `async function seedQuizQuestions(wordMap: Map<string, { wordId: Types.ObjectId; wordbankId: Types.ObjectId }>): Promise<number>`
- **签名说明**: 接受一个 Map，key 为 quiz 的 wordId（如 `"w1"`），value 为 `{ wordId, wordbankId }`。返回成功写入的题目数量。
- **职责**: 将 20 条 mock 题目写入 `QuizQuestion` 集合，自动关联 wordId / wordbankId

**关键逻辑**:

1. **定义单词映射字典**（硬编码）:
```typescript
const QUIZ_WORD_MAP: Record<string, string> = {
  w1: "flow",
  w2: "submit",
  w3: "impact",
  w4: "framework",
  w5: "evidence",
  w6: "assess",
  w7: "joint",
  w8: "build",
};
```

2. **构建 20 条题目数据**（直接从 `mockQuizItems` 中提取，无需 import 远程文件）:
   - 每条题目在 seed 函数内直接定义（硬编码数组），避免跨目录 import 问题（client/ 中的 quizEngine.ts 可能使用 TypeScript 路径别名或不同的模块解析）
   - 每道题映射: `{ prompt, hint, direction: 'zh2en', reference, keywords, analysis, wordId?, wordbankId? }`

3. **关联 wordId / wordbankId**:
   - 对于每道题，取 `QUIZ_WORD_MAP[quizWordId]` 得到英文单词名
   - 用 `wordMap.get(quizWordId)` 查找对应的数据库 ObjectId
   - 找到 → 设置 `wordId` 和 `wordbankId`
   - 未找到 → 设为 `undefined`（字段不出现在文档中，Mongoose 存为 null）

4. **upsert 去重**:
   - 使用 `QuizQuestion.bulkWrite` + `updateOne` upsert
   - 去重键: `{ prompt, reference }`（同 prompt + 同 reference 视为重复题目）
   - `upsert: true` + `$setOnInsert` 确保重复执行不产生重复记录

5. **返回写入数量**，console.log 输出 `Inserted/Upserted N quiz questions`

**错误处理**: 整个函数 try-catch，失败时抛出有意义的错误信息，不静默吞掉异常

**代码规范**: 使用 ESM import/export，类型标注完整，与现有 seed/index.ts 风格一致

#### 4.2 文件 `server/src/seed/index.ts`（修改）

**修改 1 — 增加 import**（在现有 import 块末尾添加）:
```typescript
import { QuizQuestion } from "../models/QuizQuestion.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { seedQuizQuestions } from "./quiz.seed.js";
```

**修改 2 — 增加清空逻辑**（在现有 `Clearing old data...` 块中，在 `LearningRecord.deleteMany({})` 之后添加）:
```typescript
await QuizAttempt.deleteMany({});
await QuizQuestion.deleteMany({});
```
> 排在 LearningRecord 之后、Collocation 之前（或任意位置均可，QuizQuestion/QuizAttempt 无外键依赖）

**修改 3 — 增加 quiz 种子调用**（在 Word 插入完成后、User 插入之前）:
```typescript
// === 插入 Quiz Questions ===
// 构建 quiz wordId → { wordId, wordbankId } 映射
const quizWordMap = new Map<string, { wordId: any; wordbankId: any }>();
for (const w of words) {
  // mockWords 的 id 字段 → quizWordMap: 找到 QUIZ_WORD_MAP 中英文单词名与 w.word 匹配的条目
  // 需要将 quiz 的 wordId (w1-w8) 映射到 Word 文档的 _id
  // 方式：检查 QUIZ_WORD_MAP 中哪些 quiz wordId 映射到的英文单词名 === w.word
  // （但 quiz.seed.ts 内部已有 QUIZ_WORD_MAP，建议将映射构建逻辑放在 quiz.seed.ts 中，或直接在 seed 函数内构建）

  // 简化方案：将 seedQuizQuestions 的签名改为接收 Word 文档数组
  // → seedQuizQuestions(words: IWord[]): Promise<number>
  // 在函数内部自行构建映射和匹配
}

console.log("Seeding quiz questions...");
const quizCount = await seedQuizQuestions(words);
console.log(`Inserted ${quizCount} quiz questions.`);
```

**推荐实现**: 修改 `seedQuizQuestions` 签名为接收 `Word` 文档数组而非 Map:
```typescript
// quiz.seed.ts
export async function seedQuizQuestions(words: IWord[]): Promise<number>
```
函数内部: 遍历 QUIZ_WORD_MAP，按英文单词名查询 `words` 数组 → 构建 wordId 映射。

---

### 5. 代码规范要求

- **ESM 模块**: 使用 `import`/`export`，相对路径加 `.js` 扩展名（与项目规范一致）
- **async/await**: 不使用 Promise.then
- **类型标注**: 所有函数参数和返回值有 TypeScript 类型，`words` 参数使用 `IWord[]` 类型（从 `../models/Word.js` 导入）
- **错误处理**: try-catch 包裹主要逻辑，失败时打印错误信息并 `throw`（让上层 seed() 的 catch 处理）
- **日志风格**: 与现有 seed 脚本一致 — 用 `console.log()` 描述性输出
- **幂等性**: upsert 策略确保重复执行安全

---

### 6. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）:

| 用例 | 验证要点 |
|------|---------|
| TC-001 | `npm run seed` 成功执行，20 题入库 |
| TC-002 | 字段映射正确 (prompt, hint, direction, reference, keywords, analysis) |
| TC-003 | wordId 关联（flow 的 3 题指向正确 Word 文档） |
| TC-004 | 8 个 wordId 分组（仅 flow 3 题有非 null wordId，其余 17 题为 null） |
| TC-005 | 重复执行不产生重复记录（upsert 去重） |
| TC-006 | 种子执行顺序正确（quiz 在 wordbank/word 之后） |
| TC-007 | 20 题均为 zh2en 方向 |
| TC-008 | keywords 非空且为英文 |
| I-001 🔴 | 通过 Mongoose Model 查询验证数据完整性 |
| I-002 🔴 | populate wordId 验证关联链路（仅 flow 3 题成功） |

---

### 7. 集成验证指令 🔴

代码写完后，执行以下验证：

1. **自检**: `seedQuizQuestions()` 是否通过 `QuizQuestion` Model 写入（非 mock/直接 DB driver）
2. **链路验证** (I-001 + I-002):
   ```
   # 1. 确保 MongoDB 运行中
   # 2. 执行种子
   npm run seed
   
   # 3. 验证 I-001: 通过 Model 查询
   node -e "
   import('./server/src/config/index.js').then(async c => {
     const mongoose = (await import('mongoose')).default;
     await mongoose.connect(c.config.mongodbUri);
     const { QuizQuestion } = await import('./server/src/models/index.js');
     const count = await QuizQuestion.countDocuments();
     console.log('QuizQuestion count:', count);
     const sample = await QuizQuestion.findOne({});
     console.log('Sample fields:', Object.keys(sample.toObject()));
     await mongoose.disconnect();
   });
   "
   
   # 4. 验证 I-002: wordId 关联
   node -e "
   import('./server/src/config/index.js').then(async c => {
     const mongoose = (await import('mongoose')).default;
     await mongoose.connect(c.config.mongodbUri);
     const { QuizQuestion } = await import('./server/src/models/index.js');
     const questions = await QuizQuestion.find({}).populate('wordId').lean();
     const withWord = questions.filter(q => q.wordId);
     console.log('Questions with wordId:', withWord.length, '(expected 3 for flow)');
     if (withWord.length > 0) console.log('First wordId populated:', withWord[0].wordId?.word);
     await mongoose.disconnect();
   });
   "
   ```
3. **回归检查**: `npm run seed` 不破坏现有 WordBank/Word 种子逻辑（原有输出不变）

---

### 8. 注意事项

- ⚠️ **mockData.js 路径陷阱**: `seed/index.ts` 中 `import { mockLibraries, mockWords, mockUsers } from "../../../client/src/data/mockData.js"` — 这个文件在 `client/src/data/` 中**不存在**。它在 `figma/src/app/data/mockData.ts` 中。现有种子脚本能运行说明 TypeScript/Node 有某种路径解析机制或编译产物。**不要依赖这个 import 工作** — 在 `quiz.seed.ts` 中硬编码 20 道题目数据。

- ⚠️ **Quiz 题目数据在函数内直接定义**，不要 import 来自 `client/src/data/quizEngine.ts`。原因:
  1. client/ 是前端项目（uni-app），模块解析机制可能不同
  2. quizEngine.ts 的 `mockQuizItems` 内部使用 client 特有的类型（`QuizItem`），服务端不应依赖
  3. 硬编码 20 条题目是最稳健的方式，与种子脚本中 mock 数据来源的本质一致

- ⚠️ **只匹配到 flow**: 当前数据库中只有 `flow` 一词匹配，这是**预期行为**。不要试图将 quiz wordId 映射到错误的单词（如 w2→grasp, w3→break 等）。未匹配的 `wordId`/`wordbankId` 应为 `undefined`。

- ⚠️ **seed() 的 clear 阶段**: 需要增加 `QuizAttempt.deleteMany({})` 和 `QuizQuestion.deleteMany({})`，确保种子全量幂等。QuizAttempt 和 QuizQuestion 无外键依赖，放在 LearningRecord 之后即可。

- ⚠️ **en2zh 预留**: Schema 支持 `direction: 'en2zh'`，当前种子全部为 `zh2en`，代码结构应能容纳后续新增 en2zh 方向题目（如通过条件分支或配置控制）。
