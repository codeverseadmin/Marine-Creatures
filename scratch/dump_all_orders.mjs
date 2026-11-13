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

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  const orders = await db.collection('orders').find({}).sort({ _id: 1 }).toArray();
  console.log(`=== ALL ${orders.length} ORDERS IN MONGODB ===`);
  orders.forEach((o, i) => {
    console.log(`${i + 1}. ID: ${o.id} | Date: ${o.createdAt} | Customer: ${o.customerName?.slice(0, 1)}*** | Step: ${o.currentStep} | Total: ₹${o.totalAmount} | Coupon: ${o.coupon?.code || 'None'} (${o.coupon?.discountAmount || 0})`);
  });
  await mongoose.disconnect();
}
run();

