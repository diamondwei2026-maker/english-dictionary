import mongoose from "mongoose";
import { config } from "../config";
import { User } from "../models/User";
import { WordBank } from "../models/WordBank";
import { Word } from "../models/Word";

async function seed(): Promise<void> {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(config.mongodbUri);
  console.log("Connected.");

  // 清空旧数据（幂等：可重复执行）
  console.log("Clearing old data...");
  await Word.deleteMany({});
  await WordBank.deleteMany({});
  await User.deleteMany({});
  console.log("Old data cleared.");

  // === 插入 WordBank ===
  console.log("Seeding wordbanks...");
  const wordbanks = await WordBank.insertMany([
    {
      name: "基础高频",
      description: "日常高频核心词汇，适合初学者",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      name: "商务英语",
      description: "职场商务场景常用词汇",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      name: "学术词汇",
      description: "学术写作与阅读高频词汇",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      name: "短语动词",
      description: "常用动词短语与搭配",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    },
  ]);
  console.log(`Inserted ${wordbanks.length} wordbanks.`);

  // 取"基础高频"词库的 _id
  const basicBank = wordbanks.find((wb) => wb.name === "基础高频")!;

  // === 插入 Word（至少 8 个，覆盖所有 physicalImageType） ===
  console.log("Seeding words...");
  const words = await Word.insertMany([
    {
      word: "flow",
      wordbankId: basicBank._id,
      phonetic: "/floʊ/",
      coreMeaning: "沿阻力最小路径持续运动",
      coreExampleEn: "The river flows gently through the valley.",
      coreExampleZh: "河流沿山谷缓缓流动。",
      physicalImageType: "flow",
      physicalImageDescription:
        "液体（如水）沿地形的最低点、阻力最小的路径持续向前运动",
      extendedMeanings: [
        {
          evolutionDescription:
            "流体沿固定方向持续流动 → 思想/语言的连贯状态",
          meaning: "（思想/语言）连贯流畅",
          partOfSpeech: "adj",
          exampleEn:
            "Her presentation was clear and flowed naturally from one point to the next.",
          exampleZh:
            "她的演讲清晰自然，各个要点之间过渡流畅。",
        },
        {
          evolutionDescription:
            "水持续不断地涌出 → 大量事物源源不断地出现",
          meaning: "大量涌现，源源不断",
          partOfSpeech: "verb",
          exampleEn: "Ideas flowed from the brainstorming session.",
          exampleZh: "头脑风暴会议上创意源源不断。",
        },
      ],
      collocations: ["flow rate", "go with the flow", "cash flow"],
    },
    {
      word: "grasp",
      wordbankId: basicBank._id,
      phonetic: "/ɡræsp/",
      coreMeaning: "用手紧紧抓住物体",
      coreExampleEn: "She grasped the handle and pulled the door open.",
      coreExampleZh: "她抓住把手拉开了门。",
      physicalImageType: "grasp",
      physicalImageDescription:
        "手部合拢，五指紧握，牢固地控制住某个物体",
      extendedMeanings: [
        {
          evolutionDescription:
            "用手抓住物体 → 用思维掌握抽象概念",
          meaning: "理解，掌握",
          partOfSpeech: "verb",
          exampleEn:
            "It took me a while to grasp the complexity of the theory.",
          exampleZh: "我花了一段时间才理解这个理论的复杂性。",
        },
        {
          evolutionDescription: "用手抓住不放 → 抓住机会",
          meaning: "抓住（机会），把握",
          partOfSpeech: "verb",
          exampleEn: "You should grasp this opportunity while you can.",
          exampleZh: "你应该趁现在抓住这个机会。",
        },
      ],
      collocations: [
        "grasp the concept",
        "firm grasp",
        "within one's grasp",
      ],
    },
    {
      word: "break",
      wordbankId: basicBank._id,
      phonetic: "/breɪk/",
      coreMeaning: "使物体分裂成多个部分",
      coreExampleEn:
        "He accidentally broke the vase when he knocked it off the table.",
      coreExampleZh: "他不小心把花瓶从桌上碰掉打破了。",
      physicalImageType: "break",
      physicalImageDescription:
        "外力作用于物体，使其结构完整性被破坏，分裂成碎片",
      extendedMeanings: [
        {
          evolutionDescription:
            "物体断裂 → 规则/承诺/习惯被破坏",
          meaning: "违反，打破（规则/承诺）",
          partOfSpeech: "verb",
          exampleEn: "He broke his promise to help us.",
          exampleZh: "他违背了帮助我们的承诺。",
        },
        {
          evolutionDescription:
            "整体崩解 → 关系的终结或系统的崩溃",
          meaning: "（关系）破裂，（系统）崩溃",
          partOfSpeech: "verb",
          exampleEn: "Their marriage broke down after years of conflict.",
          exampleZh: "多年的冲突后，他们的婚姻破裂了。",
        },
      ],
      collocations: ["break the rules", "break down", "take a break"],
    },
    {
      word: "bear",
      wordbankId: basicBank._id,
      phonetic: "/ber/",
      coreMeaning: "承载重物并保持稳定",
      coreExampleEn: "The bridge can bear the weight of heavy trucks.",
      coreExampleZh: "这座桥能承受重型卡车的重量。",
      physicalImageType: "bear",
      physicalImageDescription:
        "身体或结构承受自上而下的重量，支撑住而不倒塌",
      extendedMeanings: [
        {
          evolutionDescription:
            "承载物理重量 → 承受心理/情感压力",
          meaning: "忍受，承受",
          partOfSpeech: "verb",
          exampleEn: "I can't bear the pain any longer.",
          exampleZh: "我再也无法忍受这痛苦了。",
        },
        {
          evolutionDescription:
            "动物生育后代 → 产生结果",
          meaning: "结（果），产生",
          partOfSpeech: "verb",
          exampleEn: "The tree bears fruit every autumn.",
          exampleZh: "这棵树每年秋天结果。",
        },
      ],
      collocations: ["bear the weight", "bear in mind", "bear fruit"],
    },
    {
      word: "drive",
      wordbankId: basicBank._id,
      phonetic: "/draɪv/",
      coreMeaning: "施加力使物体向指定方向前进",
      coreExampleEn: "She drove the car through the crowded streets.",
      coreExampleZh: "她开车穿过拥挤的街道。",
      physicalImageType: "drive",
      physicalImageDescription:
        "引擎/动力源输出扭矩，将力传递到轮子，推动载体向前运动",
      extendedMeanings: [
        {
          evolutionDescription:
            "驱动物理工具前进 → 推动人或事态发展",
          meaning: "驱使，推动",
          partOfSpeech: "verb",
          exampleEn: "Her ambition drove her to work 16 hours a day.",
          exampleZh: "她的野心驱使她每天工作 16 小时。",
        },
        {
          evolutionDescription:
            "驾驶的核心动作 → 提供前进的动力/能量",
          meaning: "驱动力，干劲",
          partOfSpeech: "noun",
          exampleEn: "His drive to succeed is truly remarkable.",
          exampleZh: "他成功的动力实在令人敬佩。",
        },
      ],
      collocations: ["drive home", "hard drive", "drive innovation"],
    },
    {
      word: "light",
      wordbankId: basicBank._id,
      phonetic: "/laɪt/",
      coreMeaning: "发射出光子使黑暗变亮",
      coreExampleEn: "The lamp lit up the entire room.",
      coreExampleZh: "那盏灯照亮了整个房间。",
      physicalImageType: "light",
      physicalImageDescription:
        "光源（太阳/灯泡/火焰）发射光子，照亮周围环境，使事物可见",
      extendedMeanings: [
        {
          evolutionDescription:
            "物理光照亮物体 → 知识/信息使人明白",
          meaning: "阐明，使明白",
          partOfSpeech: "verb",
          exampleEn:
            "Could you shed some light on the company's future plans?",
          exampleZh: "你能透露一下公司未来的计划吗？",
        },
        {
          evolutionDescription: "光明 = 轻松无负担 → 重量/程度轻",
          meaning: "轻的，少量的",
          partOfSpeech: "adj",
          exampleEn: "She was as light as a feather after the diet.",
          exampleZh: "减肥后她轻如羽毛。",
        },
      ],
      collocations: [
        "shed light on",
        "light up",
        "light at the end of the tunnel",
      ],
    },
    {
      word: "leverage",
      wordbankId: basicBank._id,
      phonetic: "/ˈlevərɪdʒ/",
      coreMeaning: "利用杠杆原理以小力撬动大物",
      coreExampleEn:
        "He used a crowbar to leverage the heavy rock out of the ground.",
      coreExampleZh: "他用撬棍把那块大石头从地里撬了出来。",
      physicalImageType: "leverage",
      physicalImageDescription:
        "借助支点将小力放大为大力的机械原理，使用杠杆撬动重物",
      extendedMeanings: [
        {
          evolutionDescription:
            "物理杠杆的力放大 → 用较少资源获得较大收益",
          meaning: "利用（资源/关系）获取优势",
          partOfSpeech: "verb",
          exampleEn:
            "We should leverage our existing customer base for the new product launch.",
          exampleZh: "我们应该利用现有客户群来推广新产品。",
        },
        {
          evolutionDescription:
            "杠杆放大效应 → 在谈判/局势中拥有的优势地位",
          meaning: "影响力，优势地位",
          partOfSpeech: "noun",
          exampleEn:
            "The union has more leverage in negotiations after the strike.",
          exampleZh: "罢工之后，工会在谈判中有了更多筹码。",
        },
      ],
      collocations: [
        "financial leverage",
        "leverage resources",
        "bargaining leverage",
      ],
    },
    {
      word: "yield",
      wordbankId: basicBank._id,
      phonetic: "/jiːld/",
      coreMeaning: "材料在持续外力下发生形变或断裂",
      coreExampleEn: "The steel beam yielded under the immense pressure.",
      coreExampleZh: "钢梁在巨大压力下发生了屈服变形。",
      physicalImageType: "yield",
      physicalImageDescription:
        "材料受持续外力作用，超过弹性极限后发生不可逆形变或最终断裂",
      extendedMeanings: [
        {
          evolutionDescription:
            "材料被迫变形 → 人被迫退让/妥协",
          meaning: "屈服，让步",
          partOfSpeech: "verb",
          exampleEn: "The government refused to yield to the protesters' demands.",
          exampleZh: "政府拒绝向抗议者的要求让步。",
        },
        {
          evolutionDescription:
            "土地/努力的「形变」结果 → 产出/回报",
          meaning: "产出，产生（结果/收益）",
          partOfSpeech: "verb",
          exampleEn: "The investment yielded a 15% return last year.",
          exampleZh: "这项投资去年产生了 15% 的回报。",
        },
      ],
      collocations: ["high yield", "yield results", "yield to pressure"],
    },
  ]);
  console.log(`Inserted ${words.length} words.`);

  // === 插入 User（管理员） ===
  console.log("Seeding users...");
  const users = await User.insertMany([
    {
      username: "admin",
      phone: "13800000000",
      passwordHash: "$2b$10$placeholder",
      role: "admin",
    },
  ]);
  console.log(`Inserted ${users.length} users.`);

  console.log("Seed completed successfully!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
