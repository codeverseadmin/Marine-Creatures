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
  const coupons = await db.collection('coupons').find({}).toArray();
  console.log('=== FULL COUPON DOCUMENTS ===');
  console.log(JSON.stringify(coupons, null, 2));
  await mongoose.disconnect();
}
run();

