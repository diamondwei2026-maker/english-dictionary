import mongoose from "mongoose";
import { DailyWord, Word, LearningRecord, IWord } from "../models";
import { AppError } from "../utils/errors";

// ============================================================
// 今日一词推荐服务
// ============================================================

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * 安全地获取 populated wordId 字段。
 * 如果引用的 Word 文档已被删除，populate 返回 null，这里返回 null。
 */
function safePopulatedWord(
  doc: { wordId: unknown }
): IWord | null {
  const populated = doc.wordId;
  if (populated && typeof populated === "object" && "_id" in (populated as Record<string, unknown>)) {
    return populated as IWord;
  }
  return null;
}

/**
 * 获取当天的今日一词。
 *
 * - 如果当天记录已存在则直接返回
 * - 否则运行推荐算法选择单词并持久化
 * - userId 可选：已登录用户个性化推荐（优先未学单词）
 */
export async function getDailyWord(
  userId?: string
): Promise<{
  word: IWord | null;
  date: string;
  isPinned: boolean;
}> {
  const today = getToday();

  // 1. 检查当天记录是否已存在
  const existing = await DailyWord.findOne({ date: today }).populate<{
    wordId: IWord;
  }>("wordId");

  if (existing) {
    return {
      word: safePopulatedWord(existing),
      date: today,
      isPinned: existing.isPinned,
    };
  }

  // 2. 当天无记录，运行推荐算法
  const allWords = await Word.find({});
  if (allWords.length === 0) {
    return { word: null, date: today, isPinned: false };
  }

  // 3. 收集已学单词 ID（仅登录用户）
  const learnedWordIds: Set<string> = new Set();
  if (userId) {
    const records = await LearningRecord.find({ userId });
    records.forEach((r) => learnedWordIds.add(String(r.wordId)));
  }

  // 4. 收集近期（7天冷却窗口）已推荐的单词 ID
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const recentRecords = await DailyWord.find({
    date: { $gte: sevenDaysAgoStr, $lt: today },
  });
  const recentWordIds: Set<string> = new Set();
  recentRecords.forEach((r) => recentWordIds.add(String(r.wordId)));

  // 5. 构建候选池
  let candidates = allWords.filter((w) => {
    const wid = String(w._id);
    if (learnedWordIds.has(wid)) return false;
    if (recentWordIds.has(wid)) return false;
    return true;
  });

  // 兜底1：所有单词都学过 → 仅排除冷却窗口内的
  if (candidates.length === 0) {
    candidates = allWords.filter((w) => !recentWordIds.has(String(w._id)));
  }

  // 兜底2：冷却窗口内包含了所有单词 → 选推荐历史中最久远的
  if (candidates.length === 0) {
    // 找到最久未被推荐的单词（按 DailyWord 中最近一次出现时间升序）
    const wordLastRecDate = new Map<string, Date>();
    allWords.forEach((w) => {
      const rid = recentRecords.find(
        (r) => String(r.wordId) === String(w._id)
      );
      if (rid) {
        wordLastRecDate.set(String(w._id), rid.createdAt);
      } else {
        wordLastRecDate.set(String(w._id), new Date(0)); // 从未推荐过
      }
    });
    candidates = [...allWords].sort((a, b) => {
      const aDate = wordLastRecDate.get(String(a._id)) || new Date(0);
      const bDate = wordLastRecDate.get(String(b._id)) || new Date(0);
      return aDate.getTime() - bDate.getTime();
    });
  }

  // 6. 从候选池选一个（兜底2已排序，取第一个即最久未被推荐的；常规流程随机选取）
  const pickedIndex =
    candidates.length > 0 && recentWordIds.size >= allWords.length
      ? 0 // 兜底2：已按推荐时间升序排列，取最久远的
      : Math.floor(Math.random() * candidates.length);
  const picked = candidates[pickedIndex];

  // 7. 创建 DailyWord 记录（处理并发：若已存在则回退到 findOne）
  try {
    await DailyWord.create({
      date: today,
      wordId: picked._id,
      isPinned: false,
    });
  } catch (err) {
    // 并发请求可能已创建同一天记录 → 回退查询
    if (
      err instanceof mongoose.mongo.MongoServerError &&
      err.code === 11000
    ) {
      const fallback = await DailyWord.findOne({ date: today }).populate<{
        wordId: IWord;
      }>("wordId");
      if (fallback) {
        return {
          word: safePopulatedWord(fallback),
          date: today,
          isPinned: fallback.isPinned,
        };
      }
    }
    throw err;
  }

  return {
    word: picked,
    date: today,
    isPinned: false,
  };
}

/**
 * 管理员将指定单词置顶为今日一词（当天有效）。
 */
export async function pinDailyWord(
  wordId: string,
  adminId: string
): Promise<{ success: boolean; wordId: string; pinnedAt: Date }> {
  if (!isValidObjectId(wordId)) {
    throw new AppError(400, "INVALID_ID", "无效的单词 ID 格式");
  }

  const word = await Word.findById(wordId);
  if (!word) {
    throw new AppError(404, "NOT_FOUND", "单词不存在");
  }

  const today = getToday();
  const pinnedAt = new Date();

  await DailyWord.findOneAndUpdate(
    { date: today },
    {
      date: today,
      wordId,
      isPinned: true,
      pinnedBy: adminId,
      pinnedAt,
    },
    { upsert: true, new: true }
  );

  return { success: true, wordId, pinnedAt };
}
