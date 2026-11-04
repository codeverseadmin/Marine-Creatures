import mongoose, { Schema, Document, Model } from 'mongoose';
import { PERMISSIONS_REGISTRY } from '@/lib/rbac/permissions';

export interface IRoleDocument extends Document {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  version: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRoleDocument>(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: function (perms: string[]) {
          // Allow wildcard or validate each permission against the registry
          return perms.every((p) => p === '*' || p in PERMISSIONS_REGISTRY);
        },
        message: 'Invalid permission string specified in role',
      },
    },
    version: {
      type: Number,
      default: 1,
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

// Indexes
RoleSchema.index({ id: 1 }, { unique: true });
RoleSchema.index({ isSystem: 1 });

export const RoleModel: Model<IRoleDocument> =
  mongoose.models.Role || mongoose.model<IRoleDocument>('Role', RoleSchema);
