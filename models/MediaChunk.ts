import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMediaChunk extends Document {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  size: number;
  data: Buffer;
  createdAt: Date;
}

const MediaChunkSchema = new Schema<IMediaChunk>(
  {
    uploadId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    totalChunks: { type: Number, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 }, // 1-hour TTL for abandoned chunk cleanup
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring idempotency per chunk
MediaChunkSchema.index({ uploadId: 1, chunkIndex: 1 }, { unique: true });

export const MediaChunkModel: Model<IMediaChunk> =
  mongoose.models.MediaChunk || mongoose.model<IMediaChunk>('MediaChunk', MediaChunkSchema);
