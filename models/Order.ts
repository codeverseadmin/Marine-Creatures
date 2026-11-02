import mongoose, { Schema, Document, Model } from 'mongoose';

export type PorPricingStatus = 'STANDARD' | 'PENDING_POR' | 'AGREED';

export interface IOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  priceOnRequest?: boolean;
  agreedUnitPrice?: number;
  pricingStatus?: PorPricingStatus;
  pricedAt?: string;
  pricedBy?: string;
  originalPriceStatus?: string;
}

export interface IOrderHistory {
  step: 'placed' | 'quarantine' | 'packed' | 'dispatched' | 'delivered';
  timestamp: string;
  note: string;
}

export interface IInvoiceRevision {
  revisionNumber: number;
  invoiceNumber: string;
  revisedAt: string;
  revisedBy: string;
  subtotal: number;
  totalAmount: number;
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
    agreedUnitPrice?: number;
    category?: string;
  }>;
  reason?: string;
}

export interface IOrderDocument extends Document {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  orderNotes?: string;
  items: IOrderItem[];
  subtotal: number;
  totalAmount: number;
  currentStep: 'placed' | 'quarantine' | 'packed' | 'dispatched' | 'delivered';
  hasUnresolvedPorItems?: boolean;
  porPricingResolvedAt?: string;
  porPricingResolvedBy?: string;
  pricingVersion?: number;
  originalInvoiceNumber?: string;
  invoiceRevisions?: IInvoiceRevision[];
  awbNumber?: string;
  courierName: string;
  estimatedDelivery: string;
  history: IOrderHistory[];
  isApproved: boolean;
  approvedAt?: string;
  invoiceNumber?: string;
  invoiceTokenHash?: string;
  invoiceTokenCreatedAt?: Date;
  invoiceTokenExpiresAt?: Date;
  createdAt: string;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    image: String,
    category: String,
    priceOnRequest: { type: Boolean, default: false },
    agreedUnitPrice: { type: Number },
    pricingStatus: {
      type: String,
      enum: ['STANDARD', 'PENDING_POR', 'AGREED'],
      default: 'STANDARD',
    },
    pricedAt: { type: String },
    pricedBy: { type: String },
    originalPriceStatus: { type: String },
  },
  { _id: false }
);

const OrderHistorySchema = new Schema<IOrderHistory>(
  {
    step: {
      type: String,
      enum: ['placed', 'quarantine', 'packed', 'dispatched', 'delivered'],
      required: true,
    },
    timestamp: { type: String, required: true },
    note: { type: String, required: true },
  },
  { _id: false }
);

const InvoiceRevisionSchema = new Schema<IInvoiceRevision>(
  {
    revisionNumber: { type: Number, required: true },
    invoiceNumber: { type: String, required: true },
    revisedAt: { type: String, required: true },
    revisedBy: { type: String, required: true },
    subtotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    items: { type: [OrderItemSchema], default: [] },
    reason: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    orderNotes: { type: String, default: '' },
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currentStep: {
      type: String,
      enum: ['placed', 'quarantine', 'packed', 'dispatched', 'delivered'],
      default: 'placed',
    },
    hasUnresolvedPorItems: { type: Boolean, default: false },
    porPricingResolvedAt: { type: String },
    porPricingResolvedBy: { type: String },
    pricingVersion: { type: Number, default: 1 },
    originalInvoiceNumber: { type: String },
    invoiceRevisions: { type: [InvoiceRevisionSchema], default: [] },
    awbNumber: { type: String },
    courierName: { type: String, default: 'Priority Air Cargo Express' },
    estimatedDelivery: { type: String, default: 'Within 24-48 Hours' },
    history: { type: [OrderHistorySchema], default: [] },
    isApproved: { type: Boolean, default: false },
    approvedAt: { type: String },
    invoiceNumber: { type: String },
    invoiceTokenHash: { type: String, index: true, sparse: true },
    invoiceTokenCreatedAt: { type: Date },
    invoiceTokenExpiresAt: { type: Date },
    createdAt: {
      type: String,
      default: () =>
        new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

if (mongoose.models && (mongoose.models as any).Order) {
  delete (mongoose.models as any).Order;
}

export const OrderModel: Model<IOrderDocument> =
  mongoose.model<IOrderDocument>('Order', OrderSchema);
