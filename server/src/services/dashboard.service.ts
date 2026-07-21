import { WordBank, Word, User } from "../models/index.js";

// ============================================================
// 管理后台 Dashboard 统计服务
// ============================================================

export interface DashboardData {
  wordbankCount: number;
  wordCount: number;
  userCount: number;
  newWordsTrend: Array<{ date: string; count: number }>;
  newUsersTrend: Array<{ date: string; count: number }>;
}

/**
 * 构建最近 7 天趋势数据。
 * 返回按日期升序、每天都有值（缺失日期补 0）的数组。
 */
async function buildTrend(
  model: typeof Word | typeof User
): Promise<Array<{ date: string; count: number }>> {
  const today = new Date();
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const result = await model.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo, $lte: todayEnd },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 将 aggregate 结果转为 Map，缺失日期填 0
  const countMap = new Map<string, number>();
  result.forEach((r: { _id: string; count: number }) => countMap.set(r._id, r.count));

  // 生成完整 7 天数组
  const trend: Array<{ date: string; count: number }> = [];
  const cursor = new Date(sevenDaysAgo);
  while (cursor <= todayEnd) {
    const dateStr = cursor.toISOString().slice(0, 10);
    trend.push({ date: dateStr, count: countMap.get(dateStr) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return trend;
}

/**
 * 获取管理后台 Dashboard 数据概览。
 */
export async function getDashboard(): Promise<DashboardData> {
  const [wordbankCount, wordCount, userCount, newWordsTrend, newUsersTrend] =
    await Promise.all([
      WordBank.countDocuments({}),
      Word.countDocuments({}),
      User.countDocuments({}),
      buildTrend(Word),
      buildTrend(User),
    ]);

  return {
    wordbankCount,
    wordCount,
    userCount,
    newWordsTrend,
    newUsersTrend,
  };
}
