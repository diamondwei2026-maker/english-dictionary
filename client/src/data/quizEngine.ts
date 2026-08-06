// ============================================================
// Quiz Engine — 纯前端判分引擎（本地模拟版）
// Ported from figma/src/app/data/quizEngine.ts
//
// 后续接 Supabase/LLM 时只需替换 generateQuiz 和 judgeAnswer 实现。
// ============================================================

import type { QuizDirection, QuizItem, QuizResult } from './types';

// ── 预置题库（本地模拟版）─────────────────────────────────────
// Source: figma/src/app/data/mockData.ts mockQuizItems

const mockQuizItems: QuizItem[] = [
  { id:'q1', wordId:'w1', direction:'zh2en', prompt:'健康的现金流是企业的生命线。', hint:'flow · 资金沿渠道持续移动', reference:'Healthy cash flow is the lifeblood of a business.', keywords:['healthy','cash','flow','lifeblood'], analysis:'"现金周转"的"转"容易让人想到 turn；这里英语锚定的是液体沿渠道持续移动的意象，因此用 cash flow。' },
  { id:'q2', wordId:'w1', direction:'zh2en', prompt:'新高速公路上的车流很顺畅。', hint:'flow · 交通如液体持续移动', reference:'Traffic flows smoothly on the new highway.', keywords:['traffic','flows','smoothly','highway'], analysis:'把车流看成沿通道不断移动的液体，英语自然使用 flow。' },
  { id:'q3', wordId:'w1', direction:'zh2en', prompt:'她完全沉浸在绘画中，进入了心流状态。', hint:'flow · 无阻的专注状态', reference:'She was in a state of flow while painting.', keywords:['state','flow','painting'], analysis:'从顺畅流动延伸到思维与行动毫无阻力的状态，英语说 a state of flow。' },
  { id:'q4', wordId:'w2', direction:'zh2en', prompt:'请在截止日期前提交这份报告。', hint:'submit · 把东西放到权威面前', reference:'Please submit the report before the deadline.', keywords:['submit','report','before','deadline'], analysis:'submit 的核心动作是"把东西交到审查者面前"，不是随意的 send。' },
  { id:'q5', wordId:'w2', direction:'zh2en', prompt:'所有申请必须通过网上系统提交。', hint:'submit · 正式交付', reference:'All applications must be submitted online.', keywords:['applications','must','submitted','online'], analysis:'这里强调正式交付到制度化渠道，用 submit 而不是 hand over。' },
  { id:'q6', wordId:'w2', direction:'zh2en', prompt:'他不愿意服从这个不合理的决定。', hint:'submit · 在压力下让步', reference:'He refused to submit to the unfair decision.', keywords:['refused','submit','unfair','decision'], analysis:'"交出去"的意象可延伸为在权力前让步；submit to 表示屈从。' },
  { id:'q7', wordId:'w3', direction:'zh2en', prompt:'这个方案会对环境产生重大影响。', hint:'impact · 物体撞击留下效果', reference:'The plan will have a significant impact on the environment.', keywords:['plan','significant','impact','environment'], analysis:'impact 原是撞击，抽象到一个行动在另一事物上留下的强烈效果。' },
  { id:'q8', wordId:'w3', direction:'zh2en', prompt:'她的演讲给观众留下了深刻印象。', hint:'impact · 强烈作用', reference:'Her speech made a strong impact on the audience.', keywords:['speech','strong','impact','audience'], analysis:'不是"印象"的直译；英语从一次有力撞击的结果来表达影响力。' },
  { id:'q9', wordId:'w3', direction:'zh2en', prompt:'新政策可能会影响小型企业。', hint:'impact · 作用于', reference:'The new policy may impact small businesses.', keywords:['new','policy','impact','small','businesses'], analysis:'动词 impact 把政策看作施加作用的力量，语气比 affect 更直接。' },
  { id:'q10',wordId:'w4', direction:'zh2en', prompt:'我们需要一个清晰的项目框架。', hint:'framework · 支撑结构', reference:'We need a clear framework for the project.', keywords:['need','clear','framework','project'], analysis:'framework 原是支撑物的骨架；在抽象任务中，它是组织思考的支撑结构。' },
  { id:'q11',wordId:'w4', direction:'zh2en', prompt:'这个框架帮助团队做出一致的决定。', hint:'framework · 组织判断的骨架', reference:'The framework helps the team make consistent decisions.', keywords:['framework','helps','team','consistent','decisions'], analysis:'这里的框架不是"盒子"，而是让判断有共同支点的结构。' },
  { id:'q12',wordId:'w4', direction:'zh2en', prompt:'先搭建框架，再补充具体细节。', hint:'framework · 先有结构后有内容', reference:'Build the framework first, then add the details.', keywords:['build','framework','first','add','details'], analysis:'英语先建立承重结构，再填入细节；这正是 framework 的核心画面。' },
  { id:'q13',wordId:'w5', direction:'zh2en', prompt:'这项研究提供了有力的证据。', hint:'evidence · 可被看见的证明', reference:'The study provides strong evidence.', keywords:['study','provides','strong','evidence'], analysis:'evidence 指能让人"看出"结论的材料，强调可检验的依据。' },
  { id:'q14',wordId:'w5', direction:'zh2en', prompt:'没有证据表明这种方法有效。', hint:'evidence · 支持结论的依据', reference:'There is no evidence that this method works.', keywords:['no','evidence','method','works'], analysis:'中文"证明"常诱导使用 proof；这里说的是支持判断的材料，应用 evidence。' },
  { id:'q15',wordId:'w6', direction:'zh2en', prompt:'请评估这个决定带来的风险。', hint:'assess · 坐下来仔细判断', reference:'Please assess the risks of this decision.', keywords:['assess','risks','decision'], analysis:'assess 是经过观察与衡量后形成判断，不只是快速地 guess。' },
  { id:'q16',wordId:'w6', direction:'zh2en', prompt:'经理正在评估团队的表现。', hint:'assess · 系统判断', reference:'The manager is assessing the team performance.', keywords:['manager','assessing','team','performance'], analysis:'评估是把对象放进一套标准中仔细衡量，故用 assess。' },
  { id:'q17',wordId:'w7', direction:'zh2en', prompt:'这个账户由两个人共同管理。', hint:'joint · 两者连接在一起', reference:'The account is jointly managed by two people.', keywords:['account','jointly','managed','two','people'], analysis:'joint 的物理画面是连接处；jointly 表示两个主体连接着共同承担动作。' },
  { id:'q18',wordId:'w7', direction:'zh2en', prompt:'我们发布了一份联合声明。', hint:'joint · 连接后的共同产物', reference:'We issued a joint statement.', keywords:['issued','joint','statement'], analysis:'联合声明是多个来源在同一连接点上发出的共同产物。' },
  { id:'q19',wordId:'w8', direction:'zh2en', prompt:'她通过每天练习逐渐建立了自信。', hint:'build · 一层层搭起', reference:'She built confidence through daily practice.', keywords:['built','confidence','daily','practice'], analysis:'build 的核心是逐层搭建；自信也是靠重复经验一点点累积起来的。' },
  { id:'q20',wordId:'w8', direction:'zh2en', prompt:'公司正在建立与客户的长期关系。', hint:'build · 逐步构造', reference:'The company is building long-term relationships with clients.', keywords:['company','building','long-term','relationships','clients'], analysis:'关系不是瞬间"得到"的，而是像建筑一样在持续互动中逐步构造。' },
];

// ── 工具函数 ─────────────────────────────────────────────────

const normalize = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[.!?。！？]+$/g, '')
    .replace(/\s+/g, ' ');

const words = (value: string) =>
  normalize(value).match(/[a-z]+(?:'[a-z]+)?/g) ?? [];

const variantMatches = (keyword: string, input: string[]) =>
  input.some(
    (word) =>
      word === keyword ||
      word.replace(/(s|es|ed|ing)$/, '') ===
        keyword.replace(/(s|es|ed|ing)$/, '')
  );

const lcs = (a: string[], b: string[]) => {
  const table = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      table[i][j] =
        a[i - 1] === b[j - 1]
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
  return table[a.length][b.length];
};

const shuffle = <T>(values: T[]): T[] => {
  const arr = [...values];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ── 导出函数 ─────────────────────────────────────────────────

/**
 * 生成一轮测验题目（10 题）。
 * - 有 wordId：优先取该单词题目，不足时用同词库单词补齐，再无则从通用池随机
 * - 无 wordId：从全部题库随机抽取
 */
export function generateQuiz(
  direction: QuizDirection,
  wordId?: string
): QuizItem[] {
  const all = mockQuizItems.filter((item) => item.direction === direction);

  let pool: QuizItem[];
  if (wordId) {
    const focused = all.filter((item) => item.wordId === wordId);
    // 该单词题目不足 10 题时，用非同词题目补齐
    const rest = all.filter((item) => item.wordId !== wordId);
    pool = [...focused, ...shuffle(rest)].slice(0, 10);
  } else {
    pool = all;
  }

  const shuffled = shuffle(pool);
  return Array.from({ length: Math.min(10, shuffled.length) }, (_, index) => ({
    ...shuffled[index % shuffled.length],
    id: `${shuffled[index % shuffled.length].id}-${index}`,
  }));
}

/**
 * 评判用户输入。
 * - 中译英 (zh2en)：关键词命中率 70% + LCS 序列相似度 30% = 总分
 *   score ≥ 70 判对
 * - 英译中 (en2zh)：字符 bigram 重合度（本轮不启用）
 * - 空输入直接判错
 */
export function judgeAnswer(
  item: QuizItem,
  userInput: string,
  direction: QuizDirection
): QuizResult {
  if (!normalize(userInput)) {
    return {
      correct: false,
      score: 0,
      matched: [],
      missing: item.keywords,
      analysis: `${item.analysis} 你还没有输入答案；参考表达：${item.reference}`,
    };
  }

  if (direction === 'en2zh') {
    // 英译中：字符 bigram 重合度（本轮不启用，预留）
    const source = normalize(userInput);
    const ref = normalize(item.reference);
    const score = Math.round(
      ([...new Set(source)].filter((c) => ref.includes(c)).length /
        Math.max(ref.length, 1)) *
        100
    );
    return {
      correct: score >= 70,
      score,
      matched: [],
      missing: [],
      analysis:
        score >= 70
          ? `表达正确。参考答案：${item.reference}`
          : `${item.analysis} 参考答案：${item.reference}`,
    };
  }

  // 中译英：关键词 + LCS
  const inputWords = words(userInput);
  const matched = item.keywords.filter((k) => variantMatches(k, inputWords));
  const missing = item.keywords.filter((k) => !matched.includes(k));

  const keywordScore = (matched.length / item.keywords.length) * 70;
  const referenceWords = words(item.reference);
  const sequenceScore =
    (lcs(inputWords, referenceWords) / Math.max(referenceWords.length, 1)) * 30;
  const score = Math.round(keywordScore + sequenceScore);
  const correct = score >= 70;

  return {
    correct,
    score,
    matched,
    missing,
    analysis: correct
      ? `表达已经抓住了这句的核心意象。参考答案：${item.reference}`
      : `${item.analysis}${missing.length ? ` 建议补上：${missing.join('、')}。` : ''} 参考答案：${item.reference}`,
  };
}
