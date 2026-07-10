import mongoose from "mongoose";
import { Word, LearningRecord, User } from "../models";
import { AppError } from "../utils/errors.js";

// ============================================================
// 学习记录服务
// ============================================================

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * 记录/更新用户对某单词的学习。
 *
 * - 首次学习：创建 LearningRecord（learnCount=1）
 * - 重复学习：$inc learnCount，更新 lastLearnedAt
 * - 同步更新 User.learnedWords 数组（$addToSet 防重复）
 */
export async function recordLearn(
  userId: string,
  wordId: string,
): Promise<{ learnCount: number; lastLearnedAt: Date }> {
  if (!isValidObjectId(wordId)) {
    throw new AppError(400, "INVALID_ID", "无效的单词 ID");
  }

  const word = await Word.findById(wordId);
  if (!word) {
    throw new AppError(404, "NOT_FOUND", "单词不存在");
  }

  const [record] = await Promise.all([
    LearningRecord.findOneAndUpdate(
      { userId, wordId },
      { $inc: { learnCount: 1 }, $set: { lastLearnedAt: new Date() } },
      { upsert: true, new: true },
    ),
    User.findByIdAndUpdate(userId, {
      $addToSet: { learnedWords: wordId },
    }),
  ]);

  return {
    learnCount: record.learnCount,
    lastLearnedAt: record.lastLearnedAt!,
  };
}

/**
 * 获取用户学习记录列表，按最近学习时间降序。
 */
export async function getUserLearningRecords(
  userId: string,
  page: number,
  pageSize: number,
): Promise<{
  data: Array<{
    wordId: string;
    word: string;
    coreMeaning: string;
    phonetic: string;
    learnCount: number;
    lastLearnedAt: Date | null;
  }>;
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}> {
  const [data, total] = await Promise.all([
    LearningRecord.find({ userId })
      .sort({ lastLearnedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("wordId", "word coreMeaning phonetic"),
    LearningRecord.countDocuments({ userId }),
  ]);

  const mapped = data.map((record) => {
    const populated = record.wordId as unknown as {
      _id: mongoose.Types.ObjectId;
      word: string;
      coreMeaning: string;
      phonetic?: string;
    } | null;
    return {
      wordId: String(record.wordId),
      word: populated?.word || "",
      coreMeaning: populated?.coreMeaning || "",
      phonetic: populated?.phonetic || "",
      learnCount: record.learnCount,
      lastLearnedAt: record.lastLearnedAt,
    };
  });

  return {
    data: mapped,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * 获取用户学习统计。
 *
 * - totalWordsLearned: 用户学习过的不同单词数
 * - totalLearningDays: 有学习记录的不同日期数
 * - todayLearnedCount: 今天学习的单词数
 */
export async function getUserStats(
  userId: string,
): Promise<{
  totalWordsLearned: number;
  totalLearningDays: number;
  todayLearnedCount: number;
}> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalWordsLearned, learningDaysResult, todayLearnedCount] =
    await Promise.all([
      LearningRecord.countDocuments({ userId }),
      LearningRecord.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), lastLearnedAt: { $ne: null } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$lastLearnedAt" },
            },
          },
        },
        { $count: "count" },
      ]),
      LearningRecord.countDocuments({
        userId,
        lastLearnedAt: { $gte: todayStart },
      }),
    ]);

  return {
    totalWordsLearned,
    totalLearningDays:
      learningDaysResult.length > 0 ? learningDaysResult[0].count : 0,
    todayLearnedCount,
  };
}
