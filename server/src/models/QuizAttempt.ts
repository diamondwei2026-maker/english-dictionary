import mongoose, { Schema, Types, Document } from "mongoose";

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  questionId: Types.ObjectId;
  userInput: string;
  score: number;
  correct: boolean;
  matched: string[];
  missing: string[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "QuizQuestion",
      required: true,
      index: true,
    },
    userInput: { type: String, required: true, trim: true },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    correct: { type: Boolean, required: true },
    matched: { type: [String], default: [] },
    missing: { type: [String], default: [] },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 复合索引：按用户+题目查询答题记录（同一用户可多次答同一题）
QuizAttemptSchema.index({ userId: 1, questionId: 1 });
// 复合索引：覆盖 generateQuiz(24h排除)、getHistory(按时间排序)、getStats(7日趋势) 三类查询
QuizAttemptSchema.index({ userId: 1, submittedAt: -1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>(
  "QuizAttempt",
  QuizAttemptSchema
);
