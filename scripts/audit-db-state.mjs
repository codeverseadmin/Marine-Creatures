import fs from 'fs';
import mongoose from 'mongoose';

const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/MONGODB_URI=(.*)/);
if (!match) {
  console.error('No MONGODB_URI found in .env.local');
  process.exit(1);
}
const uri = match[1].trim().replace(/^['"]|['"]$/g, '');

async function runAudit() {
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB Atlas Cluster0\n');

  // 1. Order MC-611716YH
  const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
  const order = await Order.findOne({ $or: [{ id: 'MC-611716YH' }, { orderId: 'MC-611716YH' }] }).lean();
  console.log('====================================================');
  console.log('1. ORDER RECORD AUDIT: MC-611716YH');
  console.log('====================================================');
  if (order) {
    console.log({
      _id: order._id,
      id: order.id,
      customerName: order.customerName,
      phone: order.phone,
      city: order.city,
      totalAmount: order.totalAmount,
      currentStep: order.currentStep,
      isApproved: order.isApproved,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      historyCount: order.history?.length || 0,
      history: order.history,
    });
  } else {
    console.log('Order MC-611716YH not found in database.');
  }

  // 2. Product Nemo Extreme Series II Smart Marine LED
  console.log('\n====================================================');
  console.log('2. INVENTORY RECORD AUDIT: Nemo Extreme Series II');
  console.log('====================================================');
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const product = await Product.findOne({ name: /Nemo Extreme Series II Smart Marine LED/i }).lean();
  if (product) {
    console.log({
      _id: product._id,
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stockCount: product.stockCount,
      inStock: product.inStock,
      availabilityStatus: product.availabilityStatus,
      isArchived: product.isArchived,
      updatedAt: product.updatedAt,
    });
  } else {
    console.log('Product not found in database.');
  }

  // 3. All Audit Log Entries from QA Sessions
  console.log('\n====================================================');
  console.log('3. AUDIT LOG LEDGER ENTRIES (ALL QA MUTATIONS)');
  console.log('====================================================');
  const AuditLog = mongoose.model('AuditLog', new mongoose.Schema({}, { strict: false }));
  const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(20).lean();
  console.log(`Found ${logs.length} most recent audit log entries:`);
  logs.forEach((l, idx) => {
    console.log(`[${idx + 1}] ${l.timestamp} | ${l.action} | Entity: ${l.entityType} (${l.entityId})`);
    console.log(`    Summary: ${l.summary}`);
    if (l.details) {
      console.log(`    Details: ${JSON.stringify(l.details)}`);
    }
  });

  // 4. Check other orders touched during QA
  console.log('\n====================================================');
  console.log('4. ADDITIONAL RECENTLY UPDATED ORDERS');
  console.log('====================================================');
  const recentOrders = await Order.find({}).sort({ updatedAt: -1 }).limit(5).lean();
  recentOrders.forEach(o => {
    console.log(`Order ${o.id || o._id}: step=${o.currentStep}, customer=${o.customerName}, updated=${o.updatedAt || o.createdAt}`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB Atlas');
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});

