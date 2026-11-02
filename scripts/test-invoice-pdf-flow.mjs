/**
 * test-invoice-pdf-flow.mjs
 * End-to-end integration test for the new WhatsApp Invoice PDF delivery workflow.
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';
const PASSCODE = 'mc@admin#2026!';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url, BASE_URL);
    const reqOptions = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const bodyBuffer = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          headers: res.headers,
          buffer: bodyBuffer,
          text: bodyBuffer.toString('utf8'),
          json: () => JSON.parse(bodyBuffer.toString('utf8')),
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== Marine Creatures Invoice PDF Flow Tests ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // 1. Unauthorized Access Test
    console.log('[1] Testing Security: Unauthenticated access rejection');
    const unauthRes = await request('/api/admin/orders/MC-611716YH/invoice-pdf');
    assert(unauthRes.status === 401, 'Unauthenticated request returns 401 Unauthorized');
    const unauthJson = unauthRes.json();
    assert(unauthJson.success === false, 'Response has success: false');

    // 2. Admin Login
    console.log('\n[2] Authenticating as Administrator');
    const loginRes = await request('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: PASSCODE }),
    });
    assert(loginRes.status === 200, 'Admin login succeeded (200 OK)');
    const setCookie = loginRes.headers['set-cookie'];
    assert(setCookie && setCookie.length > 0, 'Session cookie returned');
    const sessionCookie = Array.isArray(setCookie) ? setCookie[0].split(';')[0] : setCookie.split(';')[0];
    console.log(`      Cookie: ${sessionCookie.split('=')[0]}=***`);

    const authHeaders = {
      Cookie: sessionCookie,
    };

    // 3. 404 on Non-existent Order
    console.log('\n[3] Testing Non-Existent Order handling');
    const notFoundRes = await request('/api/admin/orders/MC-NONEXISTENT999/invoice-pdf', {
      headers: authHeaders,
    });
    assert(notFoundRes.status === 404, 'Non-existent order returns 404 Not Found');

    // 4. Retrieve Existing Orders to get a valid order
    console.log('\n[4] Querying an existing order from database');
    const ordersRes = await request('/api/admin/orders?limit=5', {
      headers: authHeaders,
    });
    assert(ordersRes.status === 200, 'Fetch orders list returned 200 OK');
    const ordersData = ordersRes.json();
    assert(ordersData.data && ordersData.data.length > 0, `Found ${ordersData.data?.length || 0} orders in database`);

    const testOrder = ordersData.data[0];
    console.log(`      Using target order: #${testOrder.id} (${testOrder.customerName})`);

    // 5. Generate and Fetch Invoice PDF
    console.log('\n[5] Generating Server-Side Invoice PDF');
    const pdfRes = await request(`/api/admin/orders/${testOrder.id}/invoice-pdf`, {
      headers: authHeaders,
    });

    assert(pdfRes.status === 200, 'PDF endpoint returned 200 OK');
    assert(pdfRes.headers['content-type'] === 'application/pdf', 'Content-Type is application/pdf');
    assert(
      pdfRes.headers['content-disposition']?.includes('attachment') &&
      pdfRes.headers['content-disposition']?.includes('.pdf'),
      `Content-Disposition header is attachment with .pdf filename: ${pdfRes.headers['content-disposition']}`
    );
    assert(pdfRes.headers['cache-control']?.includes('no-store'), 'Cache-Control prohibits public CDN caching');

    // 6. Inspect PDF Binary Signature
    console.log('\n[6] Validating PDF Binary Signature & Integrity');
    const magicHeader = pdfRes.buffer.subarray(0, 5).toString('ascii');
    assert(magicHeader === '%PDF-', `Binary starts with valid PDF magic number (%PDF-), got: ${magicHeader}`);
    assert(pdfRes.buffer.length > 2000, `PDF size is valid and realistic: ${pdfRes.buffer.length} bytes`);

    // 7. Test Customer View Isolation
    console.log('\n[7] Verifying Customer Web View Isolation');
    const custRes = await request(`/api/orders/${testOrder.id}`);
    assert(custRes.status === 401, 'Customer API without token correctly rejects access (401)');

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();

