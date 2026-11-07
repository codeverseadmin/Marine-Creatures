import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REPORTED';

export interface IReviewImage {
  id: string;
  url: string;
  mimeType: string;
  fileSize: number;
  isApproved: boolean;
}

export interface IProductReviewDocument extends Document {
  id: string;
  productId: string;
  productName: string;
  orderId: string;
  orderItemId?: string;
  customerDisplayName: string;
  customerLocation?: string;
  customerPhoneMasked: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  images: IReviewImage[];
  verifiedPurchase: boolean;
  status: ReviewStatus;
  invitationTokenHash: string;
  submittedAt: Date;
  moderatedAt?: Date;
  moderatedBy?: string;
  moderationReason?: string;
}

const ReviewImageSchema = new Schema<IReviewImage>(
  {
    id: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    isApproved: { type: Boolean, default: true },
  },
  { _id: false }
);

const ProductReviewSchema = new Schema<IProductReviewDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    orderId: { type: String, required: true, index: true },
    orderItemId: { type: String },
    customerDisplayName: { type: String, required: true },
    customerLocation: { type: String },
    customerPhoneMasked: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 120 },
    comment: { type: String, required: true, maxlength: 2000 },
    images: { type: [ReviewImageSchema], default: [] },
    verifiedPurchase: { type: Boolean, default: true, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REPORTED'],
      default: 'PENDING',
      index: true,
    },
    invitationTokenHash: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now, index: true },
    moderatedAt: { type: Date },
    moderatedBy: { type: String },
    moderationReason: { type: String },
  },
  {
    collection: 'product_reviews',
    timestamps: true,
  }
);

// Compound Indexes for fast queries & unique purchase review constraint
ProductReviewSchema.index({ productId: 1, status: 1 });
ProductReviewSchema.index({ orderId: 1, productId: 1 }, { unique: true });
ProductReviewSchema.index({ status: 1, submittedAt: -1 });

export const ProductReviewModel: Model<IProductReviewDocument> =
  mongoose.models.ProductReview ||
  mongoose.model<IProductReviewDocument>('ProductReview', ProductReviewSchema);

