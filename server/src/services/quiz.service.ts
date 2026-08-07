import mongoose from "mongoose";
import { QuizQuestion, QuizAttempt } from "../models/index.js";
import type { IQuizQuestion, IQuizAttempt } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { shuffle, scoreAnswer } from "@english-dict/shared";

// ============================================================
// 类型定义
// ============================================================

export interface QuizResult {
  correct: boolean;
  score: number;
  matched: string[];
  missing: string[];
  analysis: string;
  /** 仅已登录用户：attempt 记录是否成功写入 */
  attemptSaved?: boolean;
}

// ============================================================
// generateQuiz — 题目生成
// ============================================================

/**
 * 从 QuizQuestion 集合中按策略选取 10 题（或可用的最大数量）。
 *
 * - 有 wordId：优先取该单词题目，不足用同方向其他题目补齐
 * - 有 userId：排除 24h 内已答题目
 * - 无 wordId：从全部题库随机抽取
 */
export async function generateQuiz(
  direction: "zh2en" | "en2zh",
  wordId?: string,
  userId?: string,
): Promise<IQuizQuestion[]> {
  const all = await QuizQuestion.find({ direction }).lean<IQuizQuestion[]>();

  if (all.length === 0) {
    return [];
  }

  // 排除 24h 内已答题目（仅已登录用户）
  let available = all;
  if (userId) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAttempts = await QuizAttempt.find({
      userId,
      submittedAt: { $gte: twentyFourHoursAgo },
    })
      .select("questionId")
      .lean();
    const answeredIds = new Set(
      recentAttempts.map((a) => String(a.questionId)),
    );
    available = all.filter((q) => !answeredIds.has(String(q._id)));
    if (available.length === 0) {
      return [];
    }
  }

  let pool: IQuizQuestion[];
  if (wordId) {
    const focused = available.filter(
      (q) => q.wordId && String(q.wordId) === wordId,
    );
    const rest = available.filter(
      (q) => !q.wordId || String(q.wordId) !== wordId,
    );
    pool = [...focused, ...shuffle(rest)].slice(0, 10);
  } else {
    pool = shuffle(available).slice(0, 10);
  }

  return pool;
}

// ============================================================
// judgeAnswer — 服务端判分引擎
// ============================================================

/**
 * 对用户输入判分。
 *
 * 算法与前端 quizEngine.ts 的 judgeAnswer() 完全一致：
 * - zh2en：关键词命中率 70% + LCS 序列相似度 30%
 * - en2zh：字符级 bigram 重合度（预留）
 * - 空输入直接判错
 * - 已登录用户 (userId 存在) 自动保存 QuizAttempt 记录
 */
export async function judgeAnswer(
  questionId: string,
  userInput: string,
  userId?: string,
): Promise<QuizResult> {
  // 参数校验
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    throw new AppError(400, "INVALID_ID", "无效的题目 ID");
  }

  const question = await QuizQuestion.findById(questionId).lean<IQuizQuestion>();
  if (!question) {
    throw new AppError(404, "NOT_FOUND", "题目不存在");
  }

  // 判分（共享评分引擎 — 与前端一致）
  const result: QuizResult = scoreAnswer({
    direction: question.direction,
    reference: question.reference,
    keywords: question.keywords,
    analysis: question.analysis,
    userInput,
  });

  // 已登录用户自动保存 QuizAttempt
  if (userId) {
    const { saved } = await saveAttemptSilently(userId, question._id, userInput, result);
    result.attemptSaved = saved;
  }

  return result;
}

/**
 * 静默保存 QuizAttempt 记录，失败不阻塞判分结果。
 * @returns `{saved: true}` 写入成功；`{saved: false}` 写入失败（已记录日志）
 */
async function saveAttemptSilently(
  userId: string,
  questionId: mongoose.Types.ObjectId,
  userInput: string,
  result: QuizResult,
): Promise<{ saved: boolean }> {
  try {
    await QuizAttempt.create({
      userId: new mongoose.Types.ObjectId(userId),
      questionId,
      userInput: userInput.trim(),
      score: result.score,
      correct: result.correct,
      matched: result.matched,
      missing: result.missing,
      submittedAt: new Date(),
    });
    return { saved: true };
  } catch (err) {
    console.error(
      "QuizAttempt save failed:",
      { userId, questionId: String(questionId), error: String(err) },
    );
    return { saved: false };
  }
}

// ============================================================
// getHistory — 答题历史
// ============================================================

/**
 * 获取用户答题历史，按提交时间降序，支持分页。
 */
export async function getHistory(
  userId: string,
  page: number = 1,
  limit: number = 20,
): Promise<{
  data: Array<{
    questionId: string;
    prompt: string;
    direction: string;
    userInput: string;
    score: number;
    correct: boolean;
    reference: string;
    submittedAt: Date;
  }>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const [data, total] = await Promise.all([
    QuizAttempt.find({ userId })
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("questionId", "prompt direction reference")
      .lean(),
    QuizAttempt.countDocuments({ userId }),
  ]);

  const mapped = data.map((record) => {
    const question = record.questionId as unknown as {
      _id: mongoose.Types.ObjectId;
      prompt: string;
      direction: string;
      reference: string;
    } | null;
    return {
      questionId: String(record.questionId),
      prompt: question?.prompt ?? "",
      direction: question?.direction ?? "",
      userInput: record.userInput,
      score: record.score,
      correct: record.correct,
      reference: question?.reference ?? "",
      submittedAt: record.submittedAt,
    };
  });

  return {
    data: mapped,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================
// getStats — 训练统计
// ============================================================

/**
 * 获取用户训练统计：总题数、正确率、最近 7 天每日答题数趋势。
 */
export async function getStats(userId: string): Promise<{
  totalQuestions: number;
  correctRate: number;
  recentTrend: number[];
}> {
  const [total, correctCount] = await Promise.all([
    QuizAttempt.countDocuments({ userId }),
    QuizAttempt.countDocuments({ userId, correct: true }),
  ]);

  const correctRate = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // 最近 7 天每日答题数
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const daily = await QuizAttempt.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        submittedAt: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // 构建长度为 7 的数组（索引 0 = 7 天前，索引 6 = 今天）
  const recentTrend: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const entry = daily.find((e) => e._id === key);
    recentTrend.push(entry ? entry.count : 0);
  }

  return {
    totalQuestions: total,
    correctRate,
    recentTrend,
  };
}
