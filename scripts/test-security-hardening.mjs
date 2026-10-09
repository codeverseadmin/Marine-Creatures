import { createHmac, randomBytes } from 'crypto';

const BASE_URL = 'http://localhost:3000';
const SESSION_SECRET = process.env.SESSION_SECRET || 'b7d3f8921e4a5c0982d614e5a9018e652391b42ef01928475a839201f82c6109';

function createTestAdminCookie() {
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString('hex');
  const payload = `mc_admin_${timestamp}_${nonce}`;
  const payloadBase64 = Buffer.from(payload).toString('base64url');
  const signature = createHmac('sha256', SESSION_SECRET).update(payloadBase64).digest('hex');
  return `mc_admin_session=${payloadBase64}.${signature}`;
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'x-forwarded-for': options.ip || '10.10.1.1',
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });
  const status = res.status;
  const retryAfter = res.headers.get('retry-after');
  let data = null;
  try {
    data = await res.json();
  } catch {
    // text
  }
  return { status, data, headers: res.headers, retryAfter };
}

async function runTests() {
  console.log('=== MARINE CREATURES SECURITY VERIFICATION SUITE ===');
  const adminCookie = createTestAdminCookie();
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, testName, detail = null) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${testName}`, detail ? `- Status: ${detail.status}, Body: ${JSON.stringify(detail.data)}` : '');
      failedCount++;
    }
  }

  // --- SUITE 1: BULK ORDERS API PROTECTION ---
  console.log('\n[1] SUITE: Bulk Orders Access Control');
  const bulkUnauth = await request('/api/orders', { ip: '10.10.1.1' });
  assert(bulkUnauth.status === 401, 'Unauthenticated GET /api/orders returns 401', bulkUnauth);

  const bulkAdmin = await request('/api/orders', { ip: '10.10.1.1', headers: { Cookie: adminCookie } });
  assert(bulkAdmin.status === 200 && Array.isArray(bulkAdmin.data?.data), 'Authenticated admin GET /api/orders returns 200', bulkAdmin);

  // --- SUITE 2: INVOICE TOKEN AUTHORIZATION & DATA PROTECTION ---
  console.log('\n[2] SUITE: Secure Invoice Access');
  const orderId = 'MC-8922';
  const testIp = '10.20.1.1';

  // 1. Unauthenticated without token
  const noToken = await request(`/api/orders/${orderId}`, { ip: testIp });
  assert(noToken.status === 401 && noToken.data?.requiresToken === true, 'GET /api/orders/[id] without token returns 401 requiresToken', noToken);

  // 2. Legacy 4-digit phone attempt
  const legacyPhone = await request(`/api/orders/${orderId}?phone=3210`, { ip: testIp });
  assert(legacyPhone.status === 401 && legacyPhone.data?.requiresToken === true, 'Legacy 4-digit phone alone is rejected (401 requiresToken)', legacyPhone);

  // 3. Invalid token format
  const badToken = await request(`/api/orders/${orderId}?token=invalid-token-1234`, { ip: testIp });
  assert(badToken.status === 401, 'Invalid invoice token is rejected with 401', badToken);

  // 4. Admin issues valid token
  const issueRes = await request(`/api/orders/${orderId}`, {
    method: 'POST',
    ip: testIp,
    headers: { Cookie: adminCookie },
  });
  assert(issueRes.status === 200 && issueRes.data?.token, 'Admin successfully issues cryptographic invoice token', issueRes);
  const validToken = issueRes.data?.token;

  // 5. Authorized invoice access with valid token
  const authInvoice = await request(`/api/orders/${orderId}?token=${validToken}`, { ip: testIp });
  assert(authInvoice.status === 200 && authInvoice.data?.data, 'Authorized access with valid token returns 200', authInvoice);
  const invoiceData = authInvoice.data?.data;

  // 6. Data serialization check: No raw Mongo fields or token hashes leaked
  assert(invoiceData?._id === undefined, 'Raw MongoDB _id is excluded from invoice response');
  assert(invoiceData?.invoiceTokenHash === undefined, 'Internal invoiceTokenHash is excluded from invoice response');
  assert(invoiceData?.__v === undefined, 'Internal MongoDB __v is excluded from invoice response');
  assert(Boolean(invoiceData?.customerName && invoiceData?.items), 'Required invoice fields (customerName, items) are present');

  // 7. Token for Order A cannot access Order B
  const allOrders = bulkAdmin.data?.data || [];
  const otherOrder = allOrders.find((o) => o.id !== orderId) || { id: 'MC-8921' };
  const orderB = otherOrder.id;
  const crossOrder = await request(`/api/orders/${orderB}?token=${validToken}`, { ip: '10.25.1.1' });
  assert(crossOrder.status === 401, 'Token for Order A is rejected for Order B (Cross-Order access blocked)', crossOrder);

  // 8. Admin invoice workflow
  const adminInvoice = await request(`/api/orders/${orderId}`, { ip: testIp, headers: { Cookie: adminCookie } });
  assert(adminInvoice.status === 200 && adminInvoice.data?.isAdmin === true, 'Admin session can access invoice without token', adminInvoice);

  // --- SUITE 3: CUSTOMER TRACKING ENDPOINT ---
  console.log('\n[3] SUITE: Secure Customer Tracking');
  const trackIp = '10.30.1.1';

  // 1. Missing order reference
  const missingRef = await request('/api/orders/track', { ip: trackIp });
  assert(missingRef.status === 400, 'Missing order parameter returns 400', missingRef);

  // 2. Unknown order reference (generic response)
  const unknownOrder = await request('/api/orders/track?orderId=MC-NONEXISTENT-999', { ip: trackIp });
  assert(unknownOrder.status === 404 && unknownOrder.data?.error?.includes('unavailable'), 'Unknown order returns generic 404 (unavailable)', unknownOrder);

  // 3. Public tracking (no token or auth): Basic progress only
  const publicTrack = await request(`/api/orders/track?orderId=${orderId}`, { ip: trackIp });
  assert(publicTrack.status === 200, 'Public tracking returns 200', publicTrack);
  const trackData = publicTrack.data?.data;

  assert(trackData?.detailedShipment === false, 'Public tracking tier flags detailedShipment as false');
  assert(trackData?.awbNumber === null, 'Carrier AWB number is redacted (null) on public tier');
  assert(trackData?.courierName === 'Priority Air Cargo Partner', 'Courier name is generic partner on public tier');
  assert(trackData?.phone === undefined, 'Customer phone number is excluded from tracking');
  assert(trackData?.address === undefined, 'Customer residential address is excluded from tracking');
  assert(trackData?.orderNotes === undefined, 'Customer internal order notes are excluded from tracking');
  assert(trackData?.totalAmount === undefined, 'Financial totals are excluded from tracking');
  assert(Boolean(trackData?.customerMaskedName && trackData.customerMaskedName.includes('*')), 'Customer name is masked in tracking');

  // 4. Authorized tracking with token: Unlocks detailed shipment
  const authTrack = await request(`/api/orders/track?orderId=${orderId}&token=${validToken}`, { ip: trackIp });
  assert(authTrack.status === 200 && authTrack.data?.data?.detailedShipment === true, 'Authorized tracking with token unlocks detailed shipment', authTrack);
  assert(authTrack.data?.data?.courierName && authTrack.data?.data?.courierName !== 'Priority Air Cargo Partner', 'Authorized tracking discloses specific carrier partner');
  assert(authTrack.data?.data?.phone === undefined, 'Authorized tracking still excludes phone number');
  assert(authTrack.data?.data?.address === undefined, 'Authorized tracking still excludes residential street address');

  // --- SUITE 4: SERVER-SIDE RATE LIMITING ---
  console.log('\n[4] SUITE: Server-Side Rate Limiting');
  let rateLimited = false;
  let retryAfterHeader = null;

  for (let i = 0; i < 40; i++) {
    const res = await request(`/api/orders/MC-TEST-RATE?token=0000000000000000000000000000000000000000000000000000000000000000`, {
      ip: '10.99.99.99',
    });
    if (res.status === 429) {
      rateLimited = true;
      retryAfterHeader = res.retryAfter;
      break;
    }
  }
  assert(rateLimited, 'Repeated unauthorized invoice requests trigger HTTP 429 Too Many Requests');
  assert(Boolean(retryAfterHeader), `HTTP 429 response includes Retry-After header (${retryAfterHeader}s)`);

  console.log(`\n=== TEST SUITE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED ===\n`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
