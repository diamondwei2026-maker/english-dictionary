import mongoose from "mongoose";
import { config } from "../config";
import { User } from "../models/User.js";
import { WordBank } from "../models/WordBank.js";
import { Word } from "../models/Word.js";
import { Collocation } from "../models/Collocation.js";
import { UserFavorite } from "../models/UserFavorite.js";
import { LearningRecord } from "../models/LearningRecord.js";
import {
  mockLibraries,
  mockWords,
  mockUsers,
} from "../../../client/src/data/mockData.js";

// mock 数据中缺少 physicalImageDescription，按 physicalImageType 提供默认描述
const DEFAULT_IMAGE_DESCRIPTIONS: Record<string, string> = {
  flow: "Liquid (water) moving continuously along the path of least resistance",
  grasp:
    "Fingers closing around an object to securely hold and control it",
  break:
    "External force exceeding structural integrity, causing separation into pieces",
  bear: "Body or structure supporting weight from above without collapsing",
  drive:
    "Applying sustained force to move an object in a specific direction",
  light: "Light source emitting photons to make darkness visible",
  leverage:
    "Using a lever's mechanical advantage to amplify force",
  yield:
    "Material deforming permanently when stress exceeds elastic limit",
};

// mock 数据中 partOfSpeech 使用缩写（如 "v.", "n.", "v./n."），
// 但 DB Model enum 要求全称（"verb", "noun", "adj" 等），需规范化
const POS_ABBREV_MAP: Record<string, string> = {
  "v.": "verb",
  "n.": "noun",
  "adj.": "adj",
  "adv.": "adv",
  "prep.": "prep",
  "conj.": "conj",
  "pron.": "pron",
};

const VALID_POS = new Set([
  "noun",
  "verb",
  "adj",
  "adv",
  "prep",
  "conj",
  "pron",
  "other",
]);

function normalizePartOfSpeech(raw: string): string {
  // 处理复合形式如 "v./n." — 取第一个
  const primary = raw.split("/")[0].trim();
  const mapped = POS_ABBREV_MAP[primary];
  if (mapped) return mapped;
  // 如果已经是全称且有效，直接返回
  if (VALID_POS.has(raw)) return raw;
  // 兜底
  return "other";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getImageDescription(imageType: string): string {
  return (
    DEFAULT_IMAGE_DESCRIPTIONS[imageType] ??
    `Physical image of ${imageType}`
  );
}

async function seed(): Promise<void> {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(config.mongodbUri);
  console.log("Connected.");

  // 清空旧数据 — 按外键依赖从子到父删除，确保幂等
  console.log("Clearing old data...");
  await LearningRecord.deleteMany({});
  await UserFavorite.deleteMany({});
  await Collocation.deleteMany({});
  await Word.deleteMany({});
  await WordBank.deleteMany({});
  await User.deleteMany({});
  console.log("Old data cleared.");

  // === 插入 WordBank ===
  // 构建 mockLibrary.id → 数据库 WordBank._id 的映射链
  const libraryIdToName = new Map(
    mockLibraries.map((lib) => [lib.id, lib.name]),
  );

  console.log("Seeding wordbanks...");
  const wordbanks = await WordBank.insertMany(
    mockLibraries.map((lib) => ({
      name: lib.name,
      slug: slugify(lib.name),
      description: lib.description,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    })),
  );

  const nameToWordBankId = new Map(
    wordbanks.map((wb) => [wb.name, wb._id]),
  );
  console.log(`Inserted ${wordbanks.length} wordbanks.`);

  // === 插入 Word ===
  console.log("Seeding words...");
  const words = await Word.insertMany(
    mockWords.map((mw) => {
      const wordbankName = libraryIdToName.get(mw.libraryId);
      const wordbankId = wordbankName
        ? nameToWordBankId.get(wordbankName)
        : undefined;

      if (!wordbankId) {
        throw new Error(
          `Word "${mw.word}" references unknown libraryId "${mw.libraryId}". ` +
            `Ensure mockLibraries contains a matching entry.`,
        );
      }

      return {
        word: mw.word,
        wordbankId,
        phonetic: mw.phonetic,
        coreMeaning: mw.coreMeaning,
        coreExampleEn: mw.coreExampleSentence,
        coreExampleZh: mw.coreExampleTranslation,
        physicalImageType: mw.coreImageType,
        physicalImageDescription: getImageDescription(mw.coreImageType),
        extendedMeanings: mw.extendedMeanings.map((em) => ({
          evolutionDescription: em.logicalEvolution,
          meaning: em.meaning,
          partOfSpeech: normalizePartOfSpeech(em.partOfSpeech),
          exampleEn: em.exampleSentence,
          exampleZh: em.exampleTranslation,
        })),
        collocations: mw.collocations,
      };
    }),
  );
  console.log(`Inserted ${words.length} words.`);

  // === 插入管理员用户 ===
  console.log("Seeding admin user...");
  const adminUsers = mockUsers.filter((u) => u.role === "admin");

  if (adminUsers.length === 0) {
    console.log("No admin user found in mock data — skipping user seed.");
  } else {
    const users = await User.insertMany(
      adminUsers.map((mu) => ({
        username: mu.username,
        phone: mu.phone,
        passwordHash: "$2b$10$placeholder",
        role: mu.role,
      })),
    );
    console.log(`Inserted ${users.length} users.`);
  }

  console.log("Seed completed successfully!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
