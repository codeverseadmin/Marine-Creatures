import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICaseStudyDocument extends Document {
  id: string; // Slug, e.g. "alipore-penthouse-monolith"
  slug: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  projectId?: string; // Reference to ClientProject.id
  status: 'draft' | 'review' | 'published' | 'archived';
  published: boolean;
  publishedAt?: Date;
  featured: boolean;
  isArchived: boolean;
  archivedAt?: Date;
  space: string;
  clientContext?: string;
  scale: string;
  aquariumVolume?: string;
  aquariumType?: string;
  biome?: string;
  image: string; // Hero image URL
  gallery: Array<{
    url: string;
    caption?: string;
    alt?: string;
  }>;
  beforeAfter?: {
    beforeImage?: string;
    afterImage?: string;
    beforeLabel?: string;
    afterLabel?: string;
    caption?: string;
  };
  imageStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'FALLBACK';
  designIntent: string;
  result: string;
  materials: string[];
  engineering: string[];
  marineWorld: {
    biome: string;
    livestock: string;
    corals: string;
  };
  introduction?: string;
  challenge?: string;
  concept?: string;
  architecture?: string;
  execution?: string;
  transformation?: string;
  conclusion?: string;
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

const CaseStudySchema = new Schema<ICaseStudyDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    eyebrow: { type: String, trim: true },
    projectId: { type: String, index: true },
    status: {
      type: String,
      enum: ['draft', 'review', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
    featured: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
    space: { type: String, required: true, trim: true },
    clientContext: { type: String, trim: true },
    scale: { type: String, required: true, trim: true },
    aquariumVolume: { type: String, trim: true },
    aquariumType: { type: String, trim: true },
    biome: { type: String, trim: true },
    image: { type: String, required: true, trim: true },
    gallery: [
      {
        url: { type: String, required: true },
        caption: { type: String },
        alt: { type: String },
      },
    ],
    beforeAfter: {
      beforeImage: { type: String },
      afterImage: { type: String },
      beforeLabel: { type: String, default: 'Before Commission' },
      afterLabel: { type: String, default: 'Living Ocean' },
      caption: { type: String },
    },
    imageStatus: {
      type: String,
      enum: ['VERIFIED', 'NEEDS_REVIEW', 'FALLBACK'],
      default: 'VERIFIED',
    },
    designIntent: { type: String, required: true },
    result: { type: String, required: true },
    materials: [{ type: String }],
    engineering: [{ type: String }],
    marineWorld: {
      biome: { type: String, default: '' },
      livestock: { type: String, default: '' },
      corals: { type: String, default: '' },
    },
    introduction: { type: String },
    challenge: { type: String },
    concept: { type: String },
    architecture: { type: String },
    execution: { type: String },
    transformation: { type: String },
    conclusion: { type: String },
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

export const CaseStudyModel: Model<ICaseStudyDocument> =
  mongoose.models.CaseStudy || mongoose.model<ICaseStudyDocument>('CaseStudy', CaseStudySchema);

export default CaseStudyModel;
