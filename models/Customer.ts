import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomerDocument extends Document {
  id: string; // e.g. "CUST-9876543210" or "CUST-1001"
  name: string;
  phone: string; // Normalized 10+ digits
  email?: string;
  city: string;
  address?: string;
  pincode?: string;
  tags: string[]; // e.g. ["VIP", "REEF_COMMISSION", "MAINTENANCE_CONTRACT"]
  internalNotes?: string;
  totalOrdersCount: number;
  totalSpend: number;
  enquiriesCount: number;
  projectsCount: number;
  firstContactDate: Date;
  lastActiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, index: true, trim: true },
    email: { type: String, trim: true },
    city: { type: String, default: 'India', trim: true },
    address: { type: String, trim: true },
    pincode: { type: String, trim: true },
    tags: { type: [String], default: [] },
    internalNotes: { type: String, default: '' },
    totalOrdersCount: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    enquiriesCount: { type: Number, default: 0 },
    projectsCount: { type: Number, default: 0 },
    firstContactDate: { type: Date, default: Date.now },
    lastActiveDate: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

CustomerSchema.index({ name: 'text', internalNotes: 'text' });

export const CustomerModel: Model<ICustomerDocument> =
  mongoose.models.Customer ||
  mongoose.model<ICustomerDocument>('Customer', CustomerSchema);
