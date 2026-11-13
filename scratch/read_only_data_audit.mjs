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

function maskPhone(p) {
  if (!p) return 'N/A';
  const clean = String(p).replace(/\D/g, '');
  if (clean.length < 4) return '***';
  return '*'.repeat(clean.length - 4) + clean.slice(-4);
}

function maskName(n) {
  if (!n) return 'N/A';
  const parts = String(n).split(' ');
  return parts.map(p => p[0] + '*'.repeat(Math.max(0, p.length - 1))).join(' ');
}

async function runReadOnlyAudit() {
  const uri = env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('========================================================================');
  console.log(' MARINE CREATURES — READ-ONLY DATA INTEGRITY AUDIT');
  console.log(' Reference: MC-COUPON-RELEASE-READINESS-FINAL-NOV2026');
  console.log('========================================================================\n');

  // 1. Orders collection inspection
  const totalOrders = await db.collection('orders').countDocuments();
  console.log(`[1] Total Orders in Database: ${totalOrders}`);

  const orders = await db.collection('orders').find({}).sort({ _id: -1 }).toArray();

  let ordersWithCoupons = 0;
  let mathematicalDiscrepancies = 0;
  let ordersWithIdempotencyKey = 0;

  orders.forEach((o) => {
    if (o.idempotencyKey) ordersWithIdempotencyKey++;
    if (o.coupon && o.coupon.code) {
      ordersWithCoupons++;
      const subtotal = o.subtotal || 0;
      const discount = o.coupon.discountAmount || 0;
      const total = o.totalAmount || 0;
      const expectedTotal = Math.max(0, subtotal - discount);
      if (Math.abs(expectedTotal - total) > 1) {
        mathematicalDiscrepancies++;
        console.warn(`Discrepancy in order ${o.id}: subtotal=${subtotal}, discount=${discount}, expected=${expectedTotal}, actual=${total}`);
      }
    }
  });

  console.log(`    ├─ Orders with Coupon Applied: ${ordersWithCoupons}`);
  console.log(`    ├─ Orders with Idempotency Key: ${ordersWithIdempotencyKey}`);
  console.log(`    └─ Mathematical Discrepancies (Subtotal - Discount vs Total): ${mathematicalDiscrepancies}`);

  // 2. Check for duplicate idempotency keys
  const idempotencyDuplicates = await db.collection('orders').aggregate([
    { $match: { idempotencyKey: { $exists: true, $ne: null } } },
    { $group: { _id: '$idempotencyKey', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log(`\n[2] Duplicate Idempotency Keys Detected: ${idempotencyDuplicates.length}`);
  if (idempotencyDuplicates.length > 0) {
    console.warn('    Duplicates found:', idempotencyDuplicates);
  }

  // 3. Coupon Redemptions collection
  const totalRedemptions = await db.collection('coupon_redemptions').countDocuments();
  console.log(`\n[3] Total Coupon Redemptions in Database: ${totalRedemptions}`);
  const redemptions = await db.collection('coupon_redemptions').find({}).toArray();
  const unlinkedRedemptions = [];
  for (const r of redemptions) {
    const linkedOrder = orders.find(o => o.id === r.orderId);
    if (!linkedOrder) {
      unlinkedRedemptions.push(r.orderId);
    }
  }
  console.log(`    ├─ Redemptions linked to existing orders: ${totalRedemptions - unlinkedRedemptions.length} / ${totalRedemptions}`);
  if (unlinkedRedemptions.length > 0) {
    console.log(`    └─ Unlinked redemptions (e.g. from tests or cancelled orders): ${unlinkedRedemptions.length} (${unlinkedRedemptions.join(', ')})`);
  }

  // 4. Coupons collection
  const coupons = await db.collection('coupons').find({}).toArray();
  console.log(`\n[4] Total Coupons Configured: ${coupons.length}`);
  coupons.forEach((c) => {
    console.log(`    ├─ [${c.code}] Status: ${c.status}, Eligibility: ${c.customerEligibility || 'all'}, Discount: ${c.discountType === 'percentage' ? c.discountValue + '%' : '₹' + c.discountValue}, Redemptions Count: ${c.redemptionCount || 0}`);
  });

  // 5. Customer 360 Consistency Audit
  const totalCustomers = await db.collection('customers').countDocuments();
  console.log(`\n[5] Customer 360 Consistency Audit`);
  console.log(`    Total Customer Profiles: ${totalCustomers}`);
  const customers = await db.collection('customers').find({}).toArray();
  let customersWithDiscrepancy = 0;

  customers.forEach((cust) => {
    const cleanPhone = (cust.phone || '').replace(/\D/g, '');
    const phoneRegex = new RegExp(cleanPhone.slice(-10) + '$', 'i');
    const custOrders = orders.filter(o => {
      const oPhone = (o.phone || '').replace(/\D/g, '');
      return oPhone.endsWith(cleanPhone.slice(-10));
    });
    const actualSpend = custOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const actualOrderCount = custOrders.length;

    const storedOrderCount = cust.totalOrdersCount || 0;
    const storedSpend = cust.totalSpend || 0;

    if (storedOrderCount !== actualOrderCount || Math.abs(storedSpend - actualSpend) > 1) {
      customersWithDiscrepancy++;
      console.log(`    ⚠️ Discrepancy for Customer ${cust.id} (${maskName(cust.name)}, ${maskPhone(cust.phone)}):`);
      console.log(`       Materialized Summary: count=${storedOrderCount}, spend=₹${storedSpend}`);
      console.log(`       Actual from Orders:   count=${actualOrderCount}, spend=₹${actualSpend}`);
    }
  });

  console.log(`    └─ Customers with Summary vs Actual Discrepancy: ${customersWithDiscrepancy} / ${totalCustomers}`);

  // 6. Recent Orders snapshot (masked PII)
  console.log('\n[6] Recent 5 Orders (PII Masked):');
  orders.slice(0, 5).forEach((o) => {
    console.log(`    ├─ ${o.id} | Step: ${o.currentStep} | Subtotal: ₹${o.subtotal} | Discount: ₹${o.coupon?.discountAmount || 0} (${o.coupon?.code || 'None'}) | Total: ₹${o.totalAmount} | Phone: ${maskPhone(o.phone)} | Idempotency: ${o.idempotencyKey ? 'Present' : 'None'}`);
  });

  await mongoose.disconnect();
  console.log('\n========================================================================');
  console.log(' AUDIT COMPLETE — ZERO DATABASE MODIFICATIONS PERFORMED');
  console.log('========================================================================');
}

runReadOnlyAudit().catch(console.error);

