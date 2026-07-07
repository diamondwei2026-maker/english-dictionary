import mongoose, { Schema, Types, Document } from "mongoose";

export interface ILearningRecord extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  wordId: Types.ObjectId;
  learnCount: number;
  lastLearnedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LearningRecordSchema = new Schema<ILearningRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wordId: {
      type: Schema.Types.ObjectId,
      ref: "Word",
      required: true,
      index: true,
    },
    learnCount: { type: Number, required: true, default: 0 },
    lastLearnedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 复合唯一索引：每个用户对每个单词只有一条学习记录
LearningRecordSchema.index({ userId: 1, wordId: 1 }, { unique: true });

export const LearningRecord = mongoose.model<ILearningRecord>(
  "LearningRecord",
  LearningRecordSchema
);
