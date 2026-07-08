import mongoose, { Schema, Types, Document } from "mongoose";

export interface IWordBank extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  cover_image: string;
  gradient: string;
  is_public: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WordBankSchema = new Schema<IWordBank>(
  {
    name: { type: String, required: true, unique: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, required: true },
    cover_image: { type: String, default: "" },
    gradient: {
      type: String,
      default: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    is_public: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const WordBank = mongoose.model<IWordBank>("WordBank", WordBankSchema);
