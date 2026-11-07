import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReviewInvitationDocument extends Document {
  tokenHash: string; // SHA-256 hash of the raw token
  orderId: string;
  productId: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  reviewId?: string;
  createdBy: string;
  createdAt: Date;
}

const ReviewInvitationSchema = new Schema<IReviewInvitationDocument>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    isUsed: { type: Boolean, default: false, index: true },
    usedAt: { type: Date },
    reviewId: { type: String },
    createdBy: { type: String, required: true },
  },
  {
    collection: 'review_invitations',
    timestamps: { createdAt: true, updatedAt: true },
  }
);

ReviewInvitationSchema.index({ orderId: 1, productId: 1 });
ReviewInvitationSchema.index({ isUsed: 1, expiresAt: 1 });

export const ReviewInvitationModel: Model<IReviewInvitationDocument> =
  mongoose.models.ReviewInvitation ||
  mongoose.model<IReviewInvitationDocument>('ReviewInvitation', ReviewInvitationSchema);

