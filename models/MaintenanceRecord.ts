import mongoose, { Schema, Document, Model } from 'mongoose';

export type ServiceType =
  | 'routine_biweekly'
  | 'monthly_deep_clean'
  | 'emergency_parameter_correction'
  | 'quarantine_commissioning'
  | 'filtration_media_refresh'
  | 'equipment_calibration';

export type MaintenanceStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export interface IWaterParameters {
  salinity?: string; // e.g. "1.025 SG"
  ph?: string; // e.g. "8.2"
  alkalinity?: string; // e.g. "8.5 dKH"
  calcium?: string; // e.g. "430 ppm"
  magnesium?: string; // e.g. "1350 ppm"
  nitrate?: string; // e.g. "2.5 ppm"
  phosphate?: string; // e.g. "0.03 ppm"
  temperature?: string; // e.g. "25.5 °C"
}

export interface IMaintenanceRecordDocument extends Document {
  id: string; // e.g. "MAINT-2026-001"
  customerId?: string;
  customerName: string;
  customerPhone: string;
  clientProjectId?: string;
  projectName?: string;
  aquariumVolume?: string;
  aquariumType?: string;
  serviceDate: Date;
  nextServiceDate: Date;
  serviceType: ServiceType;
  status: MaintenanceStatus;
  waterParameters?: IWaterParameters;
  dosingAndMedia?: string;
  livestockCondition?: string;
  technicianName: string;
  checklistCompleted: string[];
  notes?: string;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WaterParametersSchema = new Schema<IWaterParameters>(
  {
    salinity: String,
    ph: String,
    alkalinity: String,
    calcium: String,
    magnesium: String,
    nitrate: String,
    phosphate: String,
    temperature: String,
  },
  { _id: false }
);

const MaintenanceRecordSchema = new Schema<IMaintenanceRecordDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, index: true, trim: true },
    clientProjectId: { type: String, index: true },
    projectName: { type: String, trim: true },
    aquariumVolume: { type: String, trim: true },
    aquariumType: { type: String, trim: true },
    serviceDate: { type: Date, required: true, index: true },
    nextServiceDate: { type: Date, required: true, index: true },
    serviceType: {
      type: String,
      enum: [
        'routine_biweekly',
        'monthly_deep_clean',
        'emergency_parameter_correction',
        'quarantine_commissioning',
        'filtration_media_refresh',
        'equipment_calibration',
      ],
      default: 'routine_biweekly',
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'],
      default: 'scheduled',
      index: true,
    },
    waterParameters: { type: WaterParametersSchema, default: {} },
    dosingAndMedia: { type: String },
    livestockCondition: { type: String },
    technicianName: { type: String, required: true, default: 'Suraj / Marine Lead Tech' },
    checklistCompleted: { type: [String], default: [] },
    notes: { type: String },
    photos: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

MaintenanceRecordSchema.index({ serviceDate: -1, status: 1 });

export const MaintenanceRecordModel: Model<IMaintenanceRecordDocument> =
  mongoose.models.MaintenanceRecord ||
  mongoose.model<IMaintenanceRecordDocument>('MaintenanceRecord', MaintenanceRecordSchema);
