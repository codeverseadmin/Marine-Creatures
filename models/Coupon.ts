import mongoose, { Schema, Document, Model } from 'mongoose';

export type DiscountType = 'percentage' | 'fixed';
export type CouponStatus = 'draft' | 'active' | 'paused' | 'expired' | 'exhausted' | 'deactivated';
export type CustomerEligibility = 'all' | 'first_order' | 'existing';

export interface IProductRestrictions {
  includedProductIds?: string[];
  includedCategories?: string[];
  includedBrands?: string[];
  excludedProductIds?: string[];
  excludedCategories?: string[];
}

export interface ICouponDocument extends Document {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minSubtotal: number;
  startDate: Date;
  expiryDate: Date;
  status: CouponStatus;
  totalUsageLimit?: number;
  perCustomerUsageLimit?: number;
  customerEligibility: CustomerEligibility;
  productRestrictions: IProductRestrictions;
  totalRedemptions: number;
  totalDiscountGranted: number;
  internalNotes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductRestrictionsSchema = new Schema<IProductRestrictions>(
  {
    includedProductIds: { type: [String], default: [] },
    includedCategories: { type: [String], default: [] },
    includedBrands: { type: [String], default: [] },
    excludedProductIds: { type: [String], default: [] },
    excludedCategories: { type: [String], default: [] },
  },
  { _id: false }
);

const CouponSchema = new Schema<ICouponDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: { type: String, trim: true, default: '' },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    minSubtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'expired', 'exhausted', 'deactivated'],
      default: 'draft',
      index: true,
    },
    totalUsageLimit: {
      type: Number,
      min: 1,
    },
    perCustomerUsageLimit: {
      type: Number,
      min: 1,
      default: 1,
    },
    customerEligibility: {
      type: String,
      enum: ['all', 'first_order', 'existing'],
      default: 'all',
    },
    productRestrictions: {
      type: ProductRestrictionsSchema,
      default: () => ({}),
    },
    totalRedemptions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDiscountGranted: {
      type: Number,
      default: 0,
      min: 0,
    },
    internalNotes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: String,
      default: 'system',
    },
  },
  {
    timestamps: true,
  }
);

CouponSchema.index({ status: 1, startDate: 1, expiryDate: 1 });

export const CouponModel: Model<ICouponDocument> =
  mongoose.models.Coupon || mongoose.model<ICouponDocument>('Coupon', CouponSchema);

