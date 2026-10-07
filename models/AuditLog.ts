import mongoose, { Schema, Document, Model } from 'mongoose';

export type AuditAction =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_PRICE_UPDATED'
  | 'PRODUCT_ARCHIVED'
  | 'PRODUCT_UNARCHIVED'
  | 'PRODUCT_DUPLICATED'
  | 'PRODUCT_MEDIA_UPDATED'
  | 'PRODUCT_SEO_UPDATED'
  | 'PRODUCT_DELETED'
  | 'CASE_STUDY_CREATED'
  | 'CASE_STUDY_UPDATED'
  | 'CASE_STUDY_PUBLISHED'
  | 'CASE_STUDY_UNPUBLISHED'
  | 'CASE_STUDY_ARCHIVED'
  | 'CASE_STUDY_DUPLICATED'
  | 'CLIENT_PROJECT_CREATED'
  | 'CLIENT_PROJECT_UPDATED'
  | 'CLIENT_PROJECT_ARCHIVED'
  | 'CLIENT_PROJECT_CASE_STUDY_LINKED';

export interface IAuditLogDocument extends Document {
  action: AuditAction;
  entityType: 'product' | 'banner' | 'order' | 'setting' | 'case_study' | 'client_project';
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
