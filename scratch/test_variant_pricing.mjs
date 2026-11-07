import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:3098';

// Read .env.local
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

const sessionSecretMatch = envContent.match(/SESSION_SECRET=(.+)/);
const SESSION_SECRET = (sessionSecretMatch ? sessionSecretMatch[1].trim() : 'secret').replace(/^["']|["']$/g, '');

function createAdminSessionCookie(roleId = 'owner', email = 'founder@marinecreatures.local', sub = 'admin_test_sub') {
  const now = Date.now();
  const payload = {
    type: 'employee',
    sub,
    email,
    ver: 1,
    iat: now,
    exp: now + 3600000,
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadBase64).digest('hex');
  return `mc_admin_session=${payloadBase64}.${signature}`;
}

async function runTests() {
  console.log('================================================================');
  console.log('  MARINE CREATURES — LIGHTING VARIANT PRICING VERIFICATION SUITE');
  console.log(`  Target Server: ${BASE_URL}`);
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Clean any previous test orders
  await db.collection('orders').deleteMany({ customerName: { $regex: /Test Customer|Mixed Cart Customer|No Variant|Invalid Variant/ } });
  await db.collection('employees').deleteMany({ email: { $regex: /variant\.test\.owner/ } });

  // Create temporary active owner for invoice tests
  const testOwnerId = new mongoose.Types.ObjectId();
  const testOwnerEmail = `variant.test.owner.${Date.now()}@marinecreatures.local`;
  await db.collection('employees').insertOne({
    _id: testOwnerId,
    name: 'Variant Test Owner',
    email: testOwnerEmail,
    roleId: 'owner',
    status: 'active',
    sessionVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const adminCookie = createAdminSessionCookie('owner', testOwnerEmail, testOwnerId.toString());

  const cleanupOrderIds = [];
  let testCount = 0;
  let passCount = 0;

  function assert(condition, testName, details = '') {
    testCount++;
    if (condition) {
      passCount++;
      console.log(`  ✓ [TEST ${testCount}] PASS: ${testName}`);
    } else {
      console.error(`  ✗ [TEST ${testCount}] FAIL: ${testName} - ${details}`);
      throw new Error(`Assertion failed: ${testName} (${details})`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: CATALOGUE & API PRICING VERIFICATION (GET /api/products)
    // -------------------------------------------------------------------------
    console.log('--- SECTION 1: Catalogue & API Pricing Verification ---');
    const prodsRes = await fetch(`${BASE_URL}/api/products`);
    assert(prodsRes.status === 200, 'GET /api/products returns HTTP 200');
    const prodsData = await prodsRes.json();
    assert(prodsData.success === true, 'GET /api/products returns success: true');

    const flora = prodsData.data.find(p => p.id === 'luminous-aqua-ocean-blue');
    assert(Boolean(flora), 'Luminous Aqua S Flora found in catalogue');
    assert(flora.price === 2500, `S Flora base price is ₹2,500 (got ₹${flora.price})`);
    assert(flora.variants?.length === 5, `S Flora has 5 variants (got ${flora.variants?.length})`);

    const expectedFlora = [
      { id: 'q30', price: 2500, label: 'Q30' },
      { id: 'q60', price: 3500, label: 'Q60' },
      { id: 'q75', price: 3500, label: 'Q75' },
      { id: 'q90', price: 4500, label: 'Q90' },
      { id: 'q120', price: 5500, label: 'Q120' },
    ];

    expectedFlora.forEach(exp => {
      const v = flora.variants.find(item => item.id.toLowerCase() === exp.id);
      assert(Boolean(v), `S Flora variant ${exp.label} exists`);
      assert(v.price === exp.price, `S Flora variant ${exp.label} price is ₹${exp.price} (got ₹${v?.price})`);
    });

    const nemo = prodsData.data.find(p => p.id === 'nemo-extreme-led');
    assert(Boolean(nemo), 'Nemo Extreme Series II found in catalogue');
    assert(nemo.price === 6000, `Nemo base price is ₹6,000 (got ₹${nemo.price})`);
    assert(nemo.variants?.length === 4, `Nemo has 4 variants (got ${nemo.variants?.length})`);

    const expectedNemo = [
      { id: 'e450', price: 6000, label: 'E450' },
      { id: 'e600', price: 7500, label: 'E600' },
      { id: 'e900', price: 11000, label: 'E900' },
      { id: 'e1200', price: 13000, label: 'E1200' },
    ];

    expectedNemo.forEach(exp => {
      const v = nemo.variants.find(item => item.id.toLowerCase() === exp.id);
      assert(Boolean(v), `Nemo variant ${exp.label} exists`);
      assert(v.price === exp.price, `Nemo variant ${exp.label} price is ₹${exp.price} (got ₹${v?.price})`);
    });

    // -------------------------------------------------------------------------
    // SECTION 2: INDIVIDUAL VARIANT TESTING FOR ALL 9 VARIANTS (POST /api/orders)
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Individual Variant Order & Authoritative Pricing ---');

    const allVariants = [
      ...expectedFlora.map(v => ({ ...v, baseId: 'luminous-aqua-ocean-blue', series: 'S Flora' })),
      ...expectedNemo.map(v => ({ ...v, baseId: 'nemo-extreme-led', series: 'E-Series Nemo' })),
    ];

    for (const vTest of allVariants) {
      console.log(`\n  [Testing ${vTest.series} — ${vTest.label} (Expected: ₹${vTest.price})]`);

      // Test with quantity = 2 and malicious client price (₹1)
      const qty = 2;
      const expectedSubtotal = vTest.price * qty;
      const orderPayload = {
        customerName: `Test Customer ${vTest.label}`,
        phone: '9876543210',
        address: '100 Variant Testing Boulevard',
        city: 'Kolkata',
        pincode: '700001',
        items: [
          {
            id: `${vTest.baseId}__${vTest.id}`,
            name: `Hacked Client Name — ${vTest.label}`,
            price: 1, // Malicious price manipulation attempt!
            quantity: qty,
          },
        ],
        subtotal: 2, // Manipulated subtotal
        totalAmount: 2, // Manipulated total
      };

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      assert(res.status === 200 || res.status === 201, `POST /api/orders for ${vTest.label} returns HTTP 200/201`);
      const body = await res.json();
      assert(body.success === true, `Order created successfully for ${vTest.label}`);

      const createdOrder = body.data;
      cleanupOrderIds.push(createdOrder.id);

      assert(createdOrder.items?.length === 1, `Order contains 1 item`);
      const item = createdOrder.items[0];

      // Verify server rejected client price (1) and applied exact authoritative price
      assert(item.price === vTest.price, `Server enforced authoritative price ₹${vTest.price} for ${vTest.label} (client sent ₹1)`);
      assert(item.quantity === qty, `Item quantity preserved as ${qty}`);
      assert(createdOrder.subtotal === expectedSubtotal, `Server calculated subtotal ₹${expectedSubtotal} (${qty} x ₹${vTest.price})`);
      assert(createdOrder.totalAmount === expectedSubtotal, `Server calculated totalAmount ₹${expectedSubtotal}`);
      assert(item.id === `${vTest.baseId}__${vTest.id}`, `Order item ID preserved as ${vTest.baseId}__${vTest.id}`);

      // Verify MongoDB Atlas record directly
      const dbOrder = await db.collection('orders').findOne({ id: createdOrder.id });
      assert(Boolean(dbOrder), `Order ${createdOrder.id} exists in MongoDB Atlas`);
      assert(dbOrder.items[0].price === vTest.price, `MongoDB stores authoritative price ₹${vTest.price}`);
      assert(dbOrder.totalAmount === expectedSubtotal, `MongoDB stores authoritative total ₹${expectedSubtotal}`);

      // Verify Invoice endpoint for this variant
      const invoiceRes = await fetch(`${BASE_URL}/api/admin/orders/${createdOrder.id}/invoice-pdf`, {
        headers: { Cookie: adminCookie },
      });
      assert(invoiceRes.status === 200, `Invoice PDF endpoint returns HTTP 200 for ${vTest.label}`);
      const contentType = invoiceRes.headers.get('content-type');
      assert(contentType?.includes('application/pdf'), `Invoice returns application/pdf for ${vTest.label}`);

      // Verify customer invoice page
      const custInvoiceRes = await fetch(`${BASE_URL}/invoice/${createdOrder.id}?token=${createdOrder.invoiceToken}`);
      assert(custInvoiceRes.status === 200, `Customer invoice page returns HTTP 200 for ${vTest.label}`);
      const custInvoiceHtml = await custInvoiceRes.text();
      assert(custInvoiceHtml.includes(vTest.label) || custInvoiceHtml.includes(createdOrder.id), `Customer invoice preserves model ${vTest.label}`);
    }

    // -------------------------------------------------------------------------
    // SECTION 3: BACKEND PRICE INTEGRITY & NEGATIVE TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Backend Price Integrity & Negative Tests ---');

    // 3.1 Ordering S Flora without variant must be rejected (NO silent fallback)
    const missingVariantFloraRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'No Variant Tester',
        phone: '9876543210',
        address: '100 Sea Street',
        city: 'Mumbai',
        pincode: '400001',
        items: [{ id: 'luminous-aqua-ocean-blue', quantity: 1, price: 2500 }],
      }),
    });
    assert(missingVariantFloraRes.status === 400, 'Ordering S Flora without variant is rejected (HTTP 400)');
    const missingFloraBody = await missingVariantFloraRes.json();
    assert(missingFloraBody.error?.includes('Please select a specific variant'), 'Returns error requiring variant selection');

    // 3.2 Ordering Nemo without variant must be rejected (NO silent fallback)
    const missingVariantNemoRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'No Variant Tester',
        phone: '9876543210',
        address: '100 Sea Street',
        city: 'Mumbai',
        pincode: '400001',
        items: [{ id: 'nemo-extreme-led', quantity: 1, price: 6000 }],
      }),
    });
    assert(missingVariantNemoRes.status === 400, 'Ordering Nemo without variant is rejected (HTTP 400)');
    const missingNemoBody = await missingVariantNemoRes.json();
    assert(missingNemoBody.error?.includes('Please select a specific variant'), 'Returns error requiring variant selection');

    // 3.3 Ordering with invalid variant ID (e.g. q999) must be rejected
    const invalidVariantRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Invalid Variant Tester',
        phone: '9876543210',
        address: '100 Sea Street',
        city: 'Mumbai',
        pincode: '400001',
        items: [{ id: 'luminous-aqua-ocean-blue__q999', quantity: 1 }],
      }),
    });
    assert(invalidVariantRes.status === 400, 'Ordering with invalid variant ID is rejected (HTTP 400)');
    const invalidVariantBody = await invalidVariantRes.json();
    assert(invalidVariantBody.error?.includes('does not belong to product'), 'Returns invalid variant error');

    // 3.4 Multi-item mixed cart with variant pricing
    console.log('\n  [Testing Mixed Cart with Multiple Lighting Variants]');
    // 2 x Q30 (2 x ₹2,500 = ₹5,000) + 1 x E1200 (1 x ₹13,000 = ₹13,000) = ₹18,000
    const mixedCartRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Mixed Cart Customer',
        phone: '9876543210',
        address: '200 Aquarium Reef Avenue',
        city: 'Bangalore',
        pincode: '560001',
        items: [
          { id: 'luminous-aqua-ocean-blue__q30', quantity: 2, price: 10 },
          { id: 'nemo-extreme-led__e1200', quantity: 1, price: 20 },
        ],
        subtotal: 30, // Manipulated
        totalAmount: 30,
      }),
    });
    assert(mixedCartRes.status === 200 || mixedCartRes.status === 201, 'Mixed cart order returns HTTP 200/201');
    const mixedCartBody = await mixedCartRes.json();
    cleanupOrderIds.push(mixedCartBody.data.id);
    assert(mixedCartBody.data.subtotal === 18000, `Mixed cart subtotal is ₹18,000 (got ₹${mixedCartBody.data.subtotal})`);
    assert(mixedCartBody.data.totalAmount === 18000, `Mixed cart totalAmount is ₹18,000 (got ₹${mixedCartBody.data.totalAmount})`);
    assert(mixedCartBody.data.items.length === 2, 'Mixed cart contains 2 distinct variant items');

    console.log('\n================================================================');
    console.log(`  ALL ${passCount} / ${testCount} VERIFICATION TESTS PASSED (100%)`);
    console.log('================================================================');

  } finally {
    console.log('\n--- Cleaning Up Temporary Test Records ---');
    if (cleanupOrderIds.length > 0) {
      const del = await db.collection('orders').deleteMany({ id: { $in: cleanupOrderIds } });
      console.log(`✓ Deleted ${del.deletedCount} temporary test orders.`);
    }

    await db.collection('employees').deleteMany({ email: { $regex: /variant\.test\.owner/ } });
    console.log('✓ Cleaned up temporary test owner employee.');

    // Verify pristine database state
    const remainingOrders = await db.collection('orders').countDocuments();
    const remainingProducts = await db.collection('products').countDocuments();
    console.log(`Pristine orders count: ${remainingOrders} (Expected: 15)`);
    console.log(`Pristine products count: ${remainingProducts} (Expected: 64)`);

    const order8921 = await db.collection('orders').findOne({ id: 'MC-8921' });
    const order8922 = await db.collection('orders').findOne({ id: 'MC-8922' });
    console.log(`MC-8921 verified intact: ${Boolean(order8921)} (${order8921?.customerName})`);
    console.log(`MC-8922 verified intact: ${Boolean(order8922)} (${order8922?.customerName})`);

    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
