import mongoose from "mongoose";
import { Word, UserFavorite, User } from "../models";
import { AppError } from "../utils/errors";

// ============================================================
// 收藏服务
// ============================================================

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * 收藏单词（幂等 — 已收藏时返回现有记录）。
 */
export async function favoriteWord(
  userId: string,
  wordId: string,
): Promise<{ favorited: boolean }> {
  if (!isValidObjectId(wordId)) {
    throw new AppError(400, "INVALID_ID", "无效的单词 ID");
  }

  const word = await Word.findById(wordId);
  if (!word) {
    throw new AppError(404, "NOT_FOUND", "单词不存在");
  }

  await Promise.all([
    UserFavorite.findOneAndUpdate(
      { userId, wordId },
      {},
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
    User.findByIdAndUpdate(userId, {
      $addToSet: { favoriteWords: wordId },
    }),
  ]);

  return { favorited: true };
}

/**
 * 取消收藏。
 */
export async function unfavoriteWord(
  userId: string,
  wordId: string,
): Promise<{ favorited: boolean }> {
  if (!isValidObjectId(wordId)) {
    throw new AppError(400, "INVALID_ID", "无效的单词 ID");
  }

  await Promise.all([
    UserFavorite.findOneAndDelete({ userId, wordId }),
    User.findByIdAndUpdate(userId, {
      $pull: { favoriteWords: wordId },
    }),
  ]);

  return { favorited: false };
}

/**
 * 获取用户收藏列表，按收藏时间降序。
 */
export async function getUserFavorites(
  userId: string,
  page: number,
  pageSize: number,
): Promise<{
  data: Array<Record<string, unknown>>;
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}> {
  const [data, total] = await Promise.all([
    UserFavorite.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("wordId"),
    UserFavorite.countDocuments({ userId }),
  ]);

  const mapped = data.map((fav) => {
    const wordDoc = (fav.wordId as unknown as Record<string, unknown>) || {};
    return {
      _id: wordDoc._id,
      word: wordDoc.word,
      wordbankId: wordDoc.wordbankId,
      phonetic: wordDoc.phonetic || "",
      coreMeaning: wordDoc.coreMeaning || "",
      coreExampleEn: wordDoc.coreExampleEn || "",
      coreExampleZh: wordDoc.coreExampleZh || "",
      physicalImageType: wordDoc.physicalImageType || "",
      physicalImageDescription: wordDoc.physicalImageDescription || "",
      extendedMeanings: wordDoc.extendedMeanings || [],
      collocations: wordDoc.collocations || [],
      favoritedAt: fav.createdAt,
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
