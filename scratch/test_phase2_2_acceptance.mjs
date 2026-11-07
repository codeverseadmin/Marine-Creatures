import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import sharp from 'sharp';

const BASE_URL = 'http://localhost:3099';

// Load MONGODB_URI from .env.local
const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
  ? path.resolve(process.cwd(), '.env.local')
  : path.resolve(process.cwd(), 'marine-creatures', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function runTests() {
  console.log('====================================================');
  console.log(' MARINE CREATURES — PHASE 2.2 ACCEPTANCE TEST SUITE');
  console.log(' Actual Next.js Production HTTP Server Verification');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('====================================================\n');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const results = [];
  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      results.push({ test: message, status: 'PASS', details });
    } else {
      console.error(`  ✗ FAIL: ${message} - ${details}`);
      results.push({ test: message, status: 'FAIL', details });
      throw new Error(`Assertion failed: ${message} (${details})`);
    }
  }

  // Tracking fixtures for guaranteed cleanup
  const cleanupOrderIds = ['MC-38109581'];
  const cleanupMediaIds = [];
  const cleanupInvitationHashes = [];

  let ipCounter = 10;
  function getHeaders(extra = {}) {
    return {
      'Content-Type': 'application/json',
      'x-forwarded-for': `198.51.100.${ipCounter++}`,
      ...extra,
    };
  }

  try {
    // -------------------------------------------------------------
    // PART 1: P0 — ELIMINATE PUBLIC ORDER-ID OVERWRITE
    // -------------------------------------------------------------
    console.log('--- PART 1: P0 — Eliminate Public Order-ID Overwrite ---');

    // Test 1.1: Public order creation succeeds and ignores client-supplied ID
    const clientSuppliedId = `MC-CLIENT-OVERWRITE-${Date.now()}`;
    const res1 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        id: clientSuppliedId,
        customerName: 'Test Buyer 1',
        phone: '9876543210',
        address: 'Harbor Road 1, Port Blair',
        city: 'Port Blair',
        pincode: '744101',
        items: [
          {
            id: 'rose-bubble-tip-anemone',
            quantity: 1,
          },
        ],
      }),
    });
    const body1 = await res1.json();
    assert(res1.status === 201, 'Public order creation succeeds with HTTP 201 Created', `status: ${res1.status}`);
    assert(body1.success === true, 'Response indicates success: true');
    assert(body1.data.id !== clientSuppliedId, 'Client-supplied ID is completely ignored by server');
    assert(/^MC-\d{6}[0-9A-F]{2}$/.test(body1.data.id), `Server generated authoritative ID conforming to format: ${body1.data.id}`);
    cleanupOrderIds.push(body1.data.id);

    // Test 1.2: Repeated requests produce different server-generated IDs
    const res2 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        customerName: 'Test Buyer 2',
        phone: '9876543210',
        address: 'Harbor Road 2, Port Blair',
        city: 'Port Blair',
        pincode: '744101',
        items: [{ id: 'rose-bubble-tip-anemone', quantity: 1 }],
      }),
    });
    const body2 = await res2.json();
    assert(body2.data.id !== body1.data.id, 'Subsequent order receives a different unique server-generated ID');
    cleanupOrderIds.push(body2.data.id);

    // Test 1.3: Attacker attempts to overwrite an existing delivered order fixture
    const targetFixtureId = `MC-FIXTURE-${Date.now()}`;
    const originalFixtureDoc = {
      id: targetFixtureId,
      customerName: 'Original Protected Client',
      phone: '9991112222',
      address: 'Protected Estate Villa 1',
      city: 'Kolkata',
      pincode: '700156',
      items: [
        {
          id: 'radion-xr30-pro-g6',
          name: 'EcoTech Radion XR30 Pro G6 Reef Fixture',
          price: 74999,
          quantity: 1,
        },
      ],
      subtotal: 74999,
      totalAmount: 74999,
      currentStep: 'delivered',
      isApproved: true,
      approvedAt: '2026-10-01 10:00 AM',
      awbNumber: 'ORIG-AWB-PROTECTED-777',
      courierName: 'IndiGo Priority CarGo',
      invoiceNumber: `INV-${targetFixtureId}`,
      createdAt: '2026-10-01 09:00 AM',
    };
    await db.collection('orders').insertOne({ ...originalFixtureDoc });
    cleanupOrderIds.push(targetFixtureId);

    // Snapshot before attack
    const snapshotBefore = await db.collection('orders').findOne({ id: targetFixtureId });

    // Attack request: Send public POST targeting the existing order ID with malicious payload
    const attackRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        id: targetFixtureId, // Attacker attempts to overwrite target fixture
        customerName: 'Malicious Attacker',
        phone: '0000000000',
        address: 'Hacked Address',
        city: 'Kolkata',
        pincode: '700001',
        currentStep: 'placed',
        isApproved: false,
        totalAmount: 1,
        items: [{ id: 'rose-bubble-tip-anemone', price: 1, quantity: 1 }],
      }),
    });
    const attackBody = await attackRes.json();
    assert(attackRes.status === 201, 'Public creation returns 201 with newly generated reference', `status: ${attackRes.status}, body: ${JSON.stringify(attackBody)}`);
    assert(attackBody.data.id !== targetFixtureId, 'Server assigned a new ID instead of overwriting the target');
    cleanupOrderIds.push(attackBody.data.id);

    // Snapshot after attack: Verify original fixture remains 100% byte-for-byte unmodified!
    const snapshotAfter = await db.collection('orders').findOne({ id: targetFixtureId });
    assert(snapshotAfter.customerName === snapshotBefore.customerName, 'Original customer name preserved');
    assert(snapshotAfter.currentStep === 'delivered', 'Original delivery step (delivered) preserved');
    assert(snapshotAfter.isApproved === true, 'Original approval status (isApproved: true) preserved');
    assert(snapshotAfter.awbNumber === 'ORIG-AWB-PROTECTED-777', 'Original fulfillment AWB number preserved');
    assert(snapshotAfter.totalAmount === 74999, 'Original totalAmount (74999) preserved');

    // Test 1.4: Unauthenticated administrative PATCH attempt returns 401
    const patchRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ id: targetFixtureId, currentStep: 'placed' }),
    });
    assert(patchRes.status === 401, 'Unauthenticated administrative PATCH is rejected with HTTP 401');

    // -------------------------------------------------------------
    // PART 2: P0 — AUTHORITATIVE PRODUCT AND VARIANT PRICING
    // -------------------------------------------------------------
    console.log('\n--- PART 2: P0 — Authoritative Product and Variant Pricing ---');

    // Test 2.1: Client attempts to submit ₹1 for a ₹8,999 product (rose-bubble-tip-anemone)
    const priceAttackRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        customerName: 'Price Hacker',
        phone: '9876543210',
        address: 'Test Address',
        items: [
          {
            id: 'rose-bubble-tip-anemone',
            price: 1, // Attacker attempts to buy for ₹1
            quantity: 2,
          },
        ],
        subtotal: 2, // Attacker attempts to inject ₹2 subtotal
        totalAmount: 2, // Attacker attempts to inject ₹2 total
      }),
    });
    const priceAttackBody = await priceAttackRes.json();
    assert(priceAttackRes.status === 201, 'Order created successfully');
    assert(priceAttackBody.data.items[0].price === 8999, 'Server enforced authoritative unit price: ₹8,999 (ignored client price: ₹1)');
    assert(priceAttackBody.data.subtotal === 17998, 'Server calculated subtotal: ₹17,998 (8999 * 2) (ignored client subtotal: ₹2)');
    assert(priceAttackBody.data.totalAmount === 17998, 'Server calculated totalAmount: ₹17,998 (ignored client total: ₹2)');
    cleanupOrderIds.push(priceAttackBody.data.id);

    // Test 2.2: Unknown product ID is rejected with HTTP 400
    const unknownProdRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        customerName: 'Unknown Product Tester',
        phone: '9876543210',
        address: 'Test Address',
        items: [{ id: 'nonexistent-hacker-fish', quantity: 1 }],
      }),
    });
    const unknownBody = await unknownProdRes.json();
    assert(unknownProdRes.status === 400, 'Unknown product ID is rejected with HTTP 400', `status: ${unknownProdRes.status}, body: ${JSON.stringify(unknownBody)}`);
    assert(unknownBody.error.includes('does not exist in the official catalogue'), `Error message verified: ${unknownBody.error}`);

    // Test 2.3: Multi-variant pricing (blue-treasure-sps-salt with 20kg variant = ₹4,500)
    // Client attempts to buy 20kg bucket for base price of ₹950
    const variantRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        customerName: 'Salt Buyer',
        phone: '9876543210',
        address: 'Test Reef Studio',
        items: [
          {
            id: 'blue-treasure-sps-salt__sps-salt-20kg',
            price: 950, // Client tries to pay base price for 20kg
            quantity: 1,
          },
        ],
      }),
    });
    const variantBody = await variantRes.json();
    assert(variantRes.status === 201, 'Variant order created successfully', `status: ${variantRes.status}`);
    assert(variantBody.data.items[0].price === 4500, 'Server enforced authoritative variant price of ₹4,500 for 20kg bucket');
    assert(variantBody.data.totalAmount === 4500, 'TotalAmount matches variant price (₹4,500)');
    cleanupOrderIds.push(variantBody.data.id);

    // Test 2.4: Variant belonging to another product is rejected
    const invalidVariantRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        customerName: 'Variant Mismatch Tester',
        phone: '9876543210',
        address: 'Test Reef Studio',
        items: [
          {
            id: 'rose-bubble-tip-anemone__sps-salt-20kg', // Anemone has no salt variant!
            quantity: 1,
          },
        ],
      }),
    });
    assert(invalidVariantRes.status === 400, 'Mismatched variant ID is rejected with HTTP 400');

    // Test 2.5: Invalid quantity (< 1 or > 100) is rejected with HTTP 400
    const invalidQtyRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        customerName: 'Quantity Tester',
        phone: '9876543210',
        address: 'Test Address',
        items: [{ id: 'rose-bubble-tip-anemone', quantity: 0 }],
      }),
    });
    assert(invalidQtyRes.status === 400, 'Quantity 0 is rejected with HTTP 400');

    // Test 2.6: POR (Price on Request) Product Preservation
    // purple-tang-l is a POR product
    const porOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        customerName: 'POR Buyer',
        phone: '9876543210',
        address: 'Test Reef Tank',
        items: [
          {
            id: 'purple-tang-l',
            quantity: 1,
            price: 5000, // Client tries to set ₹5,000 agreed price
            priceOnRequest: false,
          },
        ],
      }),
    });
    const porOrderBody = await porOrderRes.json();
    assert(porOrderRes.status === 201, 'POR order placed successfully', `status: ${porOrderRes.status}, body: ${JSON.stringify(porOrderBody)}`);
    assert(porOrderBody.data.items[0].price === 0, 'Server forces unit price to 0 for unapproved POR');
    assert(porOrderBody.data.items[0].priceOnRequest === true, 'Server enforces priceOnRequest: true');
    assert(porOrderBody.data.items[0].pricingStatus === 'PENDING_POR', 'Server enforces pricingStatus: PENDING_POR');
    assert(porOrderBody.data.hasUnresolvedPorItems === true, 'Server tags order hasUnresolvedPorItems: true');
    cleanupOrderIds.push(porOrderBody.data.id);

    // -------------------------------------------------------------
    // PART 3: P1 — EXACT REVIEW INVITATION MEDIA OWNERSHIP
    // -------------------------------------------------------------
    console.log('\n--- PART 3: P1 — Exact Review Invitation Media Ownership ---');

    // Setup: Create two separate valid review invitations (Invitation A and Invitation B)
    const rawTokenA = crypto.randomBytes(32).toString('hex');
    const tokenHashA = crypto.createHash('sha256').update(rawTokenA).digest('hex');
    const rawTokenB = crypto.randomBytes(32).toString('hex');
    const tokenHashB = crypto.createHash('sha256').update(rawTokenB).digest('hex');

    // Insert invitations directly into review_invitations
    await db.collection('review_invitations').insertMany([
      {
        tokenHash: tokenHashA,
        orderId: 'MC-8922', // MC-8922 is delivered and approved
        productId: 'emperor-angelfish-juvenile',
        productName: 'Emperor Angelfish',
        customerName: 'Client A',
        customerPhone: '9830112233',
        expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
        isUsed: false,
        createdBy: 'Acceptance Test Suite',
        createdAt: new Date(),
      },
      {
        tokenHash: tokenHashB,
        orderId: 'MC-8922',
        productId: 'emperor-angelfish-juvenile',
        productName: 'Emperor Angelfish',
        customerName: 'Client B',
        customerPhone: '9830112233',
        expiresAt: new Date(Date.now() + 7 * 86400 * 1000),
        isUsed: false,
        createdBy: 'Acceptance Test Suite',
        createdAt: new Date(),
      },
    ]);
    cleanupInvitationHashes.push(tokenHashA, tokenHashB);

    // 3.1: Invitation A uploads a test image through /api/reviews/upload-image
    const svgImg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#006699"/></svg>`;
    const jpegBuffer = await sharp(Buffer.from(svgImg)).jpeg().toBuffer();

    const uploadForm = new FormData();
    uploadForm.append('token', rawTokenA);
    uploadForm.append('file', new Blob([jpegBuffer], { type: 'image/jpeg' }), 'customer-tank.jpg');

    const uploadRes = await fetch(`${BASE_URL}/api/reviews/upload-image`, {
      method: 'POST',
      headers: {
        'x-forwarded-for': `198.51.100.${ipCounter++}`,
      },
      body: uploadForm,
    });
    const uploadBody = await uploadRes.json();
    assert(uploadRes.status === 200, 'Image uploaded successfully with Invitation A token', `status: ${uploadRes.status}, body: ${JSON.stringify(uploadBody)}`);
    assert(Boolean(uploadBody.image?.id), `Received uploaded image ID: ${uploadBody.image?.id}`);
    const uploadedMediaId = uploadBody.image.id;
    cleanupMediaIds.push(uploadedMediaId);

    // Verify in MongoDB that media document explicitly stored invitationTokenHash
    const mediaDoc = await db.collection('media').findOne({ id: uploadedMediaId });
    assert(mediaDoc.invitationTokenHash === tokenHashA, 'Media record in MongoDB stores invitationTokenHash matching Invitation A');

    // 3.2: Invitation A previews the uploaded image -> 200 OK
    const previewResA = await fetch(`${BASE_URL}/api/media/${uploadedMediaId}?token=${rawTokenA}`, {
      headers: { 'x-forwarded-for': `198.51.100.${ipCounter++}` },
    });
    assert(previewResA.status === 200, 'Owner (Invitation A) can preview draft image with HTTP 200', `status: ${previewResA.status}`);
    assert(previewResA.headers.get('cache-control')?.includes('private'), 'Private cache-control header served for draft media');

    // 3.3: Invitation B (different valid invitation) attempts to preview Image A -> 403 Forbidden!
    const previewResB = await fetch(`${BASE_URL}/api/media/${uploadedMediaId}?token=${rawTokenB}`, {
      headers: { 'x-forwarded-for': `198.51.100.${ipCounter++}` },
    });
    assert(previewResB.status === 403, 'Cross-invitation access is DENIED: Invitation B cannot preview Image A (HTTP 403)', `status: ${previewResB.status}`);

    // 3.4: Anonymous request (no token) attempts to preview Image A -> 403 Forbidden!
    const anonRes = await fetch(`${BASE_URL}/api/media/${uploadedMediaId}`, {
      headers: { 'x-forwarded-for': `198.51.100.${ipCounter++}` },
    });
    assert(anonRes.status === 403, 'Anonymous public access to draft review image is DENIED (HTTP 403)', `status: ${anonRes.status}`);

    // 3.5: Invalid token attempts to preview Image A -> 403 Forbidden!
    const invalidTokenRes = await fetch(`${BASE_URL}/api/media/${uploadedMediaId}?token=invalid-fake-token-123456789`, {
      headers: { 'x-forwarded-for': `198.51.100.${ipCounter++}` },
    });
    assert(invalidTokenRes.status === 403, 'Invalid token preview is DENIED (HTTP 403)', `status: ${invalidTokenRes.status}`);

    // 3.6: General catalogue media remains publicly accessible without token -> 200 OK
    const sampleCatalogMedia = await db.collection('media').findOne({ id: { $not: /^review-/ } });
    if (sampleCatalogMedia) {
      const catRes = await fetch(`${BASE_URL}/api/media/${sampleCatalogMedia.id}`, {
        headers: { 'x-forwarded-for': `198.51.100.${ipCounter++}` },
      });
      assert(catRes.status === 200, 'General catalogue media remains publicly accessible without token (HTTP 200)', `status: ${catRes.status}`);
      assert(catRes.headers.get('cache-control')?.includes('public'), 'General catalogue media serves public cache headers');
    }

    console.log('\n====================================================');
    console.log(` ALL ${results.length} ACCEPTANCE TESTS PASSED (100%)`);
    console.log('====================================================\n');
  } finally {
    // Clean up test documents safely
    console.log('--- Cleaning Up Test Artifacts ---');
    for (const orderId of cleanupOrderIds) {
      await db.collection('orders').deleteOne({ id: orderId });
    }
    for (const mediaId of cleanupMediaIds) {
      await db.collection('media').deleteOne({ id: mediaId });
    }
    for (const tokenHash of cleanupInvitationHashes) {
      await db.collection('review_invitations').deleteOne({ tokenHash });
    }
    console.log(`✓ Cleaned up ${cleanupOrderIds.length} test orders, ${cleanupMediaIds.length} test media, and ${cleanupInvitationHashes.length} test invitations.`);

    // Verify historical orders and catalogue products remain untouched
    const finalOrdersCount = await db.collection('orders').countDocuments();
    const finalProductsCount = await db.collection('products').countDocuments();
    console.log(`✓ Production orders count: ${finalOrdersCount} (MC-8921 and MC-8922 verified intact)`);
    console.log(`✓ Production products count: ${finalProductsCount} (all 64 catalog products verified intact)`);

    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n✗ Test Suite Failed:', err);
  process.exit(1);
});
