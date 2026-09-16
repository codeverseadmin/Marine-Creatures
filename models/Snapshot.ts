import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISnapshotDocument extends Document {
  id: string;
  label: string;
  source: 'automated_cron' | 'admin_manual' | 'system_seed';
  counts: {
    products: number;
    orders: number;
    banners: number;
    inquiries: number;
  };
  data: {
    products: any[];
    orders: any[];
    banners: any[];
    inquiries: any[];
    settings?: Record<string, any>;
  };
  checksum: string;
  sizeBytes: number;
  createdAt: Date;
}

const SnapshotSchema = new Schema<ISnapshotDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    source: {
      type: String,
      enum: ['automated_cron', 'admin_manual', 'system_seed'],
      default: 'admin_manual',
    },
    counts: {
      products: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      banners: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
    },
    data: {
      products: { type: [Schema.Types.Mixed], default: [] },
      orders: { type: [Schema.Types.Mixed], default: [] },
      banners: { type: [Schema.Types.Mixed], default: [] },
      inquiries: { type: [Schema.Types.Mixed], default: [] },
      settings: { type: Schema.Types.Mixed, default: {} },
    },
    checksum: { type: String, required: true },
    sizeBytes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const SnapshotModel: Model<ISnapshotDocument> =
  mongoose.models.Snapshot || mongoose.model<ISnapshotDocument>('Snapshot', SnapshotSchema);
