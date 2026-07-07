import mongoose, { Schema, Types, Document } from "mongoose";

export interface IUserFavorite extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  wordId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserFavoriteSchema = new Schema<IUserFavorite>(
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
  },
  { timestamps: true }
);

// 复合唯一索引：同一用户不能重复收藏同一单词
UserFavoriteSchema.index({ userId: 1, wordId: 1 }, { unique: true });

export const UserFavorite = mongoose.model<IUserFavorite>(
  "UserFavorite",
  UserFavoriteSchema
);
