import fs from 'fs';
import mongoose from 'mongoose';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

async function main() {
  const uri = env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in .env.local');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('=== COLLECTIONS ===');
  const cols = await db.listCollections().toArray();
  console.log(cols.map((c) => c.name));

  console.log('\n=== TOTAL ORDERS COUNT ===');
  const totalOrders = await db.collection('orders').countDocuments();
  console.log('Total orders in DB:', totalOrders);

  console.log('\n=== RECENT 10 ORDERS ===');
  const recentOrders = await db
    .collection('orders')
    .find({})
    .sort({ _id: -1 })
    .limit(10)
    .toArray();

  recentOrders.forEach((o) => {
    console.log({
      id: o.id,
      _id: o._id,
      createdAt: o.createdAt,
      currentStep: o.currentStep,
      isApproved: o.isApproved,
      subtotal: o.subtotal,
      totalAmount: o.totalAmount,
      coupon: o.coupon,
      couponCode: o.couponCode,
      hasCoupon: Boolean(o.coupon || o.couponCode),
      itemsCount: o.items ? o.items.length : 0,
      customerPhoneMasked: o.phone ? `***${o.phone.slice(-4)}` : 'N/A',
    });
  });

  console.log('\n=== ORDERS WITH COUPON ===');
  const couponOrders = await db
    .collection('orders')
    .find({ $or: [{ coupon: { $exists: true, $ne: null } }, { couponCode: { $exists: true, $ne: null, $ne: '' } }] })
    .toArray();
  console.log('Orders with coupon count:', couponOrders.length);
  couponOrders.forEach((o) => {
    console.log({
      id: o.id,
      createdAt: o.createdAt,
      subtotal: o.subtotal,
      totalAmount: o.totalAmount,
      coupon: o.coupon,
      couponCode: o.couponCode,
    });
  });

  console.log('\n=== COUPON REDEMPTIONS ===');
  const redemptions = await db.collection('couponredemptions').find({}).toArray();
  console.log('Redemptions count:', redemptions.length);
  redemptions.forEach((r) => {
    console.log({
      id: r.id,
      couponCode: r.couponCode,
      orderId: r.orderId,
      discountAmount: r.discountAmount,
      status: r.status,
      redeemedAt: r.redeemedAt,
    });
  });

  console.log('\n=== COUPONS IN DB ===');
  const coupons = await db.collection('coupons').find({}).toArray();
  console.log('Coupons count:', coupons.length);
  coupons.forEach((c) => {
    console.log({
      code: c.code,
      status: c.status,
      discountType: c.discountType,
      discountValue: c.discountValue,
      totalRedemptions: c.totalRedemptions,
      totalUsageLimit: c.totalUsageLimit,
    });
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

