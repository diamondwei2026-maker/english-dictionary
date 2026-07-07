import mongoose, { Schema, Types, Document } from "mongoose";

export interface IWordBank extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  gradient: string;
  createdAt: Date;
  updatedAt: Date;
}

const WordBankSchema = new Schema<IWordBank>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    gradient: {
      type: String,
      default: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
  },
  { timestamps: true }
);

export const WordBank = mongoose.model<IWordBank>("WordBank", WordBankSchema);
