import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBannerDocument extends Document {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  ctaText?: string;
  ctaLink?: string;
  bgGradient?: string;
  image?: string;
  overlayOpacity?: number;
  active: boolean;
  order: number;
}

const BannerSchema = new Schema<IBannerDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    badge: String,
    badgeColor: String,
    ctaText: { type: String, default: 'EXPLORE NOW →' },
    ctaLink: { type: String, default: '/marketplace' },
    bgGradient: String,
    image: String,
    overlayOpacity: { type: Number, default: 0.6 },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const BannerModel: Model<IBannerDocument> =
  mongoose.models.Banner || mongoose.model<IBannerDocument>('Banner', BannerSchema);
