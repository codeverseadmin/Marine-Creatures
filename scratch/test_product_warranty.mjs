import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import assert from 'assert';

const PORT = 3098;
const BASE_URL = `http://localhost:${PORT}`;

// Load environment variables
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

const sessionSecretMatch = envContent.match(/SESSION_SECRET=(.+)/);
const SESSION_SECRET = (sessionSecretMatch ? sessionSecretMatch[1].trim() : 'secret').replace(/^["']|["']$/g, '');

function createTestEmployeeCookie(employeeId, email, sessionVersion = 1, ttlMs = 3600000) {
  const now = Date.now();
  const payload = {
    type: 'employee',
    sub: employeeId,
    email: email.toLowerCase().trim(),
    ver: sessionVersion,
    iat: now,
    exp: now + ttlMs,
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadBase64).digest('hex');
  return `mc_admin_session=${payloadBase64}.${signature}`;
}

async function runWarrantyTests() {
  console.log('================================================================');
  console.log(' MARINE CREATURES — PRODUCT-LEVEL WARRANTY MANAGEMENT (V1) TEST SUITE');
  console.log(' Reference: MC-FEATURE-PRODUCT-WARRANTY-V1');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function recordPass(testName, details = '') {
    passed++;
    console.log(`  [PASS] Test ${passed}: ${testName} ${details ? '(' + details + ')' : ''}`);
  }

  function recordFail(testName, err) {
    failed++;
    console.error(`  [FAIL] Test ${passed + failed}: ${testName}`);
    console.error(`         ${err.message || err}`);
  }

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Initial baseline checks
  const initialProductCount = await db.collection('products').countDocuments({});
  const initialOrderCount = await db.collection('orders').countDocuments({});
  console.log(`Baseline Database State: ${initialProductCount} products, ${initialOrderCount} orders\n`);

  // Setup test roles & employees
  const testOwnerId = new mongoose.Types.ObjectId();
  const testStaffId = new mongoose.Types.ObjectId();
  const testOwnerEmail = `founder.qa.${Date.now()}@marinecreatures.local`;
  const testStaffEmail = `staff.qa.${Date.now()}@marinecreatures.local`;

  // Insert or verify owner role and readonly staff role
  await db.collection('roles').updateOne(
    { id: 'owner' },
    { $set: { id: 'owner', name: 'Owner', permissions: ['*'] } },
    { upsert: true }
  );

  await db.collection('roles').updateOne(
    { id: 'readonly_staff' },
    { $set: { id: 'readonly_staff', name: 'Readonly Staff', permissions: ['products.read', 'orders.read'] } },
    { upsert: true }
  );

  await db.collection('employees').insertOne({
    _id: testOwnerId,
    id: testOwnerId.toString(),
    email: testOwnerEmail,
    name: 'QA Owner',
    roleId: 'owner',
    status: 'active',
    sessionVersion: 1,
    createdAt: new Date(),
  });

  await db.collection('employees').insertOne({
    _id: testStaffId,
    id: testStaffId.toString(),
    email: testStaffEmail,
    name: 'QA Readonly Staff',
    roleId: 'readonly_staff',
    status: 'active',
    sessionVersion: 1,
    createdAt: new Date(),
  });

  const ownerCookie = createTestEmployeeCookie(testOwnerId.toString(), testOwnerEmail);
  const staffCookie = createTestEmployeeCookie(testStaffId.toString(), testStaffEmail);

  const testProductId = `mc-qa-warranty-specimen-${Date.now()}`;
  let placedOrderId = null;

  try {
    // -------------------------------------------------------------------------
    // GROUP 1: RBAC & AUTHORISATION GOVERNANCE (Requirement 4 & 5)
    // -------------------------------------------------------------------------
    console.log('--- Group 1: Admin Governance & RBAC Enforcement ---');

    // Test 1: Unauthenticated request cannot create or modify catalog
    try {
      const res = await fetch(`${BASE_URL}/api/admin/catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: testProductId, name: 'Unauth Item', price: 1000, category: 'hardware' }),
      });
      assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
      recordPass('Unauthenticated POST /api/admin/catalog is blocked with HTTP 401');
    } catch (err) {
      recordFail('Unauthenticated POST /api/admin/catalog', err);
    }

    // Test 2: Unauthorized employee (readonly_staff) cannot modify catalog warranty
    try {
      const res = await fetch(`${BASE_URL}/api/admin/catalog`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: staffCookie },
        body: JSON.stringify({ id: 'blue-treasure-calcium-sand', warranty: { enabled: true } }),
      });
      assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
      recordPass('Unauthorized employee (without products.update) is blocked with HTTP 403');
    } catch (err) {
      recordFail('Unauthorized employee PATCH /api/admin/catalog', err);
    }

    // -------------------------------------------------------------------------
    // GROUP 2: NEW PRODUCT DEFAULT (Requirement 1 & Business Rules)
    // -------------------------------------------------------------------------
    console.log('\n--- Group 2: New Product Default Warranty Verification ---');

    // Test 3: New product defaults to No Warranty (enabled: false)
    try {
      const res = await fetch(`${BASE_URL}/api/admin/catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
        body: JSON.stringify({
          id: testProductId,
          name: 'QA Hydro Reactor System',
          category: 'hardware',
          categoryLabel: 'Hardware & Tech',
          price: 15000,
          inStock: true,
          stockCount: 10,
          description: 'High-precision titanium fluidized media reactor for specialized marine aquariums.',
          shortDesc: 'Precision titanium media reactor',
          variants: [
            { id: 'standard', name: 'Standard Flow (1000 L/h)', price: 15000, inStock: true },
            { id: 'deluxe', name: 'Deluxe IoT Flow (2500 L/h)', price: 22000, inStock: true },
          ],
        }),
      });
      assert.strictEqual(res.status, 201, `Expected 201 Created, got ${res.status}`);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.warranty?.enabled, false, 'New product warranty MUST default to enabled: false');
      recordPass('New product created via admin API defaults to warranty.enabled: false');
    } catch (err) {
      recordFail('New product warranty default', err);
    }

    // Test 4: Database document confirms warranty.enabled is false
    try {
      const doc = await db.collection('products').findOne({ id: testProductId });
      assert(doc, 'Product document not found in MongoDB');
      assert.strictEqual(doc.warranty?.enabled, false, 'Database record must have warranty.enabled: false');
      recordPass('MongoDB product document confirms warranty.enabled is explicitly false');
    } catch (err) {
      recordFail('Database document warranty default check', err);
    }

    // Test 5: Customer-facing product page displays "No Warranty"
    try {
      const res = await fetch(`${BASE_URL}/marketplace/${testProductId}`);
      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
      const html = await res.text();
      assert(html.includes('No Warranty'), 'Product detail page must display "No Warranty"');
      assert(!html.includes('Active Warranty'), 'Product page must NOT claim active warranty');
      recordPass('Customer storefront page correctly renders "No Warranty" badge & text');
    } catch (err) {
      recordFail('Customer page "No Warranty" verification', err);
    }

    // -------------------------------------------------------------------------
    // GROUP 3: ENABLING WARRANTY & ATTRIBUTE CONFIGURATION (Requirement 1 & 2)
    // -------------------------------------------------------------------------
    console.log('\n--- Group 3: Admin Warranty Configuration & Storefront Presentation ---');

    // Test 6: Admin enables warranty with provider, duration, terms, and internalNotes
    try {
      const res = await fetch(`${BASE_URL}/api/admin/catalog`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
        body: JSON.stringify({
          id: testProductId,
          warranty: {
            enabled: true,
            provider: 'manufacturer',
            durationValue: 2,
            durationUnit: 'years',
            terms: 'Comprehensive 2-Year Titanium Core & Motor Replacement Warranty against manufacturing defects.',
            internalNotes: 'Direct distributor RMA escalation: rma@hydroreactor.de; Contract Ref #QA-2026-TITANIUM',
          },
        }),
      });
      assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.warranty?.enabled, true);
      assert.strictEqual(json.data.warranty?.provider, 'manufacturer');
      assert.strictEqual(json.data.warranty?.durationValue, 2);
      assert.strictEqual(json.data.warranty?.durationUnit, 'years');
      assert.strictEqual(json.data.warranty?.terms.includes('Comprehensive 2-Year'), true);
      assert.strictEqual(json.data.warranty?.internalNotes.includes('rma@hydroreactor.de'), true);
      recordPass('Admin successfully enabled 2-Year Manufacturer Warranty with terms & internal notes');
    } catch (err) {
      recordFail('Admin warranty update', err);
    }

    // Test 7: Public API strips internalNotes for customer privacy (Requirement 1)
    try {
      const res = await fetch(`${BASE_URL}/api/products`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      const p = json.data.find((item) => item.id === testProductId);
      assert(p, 'Test product not returned from /api/products');
      assert.strictEqual(p.warranty?.enabled, true);
      assert.strictEqual(p.warranty?.durationValue, 2);
      assert.strictEqual(p.warranty?.internalNotes, undefined, 'Admin-only internalNotes MUST NOT be leaked in public API');
      recordPass('Public /api/products response sanitizes and strips internalNotes');
    } catch (err) {
      recordFail('Public API internalNotes sanitization', err);
    }

    // Test 8: Product page renders warranty badge and duration
    try {
      const res = await fetch(`${BASE_URL}/marketplace/${testProductId}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      assert.strictEqual(res.status, 200);
      const html = await res.text();
      const lower = html.toLowerCase();
      assert(lower.includes('2 years') && lower.includes('manufacturer warranty'), 'HTML should display 2 years Manufacturer Warranty');
      assert(html.includes('Comprehensive 2-Year Titanium Core'), 'HTML should provide access to warranty terms');
      recordPass('Storefront product page dynamically displays configured warranty badge and terms');
    } catch (err) {
      recordFail('Product page warranty badge and terms display', err);
    }

    // Test 9: Audit log recorded the warranty update with previous & new values (Requirement 4)
    try {
      const auditLog = await db.collection('auditlogs').findOne(
        { action: 'PRODUCT_WARRANTY_UPDATED', entityId: testProductId, summary: /ENABLED/ },
        { sort: { createdAt: -1 } }
      );
      assert(auditLog, 'Audit log for PRODUCT_WARRANTY_UPDATED not found');
      assert.strictEqual(auditLog.details.previousWarranty?.enabled, false, 'Audit log must record previous state as disabled');
      assert.strictEqual(auditLog.details.newWarranty?.enabled, true, 'Audit log must record new state as enabled');
      assert.strictEqual(auditLog.details.newWarranty?.durationValue, 2);
      recordPass('Audit log accurately captured PRODUCT_WARRANTY_UPDATED with previous & new values');
    } catch (err) {
      recordFail('Audit log verification for warranty update', err);
    }

    // -------------------------------------------------------------------------
    // GROUP 4: VARIANT-LEVEL WARRANTY OVERRIDE (Requirement 5)
    // -------------------------------------------------------------------------
    console.log('\n--- Group 4: Variant-Level Warranty Overrides ---');

    // Test 10: Configure variant override: standard inherits (2y mfg), deluxe overrides with 3-year seller warranty
    try {
      const res = await fetch(`${BASE_URL}/api/admin/catalog`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
        body: JSON.stringify({
          id: testProductId,
          variants: [
            { id: 'standard', name: 'Standard Flow (1000 L/h)', price: 15000, inStock: true },
            {
              id: 'deluxe',
              name: 'Deluxe IoT Flow (2500 L/h)',
              price: 22000,
              inStock: true,
              warranty: {
                enabled: true,
                provider: 'seller',
                durationValue: 3,
                durationUnit: 'years',
                terms: 'Marine Creatures Concierge 3-Year VIP In-Home Replacement Warranty.',
                internalNotes: 'VIP priority replacement directly from Marine Creatures warehouse stock',
              },
            },
          ],
        }),
      });
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      const deluxeVar = json.data.variants.find((v) => v.id === 'deluxe');
      assert(deluxeVar?.warranty, 'Deluxe variant must retain custom warranty override');
      assert.strictEqual(deluxeVar.warranty.provider, 'seller');
      assert.strictEqual(deluxeVar.warranty.durationValue, 3);
      recordPass('Configured variant-level warranty override: 3-Year Seller Warranty for Deluxe variant');
    } catch (err) {
      recordFail('Variant-level warranty override configuration', err);
    }

    // -------------------------------------------------------------------------
    // GROUP 5: ORDER & INVOICE SNAPSHOT INTEGRITY (Requirement 3 & 5)
    // -------------------------------------------------------------------------
    console.log('\n--- Group 5: Order Line Warranty Snapshot & Historical Immutability ---');

    // Test 11: Placing storefront order snapshots warranty information at purchase time
    try {
      const orderPayload = {
        customerName: 'Aarav Mehta',
        phone: '9876543210',
        address: 'Villa 12, Palm Meadows, Whitefield',
        city: 'Bengaluru',
        pincode: '560066',
        items: [
          { id: `${testProductId}__standard`, quantity: 1 },
          { id: `${testProductId}__deluxe`, quantity: 1 },
        ],
      };

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      assert(res.status === 201 || res.status === 200, `Expected 201 Created, got ${res.status}`);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      placedOrderId = json.data.id;

      // Verify item 1 (Standard) inherited product-level warranty
      const standardItem = json.data.items.find((i) => i.id.includes('standard'));
      assert(standardItem, 'Standard item not in order');
      assert.strictEqual(standardItem.warranty?.hasWarranty, true);
      assert.strictEqual(standardItem.warranty?.provider, 'manufacturer');
      assert.strictEqual(standardItem.warranty?.durationValue, 2);
      assert.strictEqual(standardItem.warranty?.durationUnit, 'years');

      // Verify item 2 (Deluxe) applied variant-level warranty override
      const deluxeItem = json.data.items.find((i) => i.id.includes('deluxe'));
      assert(deluxeItem, 'Deluxe item not in order');
      assert.strictEqual(deluxeItem.warranty?.hasWarranty, true);
      assert.strictEqual(deluxeItem.warranty?.provider, 'seller');
      assert.strictEqual(deluxeItem.warranty?.durationValue, 3);
      assert.strictEqual(deluxeItem.warranty?.durationUnit, 'years');

      recordPass(`Order #${placedOrderId} created with authoritative item warranty snapshots`);
    } catch (err) {
      recordFail('Order creation with warranty snapshot', err);
    }

    // Test 12: Direct MongoDB Atlas verification of order document
    try {
      const orderDoc = await db.collection('orders').findOne({ id: placedOrderId });
      assert(orderDoc, 'Order document not found in MongoDB');
      assert.strictEqual(orderDoc.items[0].warranty.hasWarranty, true);
      assert.strictEqual(orderDoc.items[1].warranty.hasWarranty, true);
      assert.strictEqual(orderDoc.items[1].warranty.provider, 'seller');
      assert.strictEqual(orderDoc.items[1].warranty.durationValue, 3);
      recordPass('Direct MongoDB inspection confirms persistent order line warranty snapshots');
    } catch (err) {
      recordFail('MongoDB order snapshot verification', err);
    }

    // Test 13: Subsequent product catalog changes DO NOT alter historical order snapshots (Requirement 3)
    try {
      // Admin completely disables warranty on the product and deletes variant warranty
      const patchRes = await fetch(`${BASE_URL}/api/admin/catalog`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
        body: JSON.stringify({
          id: testProductId,
          warranty: { enabled: false },
          variants: [
            { id: 'standard', name: 'Standard Flow', price: 15000, inStock: true, warranty: { enabled: false } },
            { id: 'deluxe', name: 'Deluxe IoT Flow', price: 22000, inStock: true, warranty: { enabled: false } },
          ],
        }),
      });
      assert.strictEqual(patchRes.status, 200);

      // Now query the historical order placed earlier
      const histOrderDoc = await db.collection('orders').findOne({ id: placedOrderId });
      assert(histOrderDoc, 'Historical order missing');

      // Assert historical order STILL contains original warranty coverage
      assert.strictEqual(histOrderDoc.items[0].warranty?.hasWarranty, true, 'Historical item 1 must preserve hasWarranty: true');
      assert.strictEqual(histOrderDoc.items[0].warranty?.durationValue, 2, 'Historical item 1 must preserve durationValue: 2');
      assert.strictEqual(histOrderDoc.items[1].warranty?.hasWarranty, true, 'Historical item 2 must preserve hasWarranty: true');
      assert.strictEqual(histOrderDoc.items[1].warranty?.durationValue, 3, 'Historical item 2 must preserve durationValue: 3');
      assert.strictEqual(histOrderDoc.items[1].warranty?.provider, 'seller', 'Historical item 2 must preserve provider: seller');

      recordPass('Historical order snapshots remain completely immutable after catalog warranty deletion');
    } catch (err) {
      recordFail('Historical order immutability check', err);
    }

    // -------------------------------------------------------------------------
    // GROUP 6: DISABLING WARRANTY & STOREFRONT REMOVAL (Requirement 1 & 2)
    // -------------------------------------------------------------------------
    console.log('\n--- Group 6: Disabling Warranty & Clean Removal from Storefront ---');

    // Test 14: Customer storefront page reflects disabled warranty ("No Warranty")
    try {
      const res = await fetch(`${BASE_URL}/marketplace/${testProductId}`);
      assert.strictEqual(res.status, 200);
      const html = await res.text();
      assert(html.includes('No Warranty'), 'Storefront must clearly display "No Warranty"');
      assert(!html.includes('2 years Manufacturer Warranty'), 'Storefront must NOT display 2-year claim');
      assert(!html.includes('3 years Seller Warranty'), 'Storefront must NOT display 3-year claim');
      recordPass('Product page removes active warranty claims and displays "No Warranty"');
    } catch (err) {
      recordFail('Storefront warranty removal check', err);
    }

    // Test 15: Disabling warranty generated audit log
    try {
      const auditLog = await db.collection('auditlogs').findOne(
        { action: 'PRODUCT_WARRANTY_UPDATED', entityId: testProductId, summary: /DISABLED/ },
        { sort: { createdAt: -1 } }
      );
      assert(auditLog, 'Audit log for warranty disabling not found');
      assert.strictEqual(auditLog.details.newWarranty?.enabled, false);
      recordPass('Audit log captured warranty disabling with previous state and actor attribution');
    } catch (err) {
      recordFail('Audit log for disabling warranty', err);
    }

    // -------------------------------------------------------------------------
    // GROUP 7: INVOICE GENERATION & SNAPSHOT RENDERING (Requirement 3)
    // -------------------------------------------------------------------------
    console.log('\n--- Group 7: Invoice PDF Generation with Warranty Snapshot ---');

    // Test 16: Executive Invoice PDF renders order-line warranty snapshots
    try {
      const invoiceRes = await fetch(`${BASE_URL}/api/admin/orders/${placedOrderId}/invoice-pdf`, {
        headers: { Cookie: ownerCookie },
      });
      assert.strictEqual(invoiceRes.status, 200, `Expected 200 OK, got ${invoiceRes.status}`);
      const pdfBuffer = await invoiceRes.arrayBuffer();
      assert(pdfBuffer.byteLength > 1000, 'Invoice PDF should be a non-empty valid binary');
      const pdfHeader = Buffer.from(pdfBuffer.slice(0, 5)).toString();
      assert.strictEqual(pdfHeader, '%PDF-', 'Buffer should start with valid %PDF- magic bytes');
      recordPass(`Executive Invoice PDF generated (${pdfBuffer.byteLength} bytes) retaining item warranty data`);
    } catch (err) {
      recordFail('Executive Invoice PDF generation', err);
    }

    // -------------------------------------------------------------------------
    // GROUP 8: CATALOG & DATA INTEGRITY (Requirement 10)
    // -------------------------------------------------------------------------
    console.log('\n--- Group 8: Existing Products and Data Integrity Preservation ---');

    // Test 17: Existing products remain integral
    try {
      const blueTreasure = await db.collection('products').findOne({ id: 'blue-treasure-coral-sand' });
      assert(blueTreasure, 'Blue Treasure sand must exist and remain integral');
      assert.strictEqual(blueTreasure.price, 1400);

      const purpleTang = await db.collection('products').findOne({ id: 'purple-tang-l' });
      assert(purpleTang, 'Purple Tang must exist and remain integral');
      assert.strictEqual(purpleTang.priceOnRequest, true);
      assert.strictEqual(purpleTang.price, 0);

      const pacificTang = await db.collection('products').findOne({ id: 'pacific-blue-tang' });
      assert(pacificTang, 'Pacific Blue Tang must exist and remain integral');
      assert.strictEqual(pacificTang.price, 11000);

      recordPass('Existing products (Blue Treasure sand, Purple Tang) preserved with correct pricing & attributes');
    } catch (err) {
      recordFail('Existing product integrity check', err);
    }

  } finally {
    // Clean up test data
    console.log('\n--- Cleaning up synthetic test artifacts ---');
    if (placedOrderId) {
      await db.collection('orders').deleteOne({ id: placedOrderId });
    }
    await db.collection('products').deleteOne({ id: testProductId });
    await db.collection('employees').deleteMany({ email: { $in: [testOwnerEmail, testStaffEmail] } });
    await db.collection('audit_logs').deleteMany({ entityId: testProductId });
    await db.collection('auditlogs').deleteMany({ entityId: testProductId });

    const finalProductCount = await db.collection('products').countDocuments({});
    const finalOrderCount = await db.collection('orders').countDocuments({});
    console.log(`Database State Restored: ${finalProductCount} products, ${finalOrderCount} orders`);

    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(` WARRANTY VERIFICATION SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runWarrantyTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
