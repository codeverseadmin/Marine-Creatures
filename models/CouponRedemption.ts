import mongoose, { Schema, Document, Model } from 'mongoose';

export type RedemptionStatus = 'completed' | 'cancelled' | 'refunded';

export interface ICouponRedemptionDocument extends Document {
  id: string;
  couponId: string;
  couponCode: string;
  orderId: string;
  customerPhone: string;
  customerName?: string;
  discountAmount: number;
  eligibleSubtotal: number;
  orderTotal: number;
  status: RedemptionStatus;
  redeemedAt: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CouponRedemptionSchema = new Schema<ICouponRedemptionDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    couponId: { type: String, required: true, index: true },
    couponCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    customerPhone: { type: String, required: true, trim: true, index: true },
    customerName: { type: String, trim: true, default: '' },
    discountAmount: { type: Number, required: true, min: 0 },
    eligibleSubtotal: { type: Number, required: true, min: 0 },
    orderTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['completed', 'cancelled', 'refunded'],
      default: 'completed',
      index: true,
    },
    redeemedAt: { type: Date, default: Date.now, index: true },
    cancelledAt: { type: Date },
    cancelReason: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

CouponRedemptionSchema.index({ couponId: 1, customerPhone: 1, status: 1 });
CouponRedemptionSchema.index({ customerPhone: 1, redeemedAt: -1 });

export const CouponRedemptionModel: Model<ICouponRedemptionDocument> =
  mongoose.models.CouponRedemption ||
  mongoose.model<ICouponRedemptionDocument>('CouponRedemption', CouponRedemptionSchema);

