import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:3099';

// Load MONGODB_URI for read-only / test cleanup
const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
  ? path.resolve(process.cwd(), '.env.local')
  : path.resolve(process.cwd(), 'marine-creatures', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function runLiveHttpTests() {
  console.log('====================================================');
  console.log(' MARINE CREATURES — PHASE 2.1 LIVE HTTP ACCEPTANCE');
  console.log(' Actual Next.js Production Server HTTP Verification');
  console.log(` Target: ${BASE_URL}`);
  console.log('====================================================\n');

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

  // Connect to DB for post-test cleanup of any test-isolated IDs
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  try {
    // -------------------------------------------------------------
    // TEST 1: Admin RBAC Authorization Gating (HTTP)
    // -------------------------------------------------------------
    console.log('--- 1. Admin RBAC Authorization Gating (HTTP) ---');

    // 1.1 GET /api/admin/reviews without auth
    const res1 = await fetch(`${BASE_URL}/api/admin/reviews`);
    assert(res1.status === 401, 'GET /api/admin/reviews rejects unauthenticated requests with HTTP 401', `status: ${res1.status}`);

    // 1.2 POST /api/admin/reviews/invitations without auth
    const res2 = await fetch(`${BASE_URL}/api/admin/reviews/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'MC-8921', productId: 'blue-treasure-sps-sea-salt' }),
    });
    assert(res2.status === 401, 'POST /api/admin/reviews/invitations rejects unauthenticated requests with HTTP 401', `status: ${res2.status}`);

    // 1.3 PATCH /api/admin/reviews/[id] without auth
    const res3 = await fetch(`${BASE_URL}/api/admin/reviews/rev-nonexistent`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert(res3.status === 401, 'PATCH /api/admin/reviews/[id] rejects unauthenticated requests with HTTP 401', `status: ${res3.status}`);

    // -------------------------------------------------------------
    // TEST 2: Review Invitation Verification Endpoint (HTTP)
    // -------------------------------------------------------------
    console.log('\n--- 2. Review Invitation Verification Endpoint (HTTP) ---');

    // 2.1 Missing token
    const res4 = await fetch(`${BASE_URL}/api/reviews/invitation/verify`);
    const body4 = await res4.json();
    assert(res4.status === 400 && body4.valid === false, 'GET /api/reviews/invitation/verify with missing token returns HTTP 400 (valid: false)');

    // 2.2 Short token (< 16 chars)
    const res5 = await fetch(`${BASE_URL}/api/reviews/invitation/verify?token=short`);
    const body5 = await res5.json();
    assert(res5.status === 400 && body5.valid === false, 'GET /api/reviews/invitation/verify with short token (< 16 chars) returns HTTP 400');

    // 2.3 Non-existent token (64 hex chars)
    const fakeToken = 'a'.repeat(64);
    const res6 = await fetch(`${BASE_URL}/api/reviews/invitation/verify?token=${fakeToken}`);
    const body6 = await res6.json();
    assert(res6.status === 404 && body6.valid === false, 'GET /api/reviews/invitation/verify with non-existent token returns HTTP 404');

    // -------------------------------------------------------------
    // TEST 3: Review Submission Validation (HTTP)
    // -------------------------------------------------------------
    console.log('\n--- 3. Review Submission Validation (HTTP) ---');

    // 3.1 Missing token
    const res7 = await fetch(`${BASE_URL}/api/reviews/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, title: 'Superb Quality', comment: 'Exemplary specimen.' }),
    });
    const body7 = await res7.json();
    assert(res7.status === 400 && body7.error.includes('token'), 'POST /api/reviews/submit rejects missing token with HTTP 400');

    // 3.2 Out-of-bounds rating (6 stars)
    const res8 = await fetch(`${BASE_URL}/api/reviews/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: fakeToken, rating: 6, title: 'Valid Headline', comment: 'Valid long comment about the specimen.' }),
    });
    const body8 = await res8.json();
    assert(res8.status === 400 && body8.error.includes('between 1 and 5'), 'POST /api/reviews/submit rejects invalid rating (6 stars) with HTTP 400');

    // 3.3 Short headline (< 3 chars)
    const res9 = await fetch(`${BASE_URL}/api/reviews/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: fakeToken, rating: 5, title: 'hi', comment: 'Valid long comment about the specimen.' }),
    });
    const body9 = await res9.json();
    assert(res9.status === 400 && body9.error.includes('between 3 and 120'), 'POST /api/reviews/submit rejects short headline (<3 chars) with HTTP 400');

    // 3.4 Short comment (< 10 chars)
    const res10 = await fetch(`${BASE_URL}/api/reviews/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: fakeToken, rating: 5, title: 'Valid Title', comment: 'too short' }),
    });
    const body10 = await res10.json();
    assert(res10.status === 400 && body10.error.includes('between 10 and 2000'), 'POST /api/reviews/submit rejects short comment (<10 chars) with HTTP 400');

    // 3.5 Fake token submission -> 404 (Token not found)
    const res11 = await fetch(`${BASE_URL}/api/reviews/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: fakeToken, rating: 5, title: 'Pristine specimen', comment: 'The saltwater mix parameters were chemically verified and balanced perfectly.' }),
    });
    const body11 = await res11.json();
    assert(res11.status === 404 && body11.error.includes('unrecognized'), 'POST /api/reviews/submit with unknown token returns HTTP 404');

    // -------------------------------------------------------------
    // TEST 4: Review Image Upload Security (HTTP)
    // -------------------------------------------------------------
    console.log('\n--- 4. Review Image Upload Security (HTTP) ---');

    // 4.1 Upload without token -> 401
    const form1 = new FormData();
    form1.append('file', new Blob(['fake image content'], { type: 'image/jpeg' }), 'test.jpg');
    const res12 = await fetch(`${BASE_URL}/api/reviews/upload-image`, {
      method: 'POST',
      body: form1,
    });
    assert(res12.status === 401, 'POST /api/reviews/upload-image without token returns HTTP 401');

    // 4.2 Upload with invalid token -> 403
    const form2 = new FormData();
    form2.append('token', fakeToken);
    form2.append('file', new Blob(['fake image content'], { type: 'image/jpeg' }), 'test.jpg');
    const res13 = await fetch(`${BASE_URL}/api/reviews/upload-image`, {
      method: 'POST',
      body: form2,
    });
    assert(res13.status === 403, 'POST /api/reviews/upload-image with invalid token returns HTTP 403 Forbidden');

    // -------------------------------------------------------------
    // TEST 5: Public Order Creation Security & Allowlist (HTTP)
    // -------------------------------------------------------------
    console.log('\n--- 5. Public Order Creation Security & Allowlist (HTTP) ---');

    const testOrderId = `MC-AUDIT-HTTP-${Date.now()}`;
    const forgedOrderPayload = {
      id: testOrderId,
      customerName: 'Audit Tester',
      phone: '9876543210',
      address: 'Marine Laboratory Building 4, Port Blair',
      city: 'Port Blair',
      pincode: '744101',
      // Attacker attempts to forge fulfillment & approval:
      currentStep: 'delivered',
      isApproved: true,
      awbNumber: 'FORGED-AWB-999',
      courierName: 'Hacker Express',
      invoiceNumber: 'INV-FORGED-999',
      items: [
        {
          id: 'blue-treasure-sps-sea-salt',
          name: 'Blue Treasure SPS Sea Salt',
          price: 950,
          quantity: 2,
        },
      ],
    };

    const res14 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forgedOrderPayload),
    });
    const body14 = await res14.json();

    assert(res14.status === 201, 'POST /api/orders responds with HTTP 201 Created');
    assert(body14.data.currentStep === 'placed', 'POST /api/orders forces currentStep to "placed" (attacker supplied "delivered")');
    assert(body14.data.isApproved === false, 'POST /api/orders forces isApproved to false (attacker supplied true)');
    assert(body14.data.awbNumber === undefined, 'POST /api/orders does not return attacker awbNumber');
    assert(body14.data.courierName === 'Priority Air Cargo Express', 'POST /api/orders sets system default courierName');
    assert(body14.data.totalAmount === 1900, 'POST /api/orders calculates subtotal server-side (950 * 2 = 1900)');

    // Verify directly in MongoDB that forged fields were NOT saved
    const savedOrderInDb = await db.collection('orders').findOne({ id: testOrderId });
    assert(savedOrderInDb.currentStep === 'placed', 'Database confirms currentStep is strictly "placed"');
    assert(savedOrderInDb.isApproved === false, 'Database confirms isApproved is strictly false');
    assert(!savedOrderInDb.awbNumber, 'Database confirms awbNumber is undefined/null');
    assert(!savedOrderInDb.invoiceNumber, 'Database confirms invoiceNumber is undefined/null');

    // Clean up test order immediately
    await db.collection('orders').deleteOne({ id: testOrderId });
    console.log(`  ✓ Isolated test order ${testOrderId} safely purged from database.`);

    // -------------------------------------------------------------
    // TEST 6: Public Approved Reviews Presentation Endpoint (HTTP)
    // -------------------------------------------------------------
    console.log('\n--- 6. Public Approved Reviews Presentation Endpoint (HTTP) ---');

    const res15 = await fetch(`${BASE_URL}/api/products/blue-treasure-sps-sea-salt/reviews`);
    const body15 = await res15.json();
    assert(res15.status === 200, 'GET /api/products/[id]/reviews returns HTTP 200 OK');
    assert(body15.success === true, 'Response indicates success: true');
    assert(body15.count === 0, 'Unmoderated / mock reviews are absent (count === 0)');
    assert(body15.averageRating === null, 'No synthetic rating returned (averageRating === null)');
    assert(Array.isArray(body15.reviews) && body15.reviews.length === 0, 'Empty review list for product without approved reviews');

    // -------------------------------------------------------------
    // TEST 7: Review Media Access Control (HTTP)
    // -------------------------------------------------------------
    console.log('\n--- 7. Review Media Access Control (HTTP) ---');

    // 7.1 Non-existent review media -> 404
    const res16 = await fetch(`${BASE_URL}/api/media/review-nonexistent-123456.jpg`);
    assert(res16.status === 404, 'GET /api/media/review-nonexistent returns HTTP 404');

    // 7.2 Non-review existing product media -> 200 (if media exists in collection)
    const existingMedia = await db.collection('media').findOne({});
    if (existingMedia) {
      const res17 = await fetch(`${BASE_URL}/api/media/${existingMedia.id}`);
      assert(res17.status === 200, `GET /api/media/${existingMedia.id} returns HTTP 200 with public cache headers`);
      const cacheHeader = res17.headers.get('cache-control') || '';
      assert(cacheHeader.includes('public'), 'General product media has public cache header');
    } else {
      console.log('  ℹ No general media in database to test public streaming header.');
    }

    console.log('\n====================================================');
    console.log(` ALL ${results.length} LIVE HTTP ACCEPTANCE TESTS PASSED (100%)`);
    console.log('====================================================\n');
  } finally {
    await mongoose.disconnect();
  }
}

runLiveHttpTests().catch((err) => {
  console.error('\n✗ Live HTTP Test Suite Failed:', err);
  process.exit(1);
});

