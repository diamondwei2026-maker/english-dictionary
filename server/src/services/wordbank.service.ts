import mongoose from "mongoose";
import { WordBank, Word, IWordBank } from "../models";
import { AppError } from "../utils/errors.js";
import type { CreateWordBankInput, UpdateWordBankInput } from "../validators/wordbank.validator.js";
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
  const keyPattern = (err as unknown as { errorResponse?: { keyPattern?: Record<string, unknown> } })
    .errorResponse?.keyPattern;
  if (keyPattern) {
    if ("slug" in keyPattern) return "slug";
    if ("name" in keyPattern) return "name";
  }
  return null;
}

// === 服务函数 ===

export async function listWordbanks(options: {
  page: number;
  pageSize: number;
  isAdmin: boolean;
}): Promise<{ data: IWordBank[]; pagination: { total: number; page: number; pageSize: number } }> {
  const { page, pageSize, isAdmin } = options;

  const cacheKey = `wordbanks:list:${page}:${pageSize}:${isAdmin ? "admin" : "public"}`;

  // 读缓存
  const cached = await tryCacheGet<{
    data: IWordBank[];
    pagination: { total: number; page: number; pageSize: number };
  }>(cacheKey);
  if (cached) return cached;

  const filter = isAdmin ? {} : { is_public: true };

  const [data, total] = await Promise.all([
    WordBank.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    WordBank.countDocuments(filter),
  ]);

  const result = {
    data,
    pagination: { total, page, pageSize },
  };

  tryCacheSet(cacheKey, result, config.cacheTtlWordbankList);

  return result;
}

export async function getWordBankById(
  id: string
): Promise<{ wordbank: IWordBank; wordCount: number }> {
  ensureValidId(id);

  const cacheKey = `wordbanks:detail:${id}`;

  // 读缓存
  const cached = await tryCacheGet<{
    wordbank: IWordBank;
    wordCount: number;
  }>(cacheKey);
  if (cached) return cached;

  const wordbank = await WordBank.findById(id);
  if (!wordbank) {
    throw new AppError(404, "NOT_FOUND", "词库不存在");
  }

  const wordCount = await Word.countDocuments({ wordbankId: id });

  const result = { wordbank, wordCount };

  tryCacheSet(cacheKey, result, config.cacheTtlWordbankDetail);

  return result;
}

export async function createWordBank(data: CreateWordBankInput): Promise<IWordBank> {
  try {
    const wordbank = await WordBank.create(data);

    // 失效词库列表缓存
    tryCacheDelByPrefix("wordbanks:list:");

    return wordbank;
  } catch (err) {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      const field = extractDuplicateField(err);
      if (field === "slug") {
        throw new AppError(409, "CONFLICT", "slug 已存在");
      }
      if (field === "name") {
        throw new AppError(409, "CONFLICT", "词库名称已存在");
      }
    }
    throw err;
  }
}

export async function updateWordBank(
  id: string,
  data: UpdateWordBankInput
): Promise<IWordBank> {
  ensureValidId(id);

  try {
    const wordbank = await WordBank.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!wordbank) {
      throw new AppError(404, "NOT_FOUND", "词库不存在");
    }

    // 失效相关缓存
    tryCacheDel(`wordbanks:detail:${id}`);
    tryCacheDelByPrefix("wordbanks:list:");

    return wordbank;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      const field = extractDuplicateField(err);
      if (field === "slug") {
        throw new AppError(409, "CONFLICT", "slug 已存在");
      }
      if (field === "name") {
        throw new AppError(409, "CONFLICT", "词库名称已存在");
      }
    }
    throw err;
  }
}

export async function deleteWordBank(id: string): Promise<void> {
  ensureValidId(id);

  // 先确认词库存在再操作，避免词库不存在时误删关联单词
  const wordbank = await WordBank.findById(id);
  if (!wordbank) {
    throw new AppError(404, "NOT_FOUND", "词库不存在");
  }

  // 级联删除关联单词后删除词库
  await Word.deleteMany({ wordbankId: id });
  await WordBank.findByIdAndDelete(id);

  // 失效相关缓存
  tryCacheDel(`wordbanks:detail:${id}`);
  tryCacheDelByPrefix("wordbanks:list:");
  tryCacheDelByPrefix(`words:list:${id}:`);
}
