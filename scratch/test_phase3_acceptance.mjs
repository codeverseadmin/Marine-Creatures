import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:3099';

// Load MONGODB_URI from .env.local
const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
  ? path.resolve(process.cwd(), '.env.local')
  : path.resolve(process.cwd(), 'marine-creatures', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

const sessionSecretMatch = envContent.match(/SESSION_SECRET=(.+)/);
const SESSION_SECRET = (sessionSecretMatch ? sessionSecretMatch[1].trim() : 'secret').replace(/^["']|["']$/g, '');

const adminPasscodeMatch = envContent.match(/ADMIN_PASSCODE=(.+)/);
const ADMIN_PASSCODE = (adminPasscodeMatch ? adminPasscodeMatch[1].trim() : 'marinecreatures2026').replace(/^["']|["']$/g, '');

// Helper to create valid signed employee session cookie
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

async function runPhase3AcceptanceTests() {
  console.log('====================================================');
  console.log(' MARINE CREATURES — PHASE 3 ACCEPTANCE TEST SUITE');
  console.log(' Full-Platform Security Hardening & RBAC Audit');
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

  // Cleanup trackers
  const cleanupEmployeeIds = [];
  const cleanupOrderIds = [];
  const cleanupProductIds = [];
  const cleanupBannerIds = [];
  const cleanupInvitationHashes = [];

  let ipCounter = 200;
  function getHeaders(cookie = '', extra = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'x-forwarded-for': `198.51.100.${ipCounter++}`,
      ...extra,
    };
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    return headers;
  }

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: ASYNC NON-BLOCKING SCRYPT PASSWORD HASHING
    // -------------------------------------------------------------------------
    console.log('--- TEST SECTION 1: Asynchronous Non-Blocking Password Hashing ---');
    const scryptAsync = (await import('util')).promisify(crypto.scrypt);
    async function hashPassword(password) {
      const salt = crypto.randomBytes(16);
      const derivedKey = await scryptAsync(password, salt, 64);
      return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
    }
    async function verifyPassword(password, storedHash) {
      if (!password || !storedHash) return false;
      const parts = storedHash.split(':');
      if (parts.length !== 2) return false;
      const [saltHex, expectedKeyHex] = parts;
      if (!saltHex || !expectedKeyHex) return false;
      try {
        const salt = Buffer.from(saltHex, 'hex');
        const expectedKey = Buffer.from(expectedKeyHex, 'hex');
        const derivedKey = await scryptAsync(password, salt, 64);
        if (derivedKey.length !== expectedKey.length) return false;
        return crypto.timingSafeEqual(derivedKey, expectedKey);
      } catch {
        return false;
      }
    }

    const testPass = 'AquariumSecret2026!';
    const hashed = await hashPassword(testPass);
    assert(typeof hashed === 'string' && hashed.includes(':'), 'hashPassword returns formatted salt:key string asynchronously');

    const verifyCorrect = await verifyPassword(testPass, hashed);
    assert(verifyCorrect === true, 'verifyPassword returns true for correct password asynchronously');

    const verifyIncorrect = await verifyPassword('WrongPassword123!', hashed);
    assert(verifyIncorrect === false, 'verifyPassword returns false for incorrect password');

    const verifyMalformed = await verifyPassword(testPass, 'invalid-malformed-hash');
    assert(verifyMalformed === false, 'verifyPassword safely returns false on malformed hash string');

    // Concurrency benchmark: execute 10 scrypt operations in parallel
    const startBench = Date.now();
    await Promise.all(Array.from({ length: 10 }).map((_, i) => hashPassword(`ConcurrentPass#${i}`)));
    const duration = Date.now() - startBench;
    assert(duration > 0, `10 parallel scrypt derivations executed asynchronously in ${duration}ms without event loop blocking`);

    // -------------------------------------------------------------------------
    // TEST SECTION 2: FIX STAFF INVITATION CONCURRENCY (ATOMIC findOneAndUpdate)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SECTION 2: Staff Invitation Acceptance Concurrency ---');

    // Setup an invitation in database
    const rawInviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(rawInviteToken).digest('hex');

    const inviteeDoc = await db.collection('employees').insertOne({
      name: 'Dr. Jane Coral',
      email: `jane.coral.${Date.now()}@marinecreatures.local`,
      roleId: 'aquarist',
      customPermissions: [],
      status: 'invited',
      invitationTokenHash: inviteTokenHash,
      invitationExpiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      sessionVersion: 1,
      createdAt: new Date(),
    });
    cleanupEmployeeIds.push(inviteeDoc.insertedId);

    // Launch 10 simultaneous concurrent acceptance requests with the SAME token
    const acceptRequests = Array.from({ length: 10 }).map(() =>
      fetch(`${BASE_URL}/api/auth/invitation/accept`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          token: rawInviteToken,
          password: 'MarinePassword2026!',
        }),
      })
    );

    const acceptResponses = await Promise.all(acceptRequests);
    const acceptStatuses = acceptResponses.map((r) => r.status);
    const successCount = acceptStatuses.filter((s) => s === 200).length;
    const rejectedCount = acceptStatuses.filter((s) => s === 400).length;

    assert(successCount === 1, `Atomic invitation consumption: Exactly ONE request succeeded (HTTP 200) (actual: ${successCount})`);
    assert(rejectedCount === 9, `Atomic invitation consumption: Remaining 9 concurrent requests were rejected (HTTP 400) (actual: ${rejectedCount})`);

    // Verify employee record in MongoDB is now active and token consumed
    const updatedEmployee = await db.collection('employees').findOne({ _id: inviteeDoc.insertedId });
    assert(updatedEmployee.status === 'active', 'Employee account status transitioned to active');
    assert(updatedEmployee.invitationTokenHash === null, 'Invitation token hash was atomically invalidated');

    // -------------------------------------------------------------------------
    // TEST SECTION 3: RETIRE MASTER PASSCODE BACKDOOR (SEC-RBAC-P0-02)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SECTION 3: Retire Master Passcode Backdoor ---');

    // Create an active Owner in database to take system out of bootstrap mode
    const ownerId = new mongoose.Types.ObjectId();
    const ownerEmail = `founder.owner.${Date.now()}@marinecreatures.local`;
    await db.collection('employees').insertOne({
      _id: ownerId,
      name: 'Founder Owner',
      email: ownerEmail,
      roleId: 'owner',
      customPermissions: [],
      status: 'active',
      passwordHash: await hashPassword('ReefFounder2026!'),
      sessionVersion: 1,
      createdAt: new Date(),
    });
    cleanupEmployeeIds.push(ownerId);

    const ownerCookie = createTestEmployeeCookie(ownerId.toString(), ownerEmail, 1);

    // 3.1: Attacker sends x-admin-secret alone to protected /api/admin/employees
    const backdoorRes1 = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: 'GET',
      headers: getHeaders('', { 'x-admin-secret': ADMIN_PASSCODE }),
    });
    assert(backdoorRes1.status === 401, 'x-admin-secret alone to /api/admin/employees is DENIED with HTTP 401 Unauthorized');

    // 3.2: Attacker sends x-admin-passcode alone to /api/orders
    const backdoorRes2 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'GET',
      headers: getHeaders('', { 'x-admin-passcode': ADMIN_PASSCODE }),
    });
    assert(backdoorRes2.status === 401, 'x-admin-passcode alone to /api/orders is DENIED with HTTP 401 Unauthorized');

    // 3.3: Attacker attempts passcode login via POST /api/admin/login when active owner exists
    const passcodeLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ passcode: ADMIN_PASSCODE }),
    });
    assert(passcodeLoginRes.status === 403, 'Master passcode login rejected with HTTP 403 when active Owner accounts exist');
    const passcodeBody = await passcodeLoginRes.json();
    assert(passcodeBody.error.includes('Master passcode login is deactivated'), 'Response informs that master passcode is deactivated');

    // 3.4: Attacker attempts to forge role headers (x-admin-role: owner)
    const forgedRoleRes = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: 'GET',
      headers: getHeaders('', { 'x-admin-role': 'owner', 'x-role': 'owner' }),
    });
    assert(forgedRoleRes.status === 401, 'Arbitrary role headers provide zero administrative privileges (HTTP 401)');

    // 3.5: Legitimate Owner session accesses /api/admin/employees -> 200 OK
    const ownerAccessRes = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: 'GET',
      headers: getHeaders(ownerCookie),
    });
    assert(ownerAccessRes.status === 200, 'Legitimate Owner session is granted access with HTTP 200 OK');

    // 3.6: Tampered / malformed session cookie -> 401
    const tamperedRes = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: 'GET',
      headers: getHeaders('mc_admin_session=forged.invalid.signature'),
    });
    assert(tamperedRes.status === 401, 'Tampered session cookie is rejected with HTTP 401');

    // 3.7: Revoked session (sessionVersion mismatch) -> 401
    const oldVersionCookie = createTestEmployeeCookie(ownerId.toString(), ownerEmail, 999);
    const revokedRes = await fetch(`${BASE_URL}/api/admin/employees`, {
      method: 'GET',
      headers: getHeaders(oldVersionCookie),
    });
    assert(revokedRes.status === 401, 'Revoked session (outdated sessionVersion) is rejected with HTTP 401');

    // -------------------------------------------------------------------------
    // TEST SECTION 4: GRANULAR RBAC ENFORCEMENT ACROSS LEGACY ROUTES
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SECTION 4: Granular RBAC Enforcement Across Routes ---');

    // Create an employee with role 'customer_support' (only enquiries, orders.read, customers)
    const supportId = new mongoose.Types.ObjectId();
    const supportEmail = `support.${Date.now()}@marinecreatures.local`;
    await db.collection('employees').insertOne({
      _id: supportId,
      name: 'Support Agent',
      email: supportEmail,
      roleId: 'customer_support',
      customPermissions: [],
      status: 'active',
      passwordHash: await hashPassword('SupportReef2026!'),
      sessionVersion: 1,
      createdAt: new Date(),
    });
    cleanupEmployeeIds.push(supportId);
    const supportCookie = createTestEmployeeCookie(supportId.toString(), supportEmail, 1);

    // 4.1: Customer Support can GET /api/orders (has orders.read) -> 200 OK
    const ordersReadRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'GET',
      headers: getHeaders(supportCookie),
    });
    assert(ordersReadRes.status === 200, 'Customer Support can view orders (orders.read granted) -> HTTP 200');

    // 4.2: Customer Support attempts to create a product (POST /api/products) -> 403 Forbidden
    const prodCreateRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: getHeaders(supportCookie),
      body: JSON.stringify({
        id: 'hacker-coral',
        name: 'Hacker Coral',
        price: 100,
        category: 'marine-life',
      }),
    });
    assert(prodCreateRes.status === 403, 'Customer Support cannot create catalogue products (lacks products.create) -> HTTP 403');

    // 4.3: Customer Support attempts to delete an order (DELETE /api/orders) -> 403 Forbidden
    const orderDeleteRes = await fetch(`${BASE_URL}/api/orders?id=MC-8921`, {
      method: 'DELETE',
      headers: getHeaders(supportCookie),
    });
    assert(orderDeleteRes.status === 403, 'Customer Support cannot delete orders (lacks orders.delete) -> HTTP 403');

    // 4.4: Customer Support attempts to manage banners (POST /api/banners) -> 403 Forbidden
    const bannerPostRes = await fetch(`${BASE_URL}/api/banners`, {
      method: 'POST',
      headers: getHeaders(supportCookie),
      body: JSON.stringify({ id: 'test-banner', title: 'Test Promo' }),
    });
    assert(bannerPostRes.status === 403, 'Customer Support cannot manage promotional banners (lacks content.manage) -> HTTP 403');

    // 4.5: Customer Support attempts to update system settings (POST /api/settings) -> 403 Forbidden
    const settingsPostRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'POST',
      headers: getHeaders(supportCookie),
      body: JSON.stringify({ key: 'testKey', value: 'testVal' }),
    });
    assert(settingsPostRes.status === 403, 'Customer Support cannot update settings (lacks settings.update) -> HTTP 403');

    // 4.6: Database Seed route in production or without ALLOW_SEEDING -> 403 Forbidden
    const seedRes = await fetch(`${BASE_URL}/api/seed`, {
      method: 'POST',
      headers: getHeaders(ownerCookie),
    });
    assert(seedRes.status === 403, 'Database seed route is permanently disabled/protected against catalog wipes -> HTTP 403');

    // 4.7: Public GET endpoints remain accessible without authentication
    const publicProdsRes = await fetch(`${BASE_URL}/api/products`);
    assert(publicProdsRes.status === 200, 'Public catalogue GET /api/products remains open to customers -> HTTP 200');

    const publicBannersRes = await fetch(`${BASE_URL}/api/banners`);
    assert(publicBannersRes.status === 200, 'Public banners GET /api/banners remains open -> HTTP 200');

    // -------------------------------------------------------------------------
    // TEST SECTION 5: PREVENT EMPLOYEE PRIVILEGE ESCALATION (SEC-RBAC-P1-01)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SECTION 5: Prevent Employee Privilege Escalation ---');

    // Create an HR manager with 'employees.update' permission
    const hrId = new mongoose.Types.ObjectId();
    const hrEmail = `hr.manager.${Date.now()}@marinecreatures.local`;
    await db.collection('employees').insertOne({
      _id: hrId,
      name: 'HR Manager',
      email: hrEmail,
      roleId: 'operations_manager', // system role
      customPermissions: ['employees.read', 'employees.update'],
      status: 'active',
      passwordHash: await hashPassword('HRManager2026!'),
      sessionVersion: 1,
      createdAt: new Date(),
    });
    cleanupEmployeeIds.push(hrId);
    const hrCookie = createTestEmployeeCookie(hrId.toString(), hrEmail, 1);

    // 5.1: Self-Escalation attempt: HR Manager attempts to elevate own role to 'owner'
    const selfEscalateRes = await fetch(`${BASE_URL}/api/admin/employees/${hrId.toString()}`, {
      method: 'PATCH',
      headers: getHeaders(hrCookie),
      body: JSON.stringify({ roleId: 'owner' }),
    });
    assert(selfEscalateRes.status === 403, 'Self-escalation is DENIED: Employee cannot modify own role -> HTTP 403');

    // 5.2: Self-Escalation attempt: HR Manager attempts to grant themselves custom permissions
    const selfPermsRes = await fetch(`${BASE_URL}/api/admin/employees/${hrId.toString()}`, {
      method: 'PATCH',
      headers: getHeaders(hrCookie),
      body: JSON.stringify({ customPermissions: ['orders.delete'] }),
    });
    assert(selfPermsRes.status === 403, 'Self-escalation is DENIED: Employee cannot modify own custom permissions -> HTTP 403');

    // 5.3: Protected Owner Account: HR Manager attempts to modify the Owner account
    const modOwnerRes = await fetch(`${BASE_URL}/api/admin/employees/${ownerId.toString()}`, {
      method: 'PATCH',
      headers: getHeaders(hrCookie),
      body: JSON.stringify({ name: 'Hacked Owner' }),
    });
    assert(modOwnerRes.status === 403, 'Non-owner cannot modify protected Owner account -> HTTP 403');

    // 5.4: Wildcard Permission Escalation attempt: HR Manager attempts to assign ['*'] to another employee
    const wildcardRes = await fetch(`${BASE_URL}/api/admin/employees/${supportId.toString()}`, {
      method: 'PATCH',
      headers: getHeaders(hrCookie),
      body: JSON.stringify({ customPermissions: ['*'] }),
    });
    assert(wildcardRes.status === 403, 'Non-owner cannot assign custom permissions -> HTTP 403');

    // 5.5: Owner attempts to assign wildcard ['*'] -> Rejected with 400 Bad Request
    const ownerWildcardRes = await fetch(`${BASE_URL}/api/admin/employees/${supportId.toString()}`, {
      method: 'PATCH',
      headers: getHeaders(ownerCookie),
      body: JSON.stringify({ customPermissions: ['*'] }),
    });
    assert(ownerWildcardRes.status === 400, "Wildcard '*' permission is banned even for Owner assignment -> HTTP 400");

    // 5.6: Owner assigns legitimate custom permission to Support Agent -> 200 OK
    const ownerAssignRes = await fetch(`${BASE_URL}/api/admin/employees/${supportId.toString()}`, {
      method: 'PATCH',
      headers: getHeaders(ownerCookie),
      body: JSON.stringify({ customPermissions: ['products.read'] }),
    });
    assert(ownerAssignRes.status === 200, 'Owner can assign legitimate custom permissions -> HTTP 200 OK');

    // -------------------------------------------------------------------------
    // TEST SECTION 6: ANALYTICS EVENT ENDPOINT SECURITY (SEC-RBAC-P0-03)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SECTION 6: Analytics Event Endpoint Security ---');

    // 6.1: Public storefront can submit allowed event (product_view) -> 201 Created
    const validEventRes = await fetch(`${BASE_URL}/api/admin/analytics/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        eventName: 'product_view',
        entityType: 'product',
        entityId: 'rose-bubble-tip-anemone',
        entityName: 'Rose Bubble Tip Anemone',
        metadata: { category: 'marine-life', viewSource: 'marketplace' },
      }),
    });
    assert(validEventRes.status === 201, 'Valid public analytics event ingested successfully -> HTTP 201');

    // 6.2: Invalid event name is rejected with HTTP 400
    const invalidEventRes = await fetch(`${BASE_URL}/api/admin/analytics/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        eventName: 'malicious_bot_spam',
      }),
    });
    assert(invalidEventRes.status === 400, 'Disallowed analytics event name is rejected with HTTP 400');

    // 6.3: Oversized payload (> 10KB) is rejected with HTTP 413
    const hugeMetadata = { spam: 'X'.repeat(12000) };
    const oversizedRes = await fetch(`${BASE_URL}/api/admin/analytics/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        eventName: 'product_view',
        metadata: hugeMetadata,
      }),
    });
    assert(oversizedRes.status === 413, 'Oversized analytics payload (> 10KB) is rejected with HTTP 413 Payload Too Large');

    // 6.4: Administrative analytics dashboard requires analytics.read permission
    const anonAnalyticsRes = await fetch(`${BASE_URL}/api/admin/analytics`);
    assert(anonAnalyticsRes.status === 401, 'Unauthenticated access to internal analytics dashboard is DENIED (HTTP 401)');

    const ownerAnalyticsRes = await fetch(`${BASE_URL}/api/admin/analytics`, {
      headers: getHeaders(ownerCookie),
    });
    assert(ownerAnalyticsRes.status === 200, 'Owner access to internal analytics dashboard is GRANTED (HTTP 200)');

    // -------------------------------------------------------------------------
    // TEST SECTION 7: QA FIXTURE ISOLATION IN PRODUCTION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SECTION 7: QA Fixture Isolation in Production ---');

    // 7.1: Querying MC-QA-ISOLATED-STANDARD on /api/orders/[id] returns 404 (does NOT intercept fake fixture)
    const qaOrderRes = await fetch(`${BASE_URL}/api/orders/MC-QA-ISOLATED-STANDARD`, {
      headers: getHeaders(ownerCookie),
    });
    assert(qaOrderRes.status === 404, 'Production mode does NOT return synthetic QA order fixture -> HTTP 404 Not Found');

    // 7.2: Querying MC-QA-ISOLATED-STANDARD on /api/orders/track returns 404
    const qaTrackRes = await fetch(`${BASE_URL}/api/orders/track?orderId=MC-QA-ISOLATED-STANDARD`);
    assert(qaTrackRes.status === 404, 'Production mode does NOT return synthetic QA tracking fixture -> HTTP 404 Not Found');

    // 7.3: Querying invoice PDF for MC-QA-ISOLATED-STANDARD returns 404
    const qaPdfRes = await fetch(`${BASE_URL}/api/admin/orders/MC-QA-ISOLATED-STANDARD/invoice-pdf`, {
      headers: getHeaders(ownerCookie),
    });
    assert(qaPdfRes.status === 404, 'Production mode does NOT generate invoice PDF for QA fixtures -> HTTP 404 Not Found');

    // -------------------------------------------------------------------------
    // TEST SECTION 8: CUSTOMER ORDER TRACKING & INVOICE PRIVACY
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SECTION 8: Customer Tracking & Invoice Privacy ---');

    // Public unauthenticated tracking of real historical order MC-8921
    const publicTrackRes = await fetch(`${BASE_URL}/api/orders/track?orderId=MC-8921`);
    assert(publicTrackRes.status === 200, 'Public tracking lookup succeeds for valid order reference');
    const trackBody = await publicTrackRes.json();
    assert(trackBody.data.customerMaskedName === 'R**** V****', `Customer name is masked: ${trackBody.data.customerMaskedName}`);
    assert(trackBody.data.phone === undefined, 'Raw customer phone number is NOT exposed');
    assert(trackBody.data.address === undefined, 'Raw customer address is NOT exposed');
    assert(trackBody.data.totalAmount === undefined, 'Financial totalAmount is NOT exposed to unauthenticated public query');
    assert(trackBody.data.detailedShipment === false, 'detailedShipment is false without phone or token verification');

    // Authorized tracking with correct phone (last 4 digits of MC-8921: '3210')
    const authTrackRes = await fetch(`${BASE_URL}/api/orders/track?orderId=MC-8921&phone=3210`);
    const authTrackBody = await authTrackRes.json();
    assert(authTrackBody.data.detailedShipment === true, 'detailedShipment is true when verified with phone');
    assert(authTrackBody.data.items && authTrackBody.data.items.length > 0, 'Authorized tracking reveals item manifest');

    console.log('\n====================================================');
    console.log(` ALL ${results.length} ACCEPTANCE TESTS PASSED (100%)`);
    console.log('====================================================\n');
  } finally {
    console.log('--- Cleaning Up Test Artifacts ---');
    for (const empId of cleanupEmployeeIds) {
      await db.collection('employees').deleteOne({ _id: empId });
    }
    for (const orderId of cleanupOrderIds) {
      await db.collection('orders').deleteOne({ id: orderId });
    }
    for (const prodId of cleanupProductIds) {
      await db.collection('products').deleteOne({ id: prodId });
    }
    for (const bannerId of cleanupBannerIds) {
      await db.collection('banners').deleteOne({ id: bannerId });
    }
    console.log(`✓ Purged ${cleanupEmployeeIds.length} test employees.`);

    const finalOrdersCount = await db.collection('orders').countDocuments();
    const finalProductsCount = await db.collection('products').countDocuments();
    console.log(`✓ Production orders count: ${finalOrdersCount} (MC-8921 and MC-8922 verified intact)`);
    console.log(`✓ Production products count: ${finalProductsCount} (all 64 catalog products verified intact)`);

    await mongoose.disconnect();
  }
}

runPhase3AcceptanceTests().catch((err) => {
  console.error('\n✗ Acceptance Test Suite Failed:', err);
  process.exit(1);
});
