import mongoose, { Schema, Document, Model } from 'mongoose';
import { PERMISSIONS_REGISTRY } from '@/lib/rbac/permissions';

export type EmployeeStatus = 'active' | 'suspended' | 'invited';

export interface IEmployeeDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string | null;
  roleId: string;
  customPermissions: string[];
  status: EmployeeStatus;
  invitationTokenHash?: string | null;
  invitationExpiresAt?: Date | null;
  sessionVersion: number;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  invitedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployeeDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      default: null,
      select: false, // Prevent returning in normal queries
    },
    roleId: {
      type: String,
      required: true,
      trim: true,
    },
    customPermissions: {
      type: [String],
      default: [],
      validate: {
        validator: function (perms: string[]) {
          return perms.every((p) => p === '*' || p in PERMISSIONS_REGISTRY);
        },
        message: 'Invalid permission string specified in employee custom permissions',
      },
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'invited'],
      default: 'invited',
    },
    invitationTokenHash: {
      type: String,
      default: null,
      select: false, // Prevent leaking token hash in normal queries
    },
    invitationExpiresAt: {
      type: Date,
      default: null,
    },
    sessionVersion: {
      type: Number,
      default: 1,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
    invitedBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EmployeeSchema.index({ email: 1 }, { unique: true });
EmployeeSchema.index({ status: 1 });
EmployeeSchema.index({ roleId: 1 });
EmployeeSchema.index({ invitationTokenHash: 1 }, { sparse: true });

export const EmployeeModel: Model<IEmployeeDocument> =
  mongoose.models.Employee || mongoose.model<IEmployeeDocument>('Employee', EmployeeSchema);
