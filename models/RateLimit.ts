import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRateLimitDocument extends Document {
  key: string;
  points: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RateLimitSchema = new Schema<IRateLimitDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    points: { type: Number, required: true, default: 1 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  {
    timestamps: true,
  }
);

export const RateLimitModel: Model<IRateLimitDocument> =
  mongoose.models.RateLimit || mongoose.model<IRateLimitDocument>('RateLimit', RateLimitSchema);
