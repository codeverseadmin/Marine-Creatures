import mongoose, { Schema, Document, Model } from 'mongoose';

export type FollowUpTargetType = 'enquiry' | 'order' | 'project' | 'customer' | 'maintenance';
export type FollowUpPriority = 'urgent' | 'high' | 'medium' | 'routine';
export type FollowUpChannel = 'whatsapp' | 'phone_call' | 'email' | 'site_survey';
export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

export interface IFollowUpDocument extends Document {
  id: string; // e.g. "FLW-001"
  title: string;
  targetType: FollowUpTargetType;
  targetId: string;
  customerName: string;
  customerPhone: string;
  dueDate: Date;
  priority: FollowUpPriority;
  channel: FollowUpChannel;
  notes?: string;
  status: FollowUpStatus;
  completedAt?: Date;
  completedNotes?: string;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUpDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    targetType: {
      type: String,
      enum: ['enquiry', 'order', 'project', 'customer', 'maintenance'],
      required: true,
      index: true,
    },
    targetId: { type: String, required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true, index: true },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'routine'],
      default: 'medium',
      index: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'phone_call', 'email', 'site_survey'],
      default: 'whatsapp',
    },
    notes: { type: String },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    completedAt: { type: Date },
    completedNotes: { type: String },
    assignedTo: { type: String, default: 'Suraj' },
  },
  {
    timestamps: true,
  }
);

FollowUpSchema.index({ dueDate: 1, status: 1 });

export const FollowUpModel: Model<IFollowUpDocument> =
  mongoose.models.FollowUp ||
  mongoose.model<IFollowUpDocument>('FollowUp', FollowUpSchema);
