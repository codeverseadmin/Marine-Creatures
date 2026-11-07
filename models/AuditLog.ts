import mongoose, { Schema, Document, Model } from 'mongoose';

export type AuditAction =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_PRICE_UPDATED'
  | 'PRODUCT_WARRANTY_UPDATED'
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
  | 'CLIENT_PROJECT_CASE_STUDY_LINKED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_APPROVED'
  | 'ORDER_TRACKING_UPDATED'
  | 'ORDER_POR_PRICED'
  | 'ORDER_POR_PRICE_REVISED'
  | 'ORDER_DELETED'
  | 'ENQUIRY_STATUS_CHANGED'
  | 'ENQUIRY_DELETED'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'MAINTENANCE_CREATED'
  | 'MAINTENANCE_UPDATED'
  | 'FOLLOW_UP_CREATED'
  | 'FOLLOW_UP_COMPLETED'
  | 'CONTENT_UPDATED'
  | 'BANNER_CREATED'
  | 'BANNER_UPDATED'
  | 'BANNER_DELETED'
  | 'SNAPSHOT_CREATED'
  | 'SNAPSHOT_RESTORED'
  | 'SYSTEM_SETTINGS_UPDATED'
  | 'EMPLOYEE_CREATED'
  | 'EMPLOYEE_INVITED'
  | 'EMPLOYEE_INVITATION_ACCEPTED'
  | 'EMPLOYEE_UPDATED'
  | 'EMPLOYEE_SUSPENDED'
  | 'EMPLOYEE_REACTIVATED'
  | 'EMPLOYEE_DELETED'
  | 'EMPLOYEE_SESSIONS_REVOKED'
  | 'ROLE_CREATED'
  | 'ROLE_UPDATED'
  | 'ROLE_DELETED'
  | 'EMPLOYEE_LOGIN_SUCCESS'
  | 'EMPLOYEE_LOGIN_FAILED'
  | 'FIRST_OWNER_BOOTSTRAPPED'
  | 'REVIEW_SUBMITTED'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED'
  | 'REVIEW_INVITATION_CREATED';

export type AuditEntityType =
  | 'product'
  | 'banner'
  | 'order'
  | 'setting'
  | 'case_study'
  | 'client_project'
  | 'customer'
  | 'enquiry'
  | 'maintenance'
  | 'follow_up'
  | 'snapshot'
  | 'security'
  | 'employee'
  | 'role'
  | 'review'
  | 'review_invitation';

export interface IAuditLogDocument extends Document {
  action: AuditAction;
  entityType: AuditEntityType;
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
