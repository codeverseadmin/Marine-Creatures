import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';

const DEFAULT_ORDERS_SEED = [
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
        id: 'designer-clownfish-pair',
        name: 'Snowflake Ocellaris Clownfish (Bonded Pair)',
        price: 14999,
        quantity: 1,
        category: 'marine-life',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 14999,
    totalAmount: 14999,
    currentStep: 'dispatched',
    awbNumber: 'BLR-AIR-892144',
    courierName: 'IndiGo CarGo Priority Express',
    estimatedDelivery: 'Tomorrow, 10:30 AM',
    history: [
      { step: 'placed', timestamp: 'Yesterday, 10:15 AM', note: 'Order placed via WhatsApp & validated' },
      { step: 'quarantine', timestamp: 'Yesterday, 02:30 PM', note: 'Salinity & proactive dip completed' },
      { step: 'packed', timestamp: 'Today, 06:00 AM', note: 'Medical grade pure oxygen packed in thermal container' },
      { step: 'dispatched', timestamp: 'Today, 08:30 AM', note: 'Air Cargo flight 6E-442 departed Kolkata' },
    ],
    createdAt: '2026-09-07 10:15 AM',
  },
  {
    id: 'MC-8922',
    customerName: 'Dr. Ananya Sen',
    phone: '9830112233',
    address: 'Villa 14, Silver Oak Estate, New Town Action Area II',
    city: 'Kolkata',
    pincode: '700156',
    isApproved: false,
    orderNotes: 'Please ring the bell twice and place directly in shade.',
    items: [
      {
        id: 'emperor-angelfish-juvenile',
        name: 'Emperor Angelfish (Juvenile to Adult Transition)',
        price: 18500,
        quantity: 1,
        category: 'marine-life',
        image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 18500,
    totalAmount: 18500,
    currentStep: 'quarantine',
    courierName: 'Marine Creatures Temperature-Controlled Van',
    estimatedDelivery: 'Tomorrow, 04:00 PM',
    history: [
      { step: 'placed', timestamp: 'Today, 09:00 AM', note: 'Custom reef livestock order received' },
      { step: 'quarantine', timestamp: 'Today, 11:30 AM', note: 'Acanthurus dip and health check active' },
    ],
    createdAt: '2026-09-08 09:00 AM',
  },
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const query = searchParams.get('q');

    let filter: any = {};
    if (phone) {
      filter.phone = phone.replace(/\D/g, '');
    } else if (query) {
      filter.$or = [
        { id: { $regex: query, $options: 'i' } },
        { customerName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } },
        { invoiceNumber: { $regex: query, $options: 'i' } },
      ];
    }

    let orders = await OrderModel.find(filter).sort({ createdAt: -1 }).lean();

    // Auto-seed demo orders if database orders collection is empty
    if (!orders || orders.length === 0) {
      if (!phone && !query) {
        console.log('🌱 Seeding initial demo orders into MongoDB Atlas...');
        try {
          await OrderModel.insertMany(DEFAULT_ORDERS_SEED, { ordered: false });
          orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
        } catch (seedErr) {
          console.warn('Orders auto-seed notice:', seedErr);
          orders = await OrderModel.find({}).sort({ createdAt: -1 }).lean();
        }
      }
    }

    return NextResponse.json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    console.error('Failed to fetch orders from MongoDB:', error.message);
    return NextResponse.json({
      success: false,
      fallback: true,
      data: DEFAULT_ORDERS_SEED,
      error: error.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.id || !body.customerName || !body.phone || !body.address) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields (id, customerName, phone, address)' },
        { status: 400 }
      );
    }

    const newOrder = await OrderModel.create(body);
    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order id is required' }, { status: 400 });
    }

    const updated = await OrderModel.findOneAndUpdate({ id }, updates, {
      new: true,
      upsert: true,
    }).lean();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
