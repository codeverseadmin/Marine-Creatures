import mongoose, { Schema, Document, Model } from 'mongoose';

export type AnalyticsEventType =
  | 'product_view'
  | 'add_to_cart'
  | 'wishlist_toggle'
  | 'checkout_start'
  | 'order_placed'
  | 'enquiry_submitted'
  | 'whatsapp_click';

export interface IAnalyticsEventDocument extends Document {
  eventName: AnalyticsEventType;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, any>;
  ipHash?: string; // Anonymized SHA256 snippet for rate/unique analytics — zero raw PII
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEventDocument>(
  {
    eventName: {
      type: String,
      enum: [
        'product_view',
        'add_to_cart',
        'wishlist_toggle',
        'checkout_start',
        'order_placed',
        'enquiry_submitted',
        'whatsapp_click',
      ],
      required: true,
      index: true,
    },
    entityType: { type: String, index: true },
    entityId: { type: String, index: true },
    entityName: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ipHash: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AnalyticsEventSchema.index({ eventName: 1, createdAt: -1 });

export const AnalyticsEventModel: Model<IAnalyticsEventDocument> =
  mongoose.models.AnalyticsEvent ||
  mongoose.model<IAnalyticsEventDocument>('AnalyticsEvent', AnalyticsEventSchema);
