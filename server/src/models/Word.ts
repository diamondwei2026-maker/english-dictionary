import mongoose, { Schema, Types, Document } from "mongoose";

// === 难度等级枚举 ===

export const DIFFICULTY_LEVELS = [
  "primary",      // 小学
  "junior",       // 初中
  "senior",       // 高中
  "college",      // 大学
  "cet4",         // 四级
  "cet6",         // 六级
  "tem4",         // 专四
  "tem8",         // 专八
  "ielts",        // 雅思
  "toefl",        // 托福
  "gre",          // GRE
  "other",        // 其他/未分类
] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

// === 枚举常量 ===

const PHYSICAL_IMAGE_TYPES = [
  "flow",
  "grasp",
  "break",
  "bear",
  "drive",
  "light",
  "leverage",
  "yield",
] as const;

type PhysicalImageType = (typeof PHYSICAL_IMAGE_TYPES)[number] | "";

const PART_OF_SPEECH_TYPES = [
  "noun",
  "verb",
  "adj",
  "adv",
  "prep",
  "conj",
  "pron",
  "other",
] as const;

type PartOfSpeech = (typeof PART_OF_SPEECH_TYPES)[number];

// === 接口定义 ===

export interface IExtendedMeaning {
  _id: Types.ObjectId;
  evolutionDescription: string;
  meaning: string;
  partOfSpeech: PartOfSpeech;
  exampleEn: string;
  exampleZh: string;
}

export interface IWord extends Document {
  _id: Types.ObjectId;
  word: string;
  wordbankId: Types.ObjectId;
  phonetic?: string;
  coreMeaning: string;
  coreExampleEn: string;
  coreExampleZh: string;
  physicalImageType: PhysicalImageType;
  physicalImageDescription: string;
  coreImageSvg?: string;
  extendedMeanings: IExtendedMeaning[];
  collocations: string[];
  difficulty: DifficultyLevel;
  createdAt: Date;
  updatedAt: Date;
}

// === ExtendedMeaning 子文档 Schema ===

const ExtendedMeaningSchema = new Schema<IExtendedMeaning>(
  {
    evolutionDescription: { type: String, required: true },
    meaning: { type: String, required: true },
    partOfSpeech: {
      type: String,
      required: true,
      enum: PART_OF_SPEECH_TYPES,
    },
    exampleEn: { type: String, required: true },
    exampleZh: { type: String, required: true },
  },
  { _id: true }
);

// === Word Schema ===

const WordSchema = new Schema<IWord>(
  {
    word: { type: String, required: true, index: true },
    wordbankId: {
      type: Schema.Types.ObjectId,
      ref: "WordBank",
      required: true,
      index: true,
    },
    phonetic: { type: String },
    coreMeaning: { type: String, required: true },
    coreExampleEn: { type: String, required: true },
    coreExampleZh: { type: String, required: true },
    physicalImageType: {
      type: String,
      default: "",
      enum: { values: [...PHYSICAL_IMAGE_TYPES, ""], message: "无效的物理意象类型" },
    },
    physicalImageDescription: { type: String, default: "" },
    coreImageSvg: { type: String, default: "" },
    extendedMeanings: [ExtendedMeaningSchema],
    collocations: [{ type: String }],
    difficulty: {
      type: String,
      enum: { values: [...DIFFICULTY_LEVELS], message: "无效的难度等级" },
      default: "other",
      index: true,
    },
  },
  { timestamps: true }
);

// Text 索引（全文搜索 coreMeaning）
WordSchema.index({ coreMeaning: "text" });

// 复合唯一索引：同一词库内单词名唯一
WordSchema.index({ wordbankId: 1, word: 1 }, { unique: true });

export const Word = mongoose.model<IWord>("Word", WordSchema);
export { PHYSICAL_IMAGE_TYPES, PART_OF_SPEECH_TYPES };
