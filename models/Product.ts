import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductDocument extends Document {
  id: string;
  name: string;
  scientificName?: string;
  brand?: string;
  itemType?: 'live' | 'dry';
  category: string;
  categoryLabel: string;
  price: number;
  compareAtPrice?: number;
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
  priceOnRequest?: boolean;
  availabilityStatus?: 'AVAILABLE' | 'LIMITED' | 'ON REQUEST' | 'QUARANTINED' | 'OUT OF STOCK';
  availabilityNote?: string;
  isQuarantined?: boolean;
  rarity?: string;
  feedingCondition?: string;
  origin?: string;
  variants?: Array<{
    id: string;
    name: string;
    sku?: string;
    specs?: Record<string, string>;
    inStock?: boolean;
  }>;
  imageStatus?: 'VERIFIED' | 'NEEDS_LICENSE_REVIEW' | 'NEEDS_MEDIA_ASSET';
  researchStatus?: 'READY' | 'NEEDS_REVIEW' | 'RESEARCH_UNCERTAIN';
  researchSources?: Array<{
    sourceName: string;
    sourceUrl: string;
    sourceType: string;
    accessedAt: string;
  }>;
  isArchived?: boolean;
  archivedAt?: Date;
  sku?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalOverride?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    sku: { type: String, index: true },
    name: { type: String, required: true },
    scientificName: { type: String },
    brand: { type: String, default: 'Marine Creatures' },
    itemType: { type: String, enum: ['live', 'dry'], default: 'dry' },
    category: { type: String, required: true, index: true },
    categoryLabel: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
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
    priceOnRequest: { type: Boolean, default: false },
    availabilityStatus: { type: String, default: 'AVAILABLE' },
    availabilityNote: { type: String },
    isQuarantined: { type: Boolean, default: false },
    rarity: { type: String },
    feedingCondition: { type: String },
    origin: { type: String },
    variants: [
      {
        id: String,
        name: String,
        sku: String,
        specs: Schema.Types.Mixed,
        inStock: Boolean,
      },
    ],
    imageStatus: { type: String, default: 'VERIFIED' },
    researchStatus: { type: String, default: 'READY' },
    researchSources: [
      {
        sourceName: String,
        sourceUrl: String,
        sourceType: String,
        accessedAt: String,
      },
    ],
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
    seoTitle: { type: String },
    seoDescription: { type: String },
    canonicalOverride: { type: String },
    ogTitle: { type: String },
    ogDescription: { type: String },
    ogImage: { type: String },
    noIndex: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ProductModel: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);
