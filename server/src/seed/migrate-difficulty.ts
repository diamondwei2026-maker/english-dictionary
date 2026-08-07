// ============================================================
// 存量数据迁移：为所有 Word 文档设置 difficulty 字段
//
// 用法：npx tsx server/src/seed/migrate-difficulty.ts
//
// 策略：根据 Word 所属 WordBank 的 slug 自动推断难度级别。
//       无法推断的默认设为 "other"。
// ============================================================

import mongoose from "mongoose";
import { config } from "../config/index.js";
import { WordBank } from "../models/WordBank.js";
import { Word } from "../models/Word.js";

// slug → difficulty 推断规则（按优先级排序）
const SLUG_PATTERNS: Array<{ regex: RegExp; difficulty: string }> = [
  { regex: /cet4|四级/i,          difficulty: "cet4" },
  { regex: /cet6|六级/i,          difficulty: "cet6" },
  { regex: /gaokao|高考|高中|senior/i,  difficulty: "senior" },
  { regex: /zhongkao|中考|初中|junior/i,  difficulty: "junior" },
  { regex: /xiaoxue|小学|primary/i,  difficulty: "primary" },
  { regex: /college|大学/i,        difficulty: "college" },
  { regex: /tem4|专四/i,          difficulty: "tem4" },
  { regex: /tem8|专八/i,          difficulty: "tem8" },
  { regex: /ielts|雅思/i,         difficulty: "ielts" },
  { regex: /toefl|托福/i,         difficulty: "toefl" },
  { regex: /gre/i,               difficulty: "gre" },
];

function inferDifficulty(slug: string): string {
  for (const { regex, difficulty } of SLUG_PATTERNS) {
    if (regex.test(slug)) return difficulty;
  }
  return "other";
}

async function migrate(): Promise<void> {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(config.mongodbUri);
  console.log("Connected.");

  // Step 1: 收集所有词库的 slug → difficulty 映射
  console.log("Building difficulty map from WordBank slugs...");
  const banks = await WordBank.find({}).select("slug").lean();
  const slugToDifficulty: Record<string, string> = {};
  for (const bank of banks) {
    slugToDifficulty[bank.slug] = inferDifficulty(bank.slug);
  }
  console.log(`  Mapped ${Object.keys(slugToDifficulty).length} wordbanks.`);

  // Step 2: 找到所有没有 difficulty 的 Word 文档
  const wordsToUpdate = await Word.find({ difficulty: { $exists: false } })
    .select("wordbankId")
    .lean();
  console.log(`  Found ${wordsToUpdate.length} words without difficulty.`);

  if (wordsToUpdate.length === 0) {
    console.log("Nothing to migrate. Exiting.");
    await mongoose.disconnect();
    return;
  }

  // Step 3: 用 wordbankId → WordBank → slug → difficulty 推断
  // 首先构建 wordbankId → difficulty 映射（对于在 Step 2 中涉及到的 wordbankIds）
  const bankIds = [...new Set(wordsToUpdate.map(w => String(w.wordbankId)))];
  const banksWithId = await WordBank.find({ _id: { $in: bankIds } }).select("slug").lean();
  const bankIdToDifficulty: Record<string, string> = {};
  for (const bank of banksWithId) {
    const idStr = String(bank._id);
    bankIdToDifficulty[idStr] = slugToDifficulty[bank.slug] || "other";
  }

  // Step 4: 批量更新
  console.log("Updating words...");
  let updated = 0;
  for (const word of wordsToUpdate) {
    const diff = bankIdToDifficulty[String(word.wordbankId)] || "other";
    await Word.updateOne(
      { _id: word._id },
      { $set: { difficulty: diff } },
    );
    updated++;
  }
  console.log(`  Updated ${updated} words.`);

  // Step 5: 统计
  const stats = await Word.aggregate([
    { $group: { _id: "$difficulty", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log("\nDifficulty distribution:");
  for (const s of stats) {
    console.log(`  ${s._id}: ${s.count}`);
  }

  console.log("\nMigration completed successfully!");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
