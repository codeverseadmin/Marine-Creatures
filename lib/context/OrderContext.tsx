'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '@/lib/data/products';

export type OrderProgressStep = 'placed' | 'quarantine' | 'packed' | 'dispatched' | 'delivered';

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface StatusUpdateLog {
  status: OrderProgressStep;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface CustomerOrder {
  id: string; // e.g. MC-8921
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  orderNotes?: string;
  items: OrderItem[];
  totalAmount: number;
  currentStep: OrderProgressStep;
  statusHistory: StatusUpdateLog[];
  awbNumber?: string;
  courierName?: string;
  estimatedDelivery: string;
  createdAt: string;
  isApproved?: boolean;
  approvedAt?: string;
  invoiceNumber?: string;
}

interface OrderContextType {
  orders: CustomerOrder[];
  activeOrder: CustomerOrder | null;
  setActiveOrder: (order: CustomerOrder | null) => void;
  isTrackingOpen: boolean;
  setIsTrackingOpen: (open: boolean) => void;
  createOrder: (orderData: Omit<CustomerOrder, 'id' | 'currentStep' | 'statusHistory' | 'createdAt'>) => CustomerOrder;
  updateOrderStatus: (orderId: string, nextStep: OrderProgressStep, note?: string) => void;
  updateOrderTracking: (orderId: string, awbNumber: string, courierName: string) => void;
  approveOrder: (orderId: string, customInvoiceNum?: string) => void;
  deleteOrder: (orderId: string) => void;
  findOrder: (query: string) => CustomerOrder | undefined;
  ownerSignature: string | null;
  setOwnerSignature: (url: string | null) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const STORAGE_KEY = 'mc_customer_orders_v1';

export const TRACKING_STEPS_META: Record<OrderProgressStep, { label: string; icon: string; description: string }> = {
  placed: {
    label: 'Order Confirmed',
    icon: '🧾',
    description: 'Order received and verified by Marine Creatures concierge.',
  },
  quarantine: {
    label: 'Quarantine Check',
    icon: '🔬',
    description: 'Specimen examined in closed-loop quarantine; active feeding verified.',
  },
  packed: {
    label: 'Thermal Pod Packed',
    icon: '📦',
    description: 'Sealed in oxygenated double-layer pouch inside insulated climate pod.',
  },
  dispatched: {
    label: 'Air Cargo Dispatched',
    icon: '✈️',
    description: 'Handed over to priority express airline cargo for fast transit.',
  },
  delivered: {
    label: 'Delivered Safely',
    icon: '🐠',
    description: 'Delivered to destination doorstep. 48-hr LAG guarantee active.',
  },
};

const DEFAULT_ORDERS: CustomerOrder[] = [
  {
    id: 'MC-8921',
    customerName: 'Rahul Verma',
    phone: '9876543210',
    address: 'Flat 402, Coral Heights, 100ft Road, Indiranagar',
    city: 'Bengaluru',
    pincode: '560001',
    isApproved: true,
    approvedAt: '2026-09-08 08:45 AM',
    invoiceNumber: 'INV-MC-8921',
    items: [
      {
        product: {
          id: 'designer-clownfish-pair',
          name: 'Snowflake Ocellaris Clownfish (Bonded Pair)',
          price: 14999,
          category: 'marine-life',
          categoryLabel: 'Marine Life',
          stockCount: 6,
          inStock: true,
          rating: 4.9,
          reviewsCount: 38,
          images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85'],
          shortDesc: 'Captive-bred bonded pair with vivid white patterns.',
          description: 'Our Snowflake Ocellaris Clownfish pairs are captive-bred in closed-loop aquaculture systems.',
          deliveryInfo: {
            estimatedDays: 'Tomorrow Morning',
            shippingMethod: 'Express Air Cargo',
            guaranteeText: '100% Live Arrival Guaranteed',
          },
          specifications: { Origin: 'Indo-Pacific' },
        },
        quantity: 1,
      },
    ],
    totalAmount: 14999,
    currentStep: 'dispatched',
    awbNumber: 'BLR-AIR-892144',
    courierName: 'IndiGo CarGo Priority Express',
    estimatedDelivery: 'Tomorrow, 10:30 AM',
    createdAt: '2026-09-08 08:30 AM',
    statusHistory: [
      {
        status: 'placed',
        title: 'Order Verified',
        description: 'Payment verified and reservation confirmed in livestock holding facility.',
        timestamp: '08:30 AM',
        completed: true,
      },
      {
        status: 'quarantine',
        title: 'Quarantine & Feeding Assessment',
        description: 'Specimen checked under actinic LED; active mysis feeding approved by marine biologist.',
        timestamp: '10:15 AM',
        completed: true,
      },
      {
        status: 'packed',
        title: 'Oxygen Thermal Pod Sealed',
        description: 'Pure medical-grade oxygen added with heat/cool thermal pack in high-density EPS pod.',
        timestamp: '01:45 PM',
        completed: true,
      },
      {
        status: 'dispatched',
        title: 'Dispatched via Air Cargo',
        description: 'Flight 6E-204 departed Kolkata CCU bound for BLR.',
        timestamp: '04:10 PM',
        completed: true,
      },
      {
        status: 'delivered',
        title: 'Doorstep Handover',
        description: 'Delivery agent will hand over insulated pod for immediate drip acclimation.',
        timestamp: 'Pending Handover',
        completed: false,
      },
    ],
  },
];

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<CustomerOrder[]>(DEFAULT_ORDERS);
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(DEFAULT_ORDERS[0]);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [ownerSignature, setOwnerSignatureState] = useState<string | null>(null);

  const SIGNATURE_STORAGE_KEY = 'mc_admin_owner_signature_v1';

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
          setActiveOrder(parsed[0]);
        }
      }
      const savedSig = localStorage.getItem(SIGNATURE_STORAGE_KEY);
      if (savedSig) {
        setOwnerSignatureState(savedSig);
      }
    } catch {
      // ignore
    }

    // Sync latest from MongoDB Atlas in background
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Normalize items if needed
          const normalized = data.data.map((o: any) => {
            const mappedItems = Array.isArray(o.items)
              ? o.items.map((it: any) => ({
                  product: it.product || {
                    id: it.id,
                    name: it.name,
                    price: it.price,
                    category: it.category || 'marine-life',
                    categoryLabel: it.category || 'Marine Life',
                    stockCount: 10,
                    inStock: true,
                    images: it.image ? [it.image] : [],
                    shortDesc: '',
                    description: '',
                    rating: 5,
                    reviewsCount: 1,
                  },
                  quantity: it.quantity || 1,
                }))
              : [];

            return {
              ...o,
              items: mappedItems,
              statusHistory: o.statusHistory || [
                { status: 'placed', title: 'Order Confirmed', description: 'Order confirmed', timestamp: o.createdAt || 'Done', completed: true },
                { status: 'quarantine', title: 'Quarantine Check', description: 'Health check completed', timestamp: 'Done', completed: o.currentStep !== 'placed' },
                { status: 'packed', title: 'Thermal Pod Packed', description: 'Packed in oxygen pod', timestamp: 'Done', completed: ['packed', 'dispatched', 'delivered'].includes(o.currentStep) },
                { status: 'dispatched', title: 'Air Cargo Dispatched', description: 'Dispatched via express', timestamp: 'Done', completed: ['dispatched', 'delivered'].includes(o.currentStep) },
                { status: 'delivered', title: 'Delivered Safely', description: 'Doorstep arrival', timestamp: 'Done', completed: o.currentStep === 'delivered' },
              ],
            };
          });

          setOrders(normalized);
          setActiveOrder((prev) => prev || normalized[0]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }
      })
      .catch((e) => console.warn('Could not sync orders from cloud, using local cache:', e));

    // Fetch cloud owner signature
    fetch('/api/settings?key=ownerSignature')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setOwnerSignatureState(data.data);
          localStorage.setItem(SIGNATURE_STORAGE_KEY, data.data);
        }
      })
      .catch((e) => console.warn('Could not sync signature from cloud:', e));
  }, []);

  const setOwnerSignature = (url: string | null) => {
    setOwnerSignatureState(url);
    try {
      if (url) {
        localStorage.setItem(SIGNATURE_STORAGE_KEY, url);
      } else {
        localStorage.removeItem(SIGNATURE_STORAGE_KEY);
      }
    } catch {
      // ignore
    }

    // Persist to MongoDB settings collection
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'ownerSignature', value: url }),
    }).catch((err) => console.warn('Cloud signature save error:', err));
  };

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      } catch {
        // ignore
      }
    }
  }, [orders, isMounted]);

  const createOrder = (orderData: Omit<CustomerOrder, 'id' | 'currentStep' | 'statusHistory' | 'createdAt'>): CustomerOrder => {
    const id = `MC-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newOrder: CustomerOrder = {
      ...orderData,
      id,
      address: orderData.address || 'Address pending verification',
      invoiceNumber: `INV-${id}`,
      isApproved: false,
      currentStep: 'placed',
      estimatedDelivery: '1–2 Business Days (Express Air Cargo)',
      createdAt: now,
      statusHistory: [
        {
          status: 'placed',
          title: 'Order Confirmed',
          description: 'Your marine order has been registered and verified by Marine Creatures.',
          timestamp: 'Just now',
          completed: true,
        },
        {
          status: 'quarantine',
          title: 'Quarantine Health Inspection',
          description: 'Specimen undergoing parasite check and active feeding verification.',
          timestamp: 'Pending',
          completed: false,
        },
        {
          status: 'packed',
          title: 'Oxygen Thermal Pod Packaging',
          description: 'Insulated climate-controlled packing with activated carbon and pure oxygen.',
          timestamp: 'Pending',
          completed: false,
        },
        {
          status: 'dispatched',
          title: 'Air Cargo Dispatch',
          description: 'Priority flight transfer from Kolkata to destination airport.',
          timestamp: 'Pending',
          completed: false,
        },
        {
          status: 'delivered',
          title: 'Safe Live Arrival',
          description: 'Doorstep handover with 48-Hour Live Arrival Guarantee.',
          timestamp: 'Pending',
          completed: false,
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);

    // Persist to MongoDB orders collection
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newOrder,
        items: newOrder.items.map((it) => ({
          id: it.product.id,
          name: it.product.name,
          price: it.product.price,
          quantity: it.quantity,
          image: it.product.images?.[0] || '',
          category: it.product.category,
        })),
      }),
    }).catch((err) => console.warn('Cloud order create error:', err));

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, nextStep: OrderProgressStep, note?: string) => {
    const stepsSequence: OrderProgressStep[] = ['placed', 'quarantine', 'packed', 'dispatched', 'delivered'];
    const targetIdx = stepsSequence.indexOf(nextStep);

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const updatedHistory = order.statusHistory.map((log) => {
          const logIdx = stepsSequence.indexOf(log.status);
          const isDone = logIdx <= targetIdx;
          return {
            ...log,
            completed: isDone,
            timestamp: isDone && log.timestamp === 'Pending' ? 'Updated today' : log.timestamp,
            description: log.status === nextStep && note ? note : log.description,
          };
        });

        const updated = {
          ...order,
          currentStep: nextStep,
          statusHistory: updatedHistory,
        };

        if (activeOrder?.id === orderId) {
          setActiveOrder(updated);
        }

        return updated;
      })
    );

    fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, currentStep: nextStep }),
    }).catch((err) => console.warn('Cloud order step update error:', err));
  };

  const updateOrderTracking = (orderId: string, awbNumber: string, courierName: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updated = { ...order, awbNumber, courierName };
        if (activeOrder?.id === orderId) {
          setActiveOrder(updated);
        }
        return updated;
      })
    );

    fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, awbNumber, courierName }),
    }).catch((err) => console.warn('Cloud order tracking update error:', err));
  };

  const approveOrder = (orderId: string, customInvoiceNum?: string) => {
    const now = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const targetOrder = orders.find((o) => o.id === orderId);
    const invNum = customInvoiceNum || targetOrder?.invoiceNumber || `INV-${orderId}`;

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updated = {
          ...order,
          isApproved: true,
          approvedAt: now,
          invoiceNumber: invNum,
        };
        if (activeOrder?.id === orderId) {
          setActiveOrder(updated);
        }
        return updated;
      })
    );

    fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: orderId,
        isApproved: true,
        approvedAt: now,
        invoiceNumber: invNum,
      }),
    }).catch((err) => console.warn('Cloud order approval error:', err));
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (activeOrder?.id === orderId) {
      setActiveOrder(null);
    }
  };

  const findOrder = (query: string): CustomerOrder | undefined => {
    const cleanQuery = query.trim().toLowerCase();
    return orders.find(
      (o) =>
        o.id.toLowerCase() === cleanQuery ||
        o.phone.includes(cleanQuery) ||
        (o.awbNumber && o.awbNumber.toLowerCase().includes(cleanQuery))
    );
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrder,
        setActiveOrder,
        isTrackingOpen,
        setIsTrackingOpen,
        createOrder,
        updateOrderStatus,
        updateOrderTracking,
        approveOrder,
        deleteOrder,
        findOrder,
        ownerSignature,
        setOwnerSignature,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
