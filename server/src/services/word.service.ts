import mongoose from "mongoose";
import { Word, WordBank, IWord } from "../models";
import { AppError } from "../utils/errors.js";
import type { CreateWordInput, UpdateWordInput } from "../validators/word.validator.js";
import { tryCacheGet, tryCacheSet, tryCacheDel, tryCacheDelByPrefix } from "../cache";
import { config } from "../config";

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

  const cacheKey = `words:list:${wordbankId || "all"}:${page}:${pageSize}:${q || "none"}:${isAdmin ? "admin" : "public"}`;

  // 读缓存
  const cached = await tryCacheGet<{
    data: IWord[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }>(cacheKey);
  if (cached) return cached;

  const filter: Record<string, unknown> = {};

  // 权限过滤：非管理员只能看到公开词库的单词
  if (!isAdmin) {
    const publicIds = await WordBank.distinct("_id", { is_public: true });
    if (wordbankId) {
      if (!publicIds.some((id) => id.toString() === wordbankId)) {
        return {
          data: [],
          pagination: { total: 0, page, pageSize, totalPages: 0 },
        };
      }
      filter.wordbankId = wordbankId;
    } else {
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

  // ==========================================================
  // 搜索分支：使用 aggregation pipeline 实现相关度排序
  // 排序规则：精确匹配(0) > 前缀匹配(1) > 中间匹配(2) > 字母序
  // ==========================================================
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 安全转义：处理 $regexMatch 中的 ^ 锚点
    // 正则 filter 也需用于 $match（过滤非匹配文档）
    const regexFilter = { ...filter, word: { $regex: escaped, $options: "i" } };

    const pipeline: mongoose.PipelineStage[] = [
      { $match: regexFilter },
      {
        $addFields: {
          _sortScore: {
            $cond: [
              // 精确匹配（大小写不敏感）
              { $eq: [{ $toLower: "$word" }, q.toLowerCase()] },
              0,
              {
                $cond: [
                  // 前缀匹配（以搜索词开头）
                  {
                    $regexMatch: {
                      input: "$word",
                      regex: `^${escaped}`,
                      options: "i",
                    },
                  },
                  1,
                  // 中间匹配（包含搜索词但非前缀）
                  2,
                ],
              },
            ],
          },
        },
      },
      { $sort: { _sortScore: 1, word: 1 } },
      { $project: { _sortScore: 0 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ];

    const [data, total] = await Promise.all([
      Word.aggregate<typeof Word.prototype>(pipeline),
      Word.countDocuments(regexFilter),
    ]);

    const result = {
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    tryCacheSet(cacheKey, result, config.cacheTtlWordList);
    return result;
  }

  // ==========================================================
  // 非搜索分支：使用原有 find 逻辑（无需相关度排序）
  // ==========================================================

  const [data, total] = await Promise.all([
    Word.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    Word.countDocuments(filter),
  ]);

  const result = {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  tryCacheSet(cacheKey, result, config.cacheTtlWordList);
  return result;
}

export async function getWordById(id: string, isAdmin?: boolean): Promise<IWord> {
  ensureValidId(id);

  const cacheKey = `words:detail:${id}:${isAdmin ? "admin" : "public"}`;

  // 读缓存
  const cached = await tryCacheGet<IWord>(cacheKey);
  if (cached) return cached;

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

  tryCacheSet(cacheKey, word, config.cacheTtlWordDetail);

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

    // 失效缓存
    tryCacheDelByPrefix("words:list:");
    tryCacheDel(`wordbanks:detail:${data.wordbankId}`);
    tryCacheDelByPrefix("wordbanks:list:");

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

    // 失效缓存
    tryCacheDel(`words:detail:${id}`);
    tryCacheDelByPrefix("words:list:");

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

  // 失效缓存
  tryCacheDel(`words:detail:${id}`);
  tryCacheDelByPrefix("words:list:");
  tryCacheDel(`wordbanks:detail:${word.wordbankId}`);
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

  const cacheKey = `words:list:${wordbankId}:${page}:${pageSize}:${isAdmin ? "admin" : "public"}`;

  // 读缓存
  const cached = await tryCacheGet<{
    data: IWord[];
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }>(cacheKey);
  if (cached) return cached;

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

  const result = {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  tryCacheSet(cacheKey, result, config.cacheTtlWordList);

  return result;
}
