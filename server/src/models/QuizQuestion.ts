import mongoose, { Schema, Types, Document } from "mongoose";

export interface IGlossaryItem {
  word: string;
  meaning: string;
}

export interface ISentenceGlossary {
  verbs: IGlossaryItem[];
  nouns: IGlossaryItem[];
}

export interface IQuizQuestion extends Document {
  _id: Types.ObjectId;
  prompt: string;
  hint: string;
  direction: "zh2en" | "en2zh";
  reference: string;
  keywords: string[];
  analysis: string;
  wordId?: Types.ObjectId;
  wordbankId?: Types.ObjectId;
  /** 句中词汇提示（可选，从种子数据注入） */
  glossary?: ISentenceGlossary;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    prompt: { type: String, required: true, trim: true },
    hint: { type: String, required: true, trim: true },
    direction: {
      type: String,
      required: true,
      enum: ["zh2en", "en2zh"],
      index: true,
    },
    reference: { type: String, required: true, trim: true },
    keywords: {
      type: [{ type: String, trim: true }],
      required: true,
    },
    analysis: { type: String, required: true, trim: true },
    wordId: {
      type: Schema.Types.ObjectId,
      ref: "Word",
      index: true,
    },
    wordbankId: {
      type: Schema.Types.ObjectId,
      ref: "WordBank",
    },
    glossary: {
      type: {
        verbs: [
          {
            word: { type: String, required: true },
            meaning: { type: String, required: true },
          },
        ],
        nouns: [
          {
            word: { type: String, required: true },
            meaning: { type: String, required: true },
          },
        ],
      },
      required: false,
      default: undefined,
    },
  },
  { timestamps: true }
);

export const QuizQuestion = mongoose.model<IQuizQuestion>(
  "QuizQuestion",
  QuizQuestionSchema
);
