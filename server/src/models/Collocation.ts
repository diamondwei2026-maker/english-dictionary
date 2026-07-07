import mongoose, { Schema, Types, Document } from "mongoose";

export interface ICollocation extends Document {
  _id: Types.ObjectId;
  phrase: string;
  meaningCn: string;
  exampleEn: string;
  exampleZh: string;
  wordId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CollocationSchema = new Schema<ICollocation>(
  {
    phrase: { type: String, required: true },
    meaningCn: { type: String, required: true },
    exampleEn: { type: String, required: true },
    exampleZh: { type: String, required: true },
    wordId: {
      type: Schema.Types.ObjectId,
      ref: "Word",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Collocation = mongoose.model<ICollocation>(
  "Collocation",
  CollocationSchema
);
