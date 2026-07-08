import mongoose from "mongoose";
import { Word, WordBank, IWord } from "../models";
import { AppError } from "../utils/errors";
import type { CreateWordInput, UpdateWordInput } from "../validators/word.validator";

// === 工具函数 ===

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

function ensureValidId(id: string): void {
  if (!isValidObjectId(id)) {
    throw new AppError(400, "INVALID_ID", "无效的 ID 格式");
  }
}

function extractDuplicateField(err: mongoose.mongo.MongoServerError): string | null {
  const keyPattern = (
    err as unknown as { errorResponse?: { keyPattern?: Record<string, unknown> } }
  ).errorResponse?.keyPattern;
  if (keyPattern) {
    if ("wordbankId" in keyPattern && "word" in keyPattern) return "word";
  }
  return null;
}

// === 服务函数 ===

export async function listWords(options: {
  page: number;
  pageSize: number;
  wordbankId?: string;
  q?: string;
  isAdmin?: boolean;
}): Promise<{
  data: IWord[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}> {
  const { page, pageSize, wordbankId, q, isAdmin } = options;

  const filter: Record<string, unknown> = {};

  // 权限过滤：非管理员只能看到公开词库的单词
  if (!isAdmin) {
    const publicIds = await WordBank.find({ is_public: true }).distinct("_id");
    if (wordbankId) {
      // 指定了词库但该词库不公开 → 返回空
      if (!publicIds.some((id) => id.toString() === wordbankId)) {
        return {
          data: [],
          pagination: { total: 0, page, pageSize, totalPages: 0 },
        };
      }
      filter.wordbankId = wordbankId;
    } else {
      // 无指定词库 → 仅列出公开词库的单词
      if (publicIds.length === 0) {
        return {
          data: [],
          pagination: { total: 0, page, pageSize, totalPages: 0 },
        };
      }
      filter.wordbankId = { $in: publicIds };
    }
  } else if (wordbankId) {
    ensureValidId(wordbankId);
    filter.wordbankId = wordbankId;
  }

  // 关键词模糊搜索（单词名，不区分大小写）
  if (q) {
    // 转义正则特殊字符，防止注入
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.word = { $regex: escaped, $options: "i" };
  }

  const [data, total] = await Promise.all([
    Word.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Word.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getWordById(id: string, isAdmin?: boolean): Promise<IWord> {
  ensureValidId(id);

  const word = await Word.findById(id);
  if (!word) {
    throw new AppError(404, "NOT_FOUND", "单词不存在");
  }

  // 非管理员需校验词库是否为公开
  if (!isAdmin) {
    const wordbank = await WordBank.findById(word.wordbankId);
    if (!wordbank || !wordbank.is_public) {
      throw new AppError(404, "NOT_FOUND", "单词不存在");
    }
  }

  return word;
}

export async function createWord(data: CreateWordInput): Promise<IWord> {
  // 校验词库存在
  const wordbank = await WordBank.findById(data.wordbankId);
  if (!wordbank) {
    throw new AppError(404, "NOT_FOUND", "词库不存在");
  }

  try {
    const word = await Word.create(data as unknown as Record<string, unknown>);
    return word;
  } catch (err) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      const field = extractDuplicateField(err);
      if (field === "word") {
        throw new AppError(409, "CONFLICT", "该词库内单词名已存在");
      }
    }
    // Mongoose ValidationError
    if (err instanceof mongoose.Error.ValidationError) {
      const errors = Object.entries(err.errors).map(([field, e]) => ({
        field,
        message: e.message,
      }));
      throw new AppError(400, "VALIDATION_ERROR", "数据校验失败", errors);
    }
    throw err;
  }
}

export async function updateWord(
  id: string,
  data: UpdateWordInput
): Promise<IWord> {
  ensureValidId(id);

  try {
    const word = await Word.findByIdAndUpdate(
      id,
      { $set: data as unknown as Record<string, unknown> },
      { new: true, runValidators: true }
    );

    if (!word) {
      throw new AppError(404, "NOT_FOUND", "单词不存在");
    }

    return word;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      const field = extractDuplicateField(err);
      if (field === "word") {
        throw new AppError(409, "CONFLICT", "该词库内单词名已存在");
      }
    }
    if (err instanceof mongoose.Error.ValidationError) {
      const errors = Object.entries(err.errors).map(([field, e]) => ({
        field,
        message: e.message,
      }));
      throw new AppError(400, "VALIDATION_ERROR", "数据校验失败", errors);
    }
    throw err;
  }
}

export async function deleteWord(id: string): Promise<void> {
  ensureValidId(id);

  const word = await Word.findByIdAndDelete(id);
  if (!word) {
    throw new AppError(404, "NOT_FOUND", "单词不存在");
  }

  // extendedMeanings 和 collocations 是内嵌子文档/数组，删除 Word 文档即自动级联删除
}

export async function getWordsByWordbankId(
  wordbankId: string,
  options: { page: number; pageSize: number; isAdmin?: boolean }
): Promise<{
  data: IWord[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}> {
  ensureValidId(wordbankId);

  const { page, pageSize, isAdmin } = options;

  const [wordbank, data, total] = await Promise.all([
    WordBank.findById(wordbankId),
    Word.find({ wordbankId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Word.countDocuments({ wordbankId }),
  ]);

  if (!wordbank) {
    throw new AppError(404, "NOT_FOUND", "词库不存在");
  }

  // 非管理员不能查看私有词库的单词
  if (!isAdmin && !wordbank.is_public) {
    throw new AppError(404, "NOT_FOUND", "词库不存在");
  }

  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
