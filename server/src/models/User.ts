import mongoose, { Schema, Types, Document } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  phone: string;
  passwordHash: string;
  role: "user" | "admin";
  learnedWords: Types.ObjectId[];
  favoriteWords: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^1[3-9]\d{9}$/,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["user", "admin"],
      default: "user",
    },
    learnedWords: [{ type: Schema.Types.ObjectId, ref: "Word" }],
    favoriteWords: [{ type: Schema.Types.ObjectId, ref: "Word" }],
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
