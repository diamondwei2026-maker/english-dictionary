/**
 * 一次性脚本：向云数据库插入管理员账号
 *
 * 用法: npx ts-node src/seed/insert-admin.ts
 * 或:  npx tsx src/seed/insert-admin.ts
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// 基于脚本自身位置解析 .env，避免 CWD 不同导致加载失败
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/english-dictionary-dev";

const ADMIN = {
  phone: "13800000001",
  username: "张明",
  password: "admin123",
  role: "admin" as const,
};

async function insertAdmin(): Promise<void> {
  console.log(`Connecting to MongoDB...`);
  console.log(`URI: ${MONGODB_URI.replace(/\/\/(.+?):(.+?)@/, "//***:***@")}`);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const db = mongoose.connection.db!;
  const usersCollection = db.collection("users");

  // 检查是否已存在
  const existing = await usersCollection.findOne({ phone: ADMIN.phone });
  if (existing) {
    console.log(
      `User with phone ${ADMIN.phone} already exists (role: ${existing.role}).`
    );
    console.log("Updating password and role...");
  }

  // 生成 bcrypt 哈希
  const passwordHash = await bcrypt.hash(ADMIN.password, 10);
  console.log(`Generated bcrypt hash: ${passwordHash.substring(0, 7)}...`);

  // Upsert
  const result = await usersCollection.updateOne(
    { phone: ADMIN.phone },
    {
      $set: {
        username: ADMIN.username,
        phone: ADMIN.phone,
        passwordHash,
        role: ADMIN.role,
        learnedWords: existing?.learnedWords ?? [],
        favoriteWords: existing?.favoriteWords ?? [],
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log(
      `✅ Admin user inserted successfully! _id: ${result.upsertedId}`
    );
  } else if (result.modifiedCount > 0) {
    console.log("✅ Admin user updated successfully!");
  } else {
    console.log("⚠️  No changes made (already up to date).");
  }

  // 验证
  const verify = await usersCollection.findOne(
    { phone: ADMIN.phone },
    { projection: { phone: 1, username: 1, role: 1, passwordHash: 1 } }
  );
  console.log("\nVerification:");
  console.log(JSON.stringify(verify, null, 2));

  // 测试密码匹配
  const isMatch = await bcrypt.compare(ADMIN.password, verify!.passwordHash);
  console.log(`\nPassword verification: ${isMatch ? "✅ PASS" : "❌ FAIL"}`);

  await mongoose.disconnect();
  console.log("Done.");
}

insertAdmin().catch((err) => {
  console.error("Insert admin failed:", err);
  process.exit(1);
});
