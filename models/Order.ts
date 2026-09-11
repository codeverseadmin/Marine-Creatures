import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

export interface IOrderHistory {
  step: 'placed' | 'quarantine' | 'packed' | 'dispatched' | 'delivered';
  timestamp: string;
  note: string;
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
  awbNumber?: string;
  courierName: string;
  estimatedDelivery: string;
  history: IOrderHistory[];
  isApproved: boolean;
  approvedAt?: string;
  invoiceNumber?: string;
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
    awbNumber: { type: String },
    courierName: { type: String, default: 'Priority Air Cargo Express' },
    estimatedDelivery: { type: String, default: 'Within 24-48 Hours' },
    history: { type: [OrderHistorySchema], default: [] },
    isApproved: { type: Boolean, default: false },
    approvedAt: { type: String },
    invoiceNumber: { type: String },
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
  }
);

export const OrderModel: Model<IOrderDocument> =
  mongoose.models.Order || mongoose.model<IOrderDocument>('Order', OrderSchema);
