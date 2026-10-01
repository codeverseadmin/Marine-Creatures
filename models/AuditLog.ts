import mongoose, { Schema, Document, Model } from 'mongoose';

export type AuditAction =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_ARCHIVED'
  | 'PRODUCT_UNARCHIVED'
  | 'PRODUCT_DUPLICATED'
  | 'PRODUCT_MEDIA_UPDATED'
  | 'PRODUCT_SEO_UPDATED'
  | 'PRODUCT_DELETED';

export interface IAuditLogDocument extends Document {
  action: AuditAction;
  entityType: 'product' | 'banner' | 'order' | 'setting';
  entityId: string;
  entityName: string;
  summary: string;
  details?: Record<string, any>;
  actor: string;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, default: 'product', index: true },
    entityId: { type: String, required: true, index: true },
    entityName: { type: String, required: true },
    summary: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    actor: { type: String, default: 'mc_admin_session' },
    ip: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Optimize queries for recent activity log
AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
