import { QuizQuestion } from "../models/QuizQuestion.js";
import type { IWord } from "../models/Word.js";

// quizEngine.ts mockQuizItems wordId => English word name mapping
// Only "flow" (w1) exists in the current Word collection;
// submit/impact/framework/evidence/assess/joint/build do not.
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

// 句中词汇提示 — keyed by mock id (q1..q20), applied to QuizQuestion docs at seed time
const QUIZ_GLOSSARY_MAP: Record<string, { verbs: { word: string; meaning: string }[]; nouns: { word: string; meaning: string }[] }> = {
  q1: { verbs: [], nouns: [{ word: "cash flow", meaning: "现金流；资金持续进出企业的流动" }, { word: "lifeblood", meaning: "生命线；维持事物运转的关键资源" }, { word: "business", meaning: "企业；商业活动" }] },
  q2: { verbs: [{ word: "flow", meaning: "流动；顺畅地移动" }], nouns: [{ word: "traffic", meaning: "交通流量；车流" }, { word: "highway", meaning: "高速公路" }] },
  q3: { verbs: [{ word: "paint", meaning: "绘画" }], nouns: [{ word: "state", meaning: "状态" }, { word: "flow", meaning: "心流；高度投入且顺畅的状态" }] },
  q4: { verbs: [{ word: "submit", meaning: "正式提交；递交给审核方" }], nouns: [{ word: "report", meaning: "报告" }, { word: "deadline", meaning: "截止日期" }] },
  q5: { verbs: [{ word: "submit", meaning: "正式提交；递交" }], nouns: [{ word: "application", meaning: "申请；申请材料" }, { word: "system", meaning: "系统" }] },
  q6: { verbs: [{ word: "refuse", meaning: "拒绝" }, { word: "submit to", meaning: "屈从于；服从" }], nouns: [{ word: "decision", meaning: "决定" }] },
  q7: { verbs: [{ word: "have", meaning: "产生；带来（影响）" }], nouns: [{ word: "plan", meaning: "方案；计划" }, { word: "impact", meaning: "重大影响；强烈作用" }, { word: "environment", meaning: "环境" }] },
  q8: { verbs: [{ word: "make", meaning: "造成；带来" }], nouns: [{ word: "speech", meaning: "演讲" }, { word: "impact", meaning: "影响；冲击" }, { word: "audience", meaning: "观众" }] },
  q9: { verbs: [{ word: "impact", meaning: "影响；对……产生作用" }], nouns: [{ word: "policy", meaning: "政策" }, { word: "business", meaning: "企业" }] },
  q10: { verbs: [{ word: "need", meaning: "需要" }], nouns: [{ word: "framework", meaning: "框架；支撑结构" }, { word: "project", meaning: "项目" }] },
  q11: { verbs: [{ word: "help", meaning: "帮助；促使" }, { word: "make", meaning: "做出（决定）" }], nouns: [{ word: "framework", meaning: "框架" }, { word: "team", meaning: "团队" }, { word: "decision", meaning: "决定" }] },
  q12: { verbs: [{ word: "build", meaning: "搭建；建立" }, { word: "add", meaning: "补充；添加" }], nouns: [{ word: "framework", meaning: "框架" }, { word: "detail", meaning: "细节" }] },
  q13: { verbs: [{ word: "provide", meaning: "提供" }], nouns: [{ word: "study", meaning: "研究" }, { word: "evidence", meaning: "证据；可检验的依据" }] },
  q14: { verbs: [{ word: "work", meaning: "起作用；有效" }], nouns: [{ word: "evidence", meaning: "证据" }, { word: "method", meaning: "方法" }] },
  q15: { verbs: [{ word: "assess", meaning: "评估；衡量后作出判断" }], nouns: [{ word: "risk", meaning: "风险" }, { word: "decision", meaning: "决定" }] },
  q16: { verbs: [{ word: "assess", meaning: "评估；系统判断" }], nouns: [{ word: "manager", meaning: "经理" }, { word: "team", meaning: "团队" }, { word: "performance", meaning: "表现；绩效" }] },
  q17: { verbs: [{ word: "manage", meaning: "管理" }], nouns: [{ word: "account", meaning: "账户" }, { word: "people", meaning: "人们" }] },
  q18: { verbs: [{ word: "issue", meaning: "发布；正式发出" }], nouns: [{ word: "statement", meaning: "声明" }] },
  q19: { verbs: [{ word: "build", meaning: "建立；逐步搭建" }], nouns: [{ word: "confidence", meaning: "自信" }, { word: "practice", meaning: "练习" }] },
  q20: { verbs: [{ word: "build", meaning: "建立；逐步构建" }], nouns: [{ word: "company", meaning: "公司" }, { word: "relationship", meaning: "关系" }, { word: "client", meaning: "客户" }] },
};

// 20 zh2en quiz items extracted from client/src/data/quizEngine.ts mockQuizItems
// Structure: [id, wordId, prompt, hint, reference, keywords[], analysis]
// NOTE: Chinese corner brackets 「」 used instead of "" to avoid esbuild parse errors.
const RAW_QUIZ_ITEMS: [
  string,
  string,
  string,
  string,
  string,
  string[],
  string,
][] = [
  [
    "q1",
    "w1",
    "健康的现金流是企业的生命线。",
    "flow · 资金沿渠道持续移动",
    "Healthy cash flow is the lifeblood of a business.",
    ["healthy", "cash", "flow", "lifeblood"],
    "「现金周转」的「转」容易让人想到 turn；这里英语锚定的是液体沿渠道持续移动的意象，因此用 cash flow。",
  ],
  [
    "q2",
    "w1",
    "新高速公路上的车流很顺畅。",
    "flow · 交通如液体持续移动",
    "Traffic flows smoothly on the new highway.",
    ["traffic", "flows", "smoothly", "highway"],
    "把车流看成沿通道不断移动的液体，英语自然使用 flow。",
  ],
  [
    "q3",
    "w1",
    "她完全沉浸在绘画中，进入了心流状态。",
    "flow · 无阻的专注状态",
    "She was in a state of flow while painting.",
    ["state", "flow", "painting"],
    "从顺畅流动延伸到思维与行动毫无阻力的状态，英语说 a state of flow。",
  ],
  [
    "q4",
    "w2",
    "请在截止日期前提交这份报告。",
    "submit · 把东西放到权威面前",
    "Please submit the report before the deadline.",
    ["submit", "report", "before", "deadline"],
    "submit 的核心动作是「把东西交到审查者面前」，不是随意的 send。",
  ],
  [
    "q5",
    "w2",
    "所有申请必须通过网上系统提交。",
    "submit · 正式交付",
    "All applications must be submitted online.",
    ["applications", "must", "submitted", "online"],
    "这里强调正式交付到制度化渠道，用 submit 而不是 hand over。",
  ],
  [
    "q6",
    "w2",
    "他不愿意服从这个不合理的决定。",
    "submit · 在压力下让步",
    "He refused to submit to the unfair decision.",
    ["refused", "submit", "unfair", "decision"],
    "「交出去」的意象可延伸为在权力前让步；submit to 表示屈从。",
  ],
  [
    "q7",
    "w3",
    "这个方案会对环境产生重大影响。",
    "impact · 物体撞击留下效果",
    "The plan will have a significant impact on the environment.",
    ["plan", "significant", "impact", "environment"],
    "impact 原是撞击，抽象到一个行动在另一事物上留下的强烈效果。",
  ],
  [
    "q8",
    "w3",
    "她的演讲给观众留下了深刻印象。",
    "impact · 强烈作用",
    "Her speech made a strong impact on the audience.",
    ["speech", "strong", "impact", "audience"],
    "不是「印象」的直译；英语从一次有力撞击的结果来表达影响力。",
  ],
  [
    "q9",
    "w3",
    "新政策可能会影响小型企业。",
    "impact · 作用于",
    "The new policy may impact small businesses.",
    ["new", "policy", "impact", "small", "businesses"],
    "动词 impact 把政策看作施加作用的力量，语气比 affect 更直接。",
  ],
  [
    "q10",
    "w4",
    "我们需要一个清晰的项目框架。",
    "framework · 支撑结构",
    "We need a clear framework for the project.",
    ["need", "clear", "framework", "project"],
    "framework 原是支撑物的骨架；在抽象任务中，它是组织思考的支撑结构。",
  ],
  [
    "q11",
    "w4",
    "这个框架帮助团队做出一致的决定。",
    "framework · 组织判断的骨架",
    "The framework helps the team make consistent decisions.",
    ["framework", "helps", "team", "consistent", "decisions"],
    "这里的框架不是「盒子」，而是让判断有共同支点的结构。",
  ],
  [
    "q12",
    "w4",
    "先搭建框架，再补充具体细节。",
    "framework · 先有结构后有内容",
    "Build the framework first, then add the details.",
    ["build", "framework", "first", "add", "details"],
    "英语先建立承重结构，再填入细节；这正是 framework 的核心画面。",
  ],
  [
    "q13",
    "w5",
    "这项研究提供了有力的证据。",
    "evidence · 可被看见的证明",
    "The study provides strong evidence.",
    ["study", "provides", "strong", "evidence"],
    "evidence 指能让人「看出」结论的材料，强调可检验的依据。",
  ],
  [
    "q14",
    "w5",
    "没有证据表明这种方法有效。",
    "evidence · 支持结论的依据",
    "There is no evidence that this method works.",
    ["no", "evidence", "method", "works"],
    "中文「证明」常诱导使用 proof；这里说的是支持判断的材料，应用 evidence。",
  ],
  [
    "q15",
    "w6",
    "请评估这个决定带来的风险。",
    "assess · 坐下来仔细判断",
    "Please assess the risks of this decision.",
    ["assess", "risks", "decision"],
    "assess 是经过观察与衡量后形成判断，不只是快速地 guess。",
  ],
  [
    "q16",
    "w6",
    "经理正在评估团队的表现。",
    "assess · 系统判断",
    "The manager is assessing the team performance.",
    ["manager", "assessing", "team", "performance"],
    "评估是把对象放进一套标准中仔细衡量，故用 assess。",
  ],
  [
    "q17",
    "w7",
    "这个账户由两个人共同管理。",
    "joint · 两者连接在一起",
    "The account is jointly managed by two people.",
    ["account", "jointly", "managed", "two", "people"],
    "joint 的物理画面是连接处；jointly 表示两个主体连接着共同承担动作。",
  ],
  [
    "q18",
    "w7",
    "我们发布了一份联合声明。",
    "joint · 连接后的共同产物",
    "We issued a joint statement.",
    ["issued", "joint", "statement"],
    "联合声明是多个来源在同一连接点上发出的共同产物。",
  ],
  [
    "q19",
    "w8",
    "她通过每天练习逐渐建立了自信。",
    "build · 一层层搭起",
    "She built confidence through daily practice.",
    ["built", "confidence", "daily", "practice"],
    "build 的核心是逐层搭建；自信也是靠重复经验一点点累积起来的。",
  ],
  [
    "q20",
    "w8",
    "公司正在建立与客户的长期关系。",
    "build · 逐步构造",
    "The company is building long-term relationships with clients.",
    [
      "company",
      "building",
      "long-term",
      "relationships",
      "clients",
    ],
    "关系不是瞬间「得到」的，而是像建筑一样在持续互动中逐步构造。",
  ],
];

/**
 * Write quiz mock items into the MongoDB QuizQuestion collection.
 *
 * - Upsert by (prompt, reference) — safe to run repeatedly.
 * - Matches English word names from the seed Word documents for wordId/wordbankId.
 * - Currently only "flow" exists in the DB; the other 17 items get null wordId.
 *
 * @param words — Word documents already inserted in this seed run
 * @returns number of upserted quiz questions
 */
export async function seedQuizQuestions(words: IWord[]): Promise<number> {
  const wordByName = new Map<string, IWord>();
  for (const w of words) {
    wordByName.set(w.word, w);
  }

  const operations = RAW_QUIZ_ITEMS.map(
    ([_id, quizWordId, prompt, hint, reference, keywords, analysis]) => {
      const englishWord = QUIZ_WORD_MAP[quizWordId];
      const wordDoc = englishWord ? wordByName.get(englishWord) : undefined;

      const doc: Record<string, unknown> = {
        prompt,
        hint,
        direction: "zh2en",
        reference,
        keywords,
        analysis,
      };

      // 注入句中词汇提示（如果存在）
      const glossary = QUIZ_GLOSSARY_MAP[_id];
      if (glossary) {
        doc.glossary = glossary;
      }

      if (wordDoc) {
        doc.wordId = wordDoc._id;
        doc.wordbankId = wordDoc.wordbankId;
      }

      return {
        updateOne: {
          filter: { prompt, reference },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      };
    },
  );

  const result = await QuizQuestion.bulkWrite(operations, { ordered: false });
  return result.upsertedCount + result.matchedCount;
}
