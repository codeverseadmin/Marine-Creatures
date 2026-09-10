import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedia extends Document {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  data: Buffer;
  type: 'image' | 'video';
  createdAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    id: { type: String, required: true, unique: true, index: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const MediaModel: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);
