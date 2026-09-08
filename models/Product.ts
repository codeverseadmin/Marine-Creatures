import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductDocument extends Document {
  id: string;
  name: string;
  scientificName?: string;
  brand?: string;
  category: string;
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  badge?: string;
  inStock: boolean;
  stockCount: number;
  images: string[];
  videos?: string[];
  media?: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    title?: string;
  }>;
  shortDesc: string;
  description: string;
  deliveryInfo?: {
    estimatedDays: string;
    shippingMethod: string;
    guaranteeText: string;
  };
  careGuide?: {
    temperature: string;
    salinity: string;
    ph: string;
    diet?: string;
    temperament?: string;
    minimumTankSize?: string;
    reefSafe?: boolean;
    careLevel?: string;
  };
  hsnCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    scientificName: { type: String },
    brand: { type: String, default: 'Marine Creatures' },
    category: { type: String, required: true, index: true },
    categoryLabel: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 1 },
    badge: { type: String },
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 10 },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    media: [
      {
        id: String,
        type: { type: String, enum: ['image', 'video'] },
        url: String,
        thumbnail: String,
        title: String,
      },
    ],
    shortDesc: { type: String, default: '' },
    description: { type: String, default: '' },
    deliveryInfo: {
      estimatedDays: { type: String, default: '1-2 Days' },
      shippingMethod: { type: String, default: 'Live Air Cargo Express' },
      guaranteeText: { type: String, default: '100% DOA Live Arrival Guaranteed' },
    },
    careGuide: {
      temperature: String,
      salinity: String,
      ph: String,
      diet: String,
      temperament: String,
      minimumTankSize: String,
      reefSafe: Boolean,
      careLevel: String,
    },
    hsnCode: { type: String, default: '01062000' },
  },
  {
    timestamps: true,
  }
);

export const ProductModel: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);
