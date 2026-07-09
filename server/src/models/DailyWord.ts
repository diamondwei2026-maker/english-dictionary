import mongoose, { Schema, Types, Document } from "mongoose";

export interface IDailyWord extends Document {
  _id: Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  wordId: Types.ObjectId;
  isPinned: boolean;
  pinnedBy: Types.ObjectId | null;
  pinnedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DailyWordSchema = new Schema<IDailyWord>(
  {
    date: { type: String, required: true, unique: true },
    wordId: {
      type: Schema.Types.ObjectId,
      ref: "Word",
      required: true,
    },
    isPinned: { type: Boolean, default: false },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pinnedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const DailyWord = mongoose.model<IDailyWord>(
  "DailyWord",
  DailyWordSchema
);
