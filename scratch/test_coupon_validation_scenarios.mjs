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

async function testPostOrder() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('Testing validate coupon directly...');
  const { validateAndCalculateCoupon } = await import('./lib/services/promotion-engine.js').catch(() => import('./lib/services/promotion-engine.ts'));

  // Test 1: validate with first-order coupon and a phone that already has orders
  const phoneWithOrders = '9330555589';
  const val1 = await validateAndCalculateCoupon(
    'WELCOME100',
    [{ id: 'blue-treasure-probiotic-salt-10kg', name: 'Blue Treasure Salt', price: 2800, quantity: 1, category: 'salt-chemistry' }],
    phoneWithOrders
  );
  console.log('Validation with phone that has past orders (9330555589):', val1);

  // Test 2: validate with first-order coupon and a FRESH phone with 0 past orders
  const freshPhone = '9999988888';
  const val2 = await validateAndCalculateCoupon(
    'WELCOME100',
    [{ id: 'blue-treasure-probiotic-salt-10kg', name: 'Blue Treasure Salt', price: 2800, quantity: 1, category: 'salt-chemistry' }],
    freshPhone
  );
  console.log('Validation with fresh phone (9999988888):', val2);

  // Test 3: validate with NO phone (as in cart before details step)
  const val3 = await validateAndCalculateCoupon(
    'WELCOME100',
    [{ id: 'blue-treasure-probiotic-salt-10kg', name: 'Blue Treasure Salt', price: 2800, quantity: 1, category: 'salt-chemistry' }],
    undefined
  );
  console.log('Validation with NO phone (step: cart):', val3);

  await mongoose.disconnect();
}

testPostOrder().catch(console.error);

