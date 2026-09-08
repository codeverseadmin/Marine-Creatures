import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInquiryDocument extends Document {
  id: string;
  type: string;
  name: string;
  phone: string;
  email?: string;
  serviceType?: string;
  spaceType?: string;
  tankSize?: string;
  location?: string;
  notes?: string;
  preferredDate?: string;
  items?: string;
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'archived';
  createdAt: string;
}

const InquirySchema = new Schema<IInquiryDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, default: 'custom_quote' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    serviceType: { type: String },
    spaceType: { type: String },
    tankSize: { type: String },
    location: { type: String },
    notes: { type: String },
    preferredDate: { type: String },
    items: { type: String },
    status: {
      type: String,
      enum: ['new', 'contacted', 'scheduled', 'completed', 'archived'],
      default: 'new',
    },
    createdAt: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const InquiryModel: Model<IInquiryDocument> =
  mongoose.models.Inquiry || mongoose.model<IInquiryDocument>('Inquiry', InquirySchema);
