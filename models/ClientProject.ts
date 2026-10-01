import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClientProjectDocument extends Document {
  id: string; // Project code, e.g. "CP-2025-001"
  projectName: string;
  status:
    | 'lead'
    | 'planning'
    | 'design'
    | 'fabrication'
    | 'installation'
    | 'completed'
    | 'archived';
  installationStatus: 'pending' | 'in_progress' | 'commissioning' | 'completed';
  aquariumVolume?: string;
  aquariumType?: string;
  biome?: string;
  designStyle?: string;
  materials: string[];
  equipment: string[];
  marineLifeNotes?: string;
  installationDetails?: string;
  city: string;
  siteType: 'residential' | 'commercial' | 'hospitality' | 'institutional';
  // STRICTLY PRIVATE CLIENT DATA
  privateAddress?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  projectStartDate?: Date;
  projectCompletionDate?: Date;
  internalNotes?: string;
  estimatedBudget?: number;
  caseStudyId?: string; // Reference to published or linked CaseStudy.id
  internalGallery: string[];
  isArchived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClientProjectSchema = new Schema<IClientProjectDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    projectName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: [
        'lead',
        'planning',
        'design',
        'fabrication',
        'installation',
        'completed',
        'archived',
      ],
      default: 'lead',
      index: true,
    },
    installationStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'commissioning', 'completed'],
      default: 'pending',
    },
    aquariumVolume: { type: String, trim: true },
    aquariumType: { type: String, trim: true },
    biome: { type: String, trim: true },
    designStyle: { type: String, trim: true },
    materials: [{ type: String }],
    equipment: [{ type: String }],
    marineLifeNotes: { type: String },
    installationDetails: { type: String },
    city: { type: String, required: true, trim: true },
    siteType: {
      type: String,
      enum: ['residential', 'commercial', 'hospitality', 'institutional'],
      default: 'residential',
    },
    // STRICTLY PRIVATE CLIENT DATA
    privateAddress: { type: String, trim: true },
    clientName: { type: String, trim: true },
    clientPhone: { type: String, trim: true },
    clientEmail: { type: String, trim: true },
    projectStartDate: { type: Date },
    projectCompletionDate: { type: Date },
    internalNotes: { type: String },
    estimatedBudget: { type: Number },
    caseStudyId: { type: String, index: true },
    internalGallery: [{ type: String }],
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const ClientProjectModel: Model<IClientProjectDocument> =
  mongoose.models.ClientProject ||
  mongoose.model<IClientProjectDocument>('ClientProject', ClientProjectSchema);

export default ClientProjectModel;
