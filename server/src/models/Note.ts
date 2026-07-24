import mongoose, { Schema, Types, Document } from "mongoose";

export interface INote extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  wordId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    wordId: {
      type: Schema.Types.ObjectId,
      ref: "Word",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
  },
  { timestamps: true }
);

// 复合索引：按用户+单词查询笔记
NoteSchema.index({ userId: 1, wordId: 1 });

export const Note = mongoose.model<INote>("Note", NoteSchema);
