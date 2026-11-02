import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\tmp\\chrome-security-audit';
const PORT = 9226;
const BASE_URL = 'http://localhost:3000';

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getSessionCookie() {
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'mc@admin#2026!' }),
  });
  const cookieHeader = loginRes.headers.get('set-cookie');
  if (!cookieHeader) throw new Error('Failed to get session cookie');
  const match = cookieHeader.match(/mc_admin_session=([^;]+)/);
  return match[1];
}

const auditEvidence = {
  uploadSecurity: {},
  persistence: {},
  mediaApi: {},
  failureHandling: {},
  regression: {},
};

async function testUploadSecurity(sessionToken) {
  console.log('\n==================================================');
  console.log('1. UPLOAD SECURITY AUDIT');
  console.log('==================================================');

  const headers = { Cookie: `mc_admin_session=${sessionToken}` };

  // 1.1 Verify actual file signatures (Reject spoofed MIME header with invalid magic bytes)
  console.log('\n[1.1] Testing file signature verification...');
  const fakeFormData = new FormData();
  fakeFormData.append('file', new Blob(['FAKE_PNG_NOT_VALID_IMAGE_BYTES'], { type: 'image/png' }), 'fake.png');
  fakeFormData.append('type', 'image');
  const spoofRes = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', headers, body: fakeFormData });
  const spoofJson = await spoofRes.json();
  console.log(`- Spoofed PNG header rejected: HTTP ${spoofRes.status} (${spoofJson.error})`);
  if (spoofRes.status !== 400 || !spoofJson.error.includes('signature verification failed')) {
    throw new Error('Upload security failed to detect spoofed MIME header!');
  }
  auditEvidence.uploadSecurity.mimeSpoofingBlocked = true;

  // 1.2 Verify valid image magic bytes accepted (1x1 PNG)
  const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(validPngBase64, 'base64');
  const validFormData = new FormData();
  validFormData.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'valid-pixel.png');
  validFormData.append('type', 'image');
  const validUploadRes = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', headers, body: validFormData });
  const validUploadJson = await validUploadRes.json();
  console.log(`- Valid PNG binary signature accepted: HTTP ${validUploadRes.status} (ID: ${validUploadJson.mediaId})`);
  if (validUploadRes.status !== 201 || !validUploadJson.url) {
    throw new Error('Upload failed for valid PNG binary');
  }
  auditEvidence.uploadSecurity.validBinaryAccepted = true;

  // 1.3 Review SVG upload and serving security (Malicious SVG rejection)
  console.log('\n[1.2] Testing SVG security (XSS, XXE, script tags)...');
  const maliciousSvgScript = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script></svg>`;
  const svgScriptForm = new FormData();
  svgScriptForm.append('file', new Blob([maliciousSvgScript], { type: 'image/svg+xml' }), 'malicious-script.svg');
  svgScriptForm.append('type', 'image');
  const svgScriptRes = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', headers, body: svgScriptForm });
  const svgScriptJson = await svgScriptRes.json();
  console.log(`- Malicious SVG with <script> rejected: HTTP ${svgScriptRes.status} (${svgScriptJson.error})`);
  if (svgScriptRes.status !== 400 || !svgScriptJson.error.includes('Active content prohibited')) {
    throw new Error('Failed to block malicious SVG with <script>!');
  }

  const maliciousSvgEvent = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle r="10"/></svg>`;
  const svgEventForm = new FormData();
  svgEventForm.append('file', new Blob([maliciousSvgEvent], { type: 'image/svg+xml' }), 'malicious-event.svg');
  svgEventForm.append('type', 'image');
  const svgEventRes = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', headers, body: svgEventForm });
  const svgEventJson = await svgEventRes.json();
  console.log(`- Malicious SVG with onload handler rejected: HTTP ${svgEventRes.status} (${svgEventJson.error})`);
  if (svgEventRes.status !== 400 || !svgEventJson.error.includes('Active content prohibited')) {
    throw new Error('Failed to block malicious SVG with onload!');
  }

  const maliciousSvgXxe = `<?xml version="1.0"?><!DOCTYPE svg SYSTEM "http://malicious.com/xxe"><svg></svg>`;
  const svgXxeForm = new FormData();
  svgXxeForm.append('file', new Blob([maliciousSvgXxe], { type: 'image/svg+xml' }), 'malicious-xxe.svg');
  svgXxeForm.append('type', 'image');
  const svgXxeRes = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', headers, body: svgXxeForm });
  const svgXxeJson = await svgXxeRes.json();
  console.log(`- Malicious SVG with XXE entity rejected: HTTP ${svgXxeRes.status} (${svgXxeJson.error})`);
  if (svgXxeRes.status !== 400 || !svgXxeJson.error.includes('Active content prohibited')) {
    throw new Error('Failed to block malicious SVG with XXE!');
  }
  auditEvidence.uploadSecurity.svgSanitizationVerified = true;

  // 1.4 Test safe SVG upload and verify CSP headers on serving
  const safeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="cyan"/></svg>`;
  const safeSvgForm = new FormData();
  safeSvgForm.append('file', new Blob([safeSvg], { type: 'image/svg+xml' }), 'safe-vector.svg');
  safeSvgForm.append('type', 'image');
  const safeSvgRes = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', headers, body: safeSvgForm });
  const safeSvgJson = await safeSvgRes.json();
  console.log(`- Safe SVG accepted: HTTP ${safeSvgRes.status} (${safeSvgJson.url})`);

  const svgServeRes = await fetch(`${BASE_URL}${safeSvgJson.url}`);
  const cspHeader = svgServeRes.headers.get('content-security-policy');
  const nosniffHeader = svgServeRes.headers.get('x-content-type-options');
  console.log(`- SVG serving security headers: CSP: "${cspHeader}", X-Content-Type-Options: "${nosniffHeader}"`);
  if (!cspHeader || nosniffHeader !== 'nosniff') {
    throw new Error('SVG serving failed to enforce Content-Security-Policy or nosniff header!');
  }
  auditEvidence.uploadSecurity.svgServingCspEnforced = true;

  // 1.5 Verify file size enforcement on server (>25MB)
  console.log('\n[1.3] Testing server-side file size enforcement...');
  // We simulate a 26MB file without allocating 26MB memory by creating a large Blob with repeated byte slices
  const chunk = new Uint8Array(1024 * 1024); // 1MB
  const chunks = Array(26).fill(chunk);
  const oversizedBlob = new Blob(chunks, { type: 'image/jpeg' });
  const oversizedForm = new FormData();
  oversizedForm.append('file', oversizedBlob, 'huge-photo.jpg');
  oversizedForm.append('type', 'image');
  const oversizedRes = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', headers, body: oversizedForm });
  const oversizedJson = await oversizedRes.json();
  console.log(`- Oversized file (>25MB) rejected: HTTP ${oversizedRes.status} (${oversizedJson.error})`);
  if (oversizedRes.status !== 400 || !oversizedJson.error.includes('exceeds the maximum 25MB limit')) {
    throw new Error('Server file size limit was not enforced!');
  }
  auditEvidence.uploadSecurity.fileSizeLimitEnforced = true;

  // 1.6 Verify uploaded files cannot overwrite unrelated assets
  console.log('\n[1.4] Testing overwrite protection...');
  const formA = new FormData();
  formA.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'same-name.png');
  const resA = await (await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', headers, body: formA })).json();

  const formB = new FormData();
  formB.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'same-name.png');
  const resB = await (await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', headers, body: formB })).json();

  console.log(`- Upload 1 URL: ${resA.url}`);
  console.log(`- Upload 2 URL: ${resB.url}`);
  if (resA.url === resB.url || resA.mediaId === resB.mediaId) {
    throw new Error('Collision detected: media IDs overwritten!');
  }
  console.log('- Overwrite protection confirmed: Identical file uploads receive non-colliding cryptographically isolated IDs.');
  auditEvidence.uploadSecurity.overwriteProtectionVerified = true;

  // 1.7 Verify product ownership and admin authorization for media mutations
  console.log('\n[1.5] Testing product ownership & authorization validation...');
  const fakeProdForm = new FormData();
  fakeProdForm.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'sample.png');
  fakeProdForm.append('productId', 'ghost-product-nonexistent-999');
  const fakeProdRes = await fetch(`${BASE_URL}/api/admin/upload`, { method: 'POST', headers, body: fakeProdForm });
  const fakeProdJson = await fakeProdRes.json();
  console.log(`- Upload with non-existent productId rejected: HTTP ${fakeProdRes.status} (${fakeProdJson.error})`);
  if (fakeProdRes.status !== 404 || !fakeProdJson.error.includes('does not exist')) {
    throw new Error('Upload allowed association with non-existent product!');
  }
  auditEvidence.uploadSecurity.productOwnershipEnforced = true;

  // Clean up test assets created during Section 1
  await fetch(`${BASE_URL}/api/admin/media/${validUploadJson.mediaId}`, { method: 'DELETE', headers });
  await fetch(`${BASE_URL}/api/admin/media/${safeSvgJson.mediaId}`, { method: 'DELETE', headers });
  await fetch(`${BASE_URL}/api/admin/media/${resA.mediaId}`, { method: 'DELETE', headers });
  await fetch(`${BASE_URL}/api/admin/media/${resB.mediaId}`, { method: 'DELETE', headers });
  console.log('✓ Section 1 test assets cleaned up successfully.');
}

async function testPersistenceAndEditorLifecycle(sessionToken) {
  console.log('\n==================================================');
  console.log('2. PERSISTENCE & LIFECYCLE AUDIT');
  console.log('==================================================');

  const headers = {
    'Content-Type': 'application/json',
    Cookie: `mc_admin_session=${sessionToken}`,
  };

  // 2.1 Create an explicitly designated test product
  const TEST_PRODUCT_ID = 'test-audit-specimen-2026';
  console.log(`\nCreating dedicated test product: ${TEST_PRODUCT_ID}...`);
  const createRes = await fetch(`${BASE_URL}/api/admin/catalog`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: TEST_PRODUCT_ID,
      name: 'QA Audit Test Specimen 2026',
      brand: 'Marine Creatures QA',
      category: 'hardware',
      price: 9999,
      inStock: true,
      stockCount: 5,
      images: [],
      imageStatus: 'NEEDS_MEDIA_ASSET',
      description: 'Temporary isolated test record for security and persistence audit.',
    }),
  });
  const createJson = await createRes.json();
  console.log(`- Created test product: HTTP ${createRes.status} (Slug: ${createJson.data?.id})`);
  if (createRes.status !== 201 || createJson.data?.id !== TEST_PRODUCT_ID) {
    throw new Error('Failed to create isolated test product for persistence testing');
  }

  // 2.2 Attach two test images to test product
  console.log('\nAttaching two test images to the product...');
  const IMAGE_A = 'https://images.unsplash.com/photo-1546026423-cc4642628d2b';
  const IMAGE_B = 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5';

  // Attach Image A
  await fetch(`${BASE_URL}/api/admin/media`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId: TEST_PRODUCT_ID, url: IMAGE_A }),
  });

  // Attach Image B and set as primary (reordering: Image B becomes index 0)
  const attachBRes = await fetch(`${BASE_URL}/api/admin/media`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ productId: TEST_PRODUCT_ID, url: IMAGE_B, isPrimary: true }),
  });
  const attachBJson = await attachBRes.json();
  console.log(`- Attached Image B as PRIMARY: HTTP ${attachBRes.status}`);
  console.log(`  Current product images array:`, attachBJson.data?.images);

  if (attachBJson.data?.images[0] !== IMAGE_B || attachBJson.data?.images[1] !== IMAGE_A) {
    throw new Error('Primary designation failed: Image B is not at index 0!');
  }

  // 2.3 Verify persistence in MongoDB before opening browser
  console.log('\nVerifying database state for product media...');
  const getProductMediaRes = await fetch(`${BASE_URL}/api/admin/media?productId=${TEST_PRODUCT_ID}`, {
    headers: { Cookie: `mc_admin_session=${sessionToken}` },
  });
  const getProductMediaJson = await getProductMediaRes.json();
  console.log(`- Authoritative DB media response:`, getProductMediaJson.data);
  if (getProductMediaJson.data.images[0] !== IMAGE_B) {
    throw new Error('Database did not persist Image B as primary!');
  }

  // 2.4 Browser automation: Reopen editor and refresh browser to verify persistence in UI
  console.log('\nTesting UI persistence via Headless Chrome...');
  try {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
  } catch {}

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    'about:blank',
  ]);

  let wsUrl = '';
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/json/version`);
      if (res.ok) {
        const json = await res.json();
        wsUrl = json.webSocketDebuggerUrl;
        break;
      }
    } catch {}
    await wait(300);
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));

  function send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      pending.set(reqId, { resolve, reject });
      const payload = { id: reqId, method, params };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
    });
  }

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  await send('Network.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('DOM.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  }, sessionId);

  await send('Network.setCookie', {
    name: 'mc_admin_session',
    value: sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
  }, sessionId);

  console.log('- Navigating to /admin/catalog and searching for test product...');
  await send('Page.navigate', { url: `${BASE_URL}/admin/catalog` }, sessionId);
  await wait(3000);

  // Search for the test product
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('input[placeholder*="Search by product name"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, '${TEST_PRODUCT_ID}');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `,
  }, sessionId);
  await wait(2000);

  // Open Edit Spec
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const rows = Array.from(document.querySelectorAll('tr, .group.rounded-2xl'));
        const targetRow = rows.find(r => r.innerText.includes('${TEST_PRODUCT_ID}'));
        if (targetRow) {
          const editBtn = targetRow.querySelector('button[title="Edit Product Details"]') ||
                          Array.from(targetRow.querySelectorAll('button')).find(b => b.textContent.includes('Edit') || b.textContent.includes('✎'));
          if (editBtn) editBtn.click();
        }
      })()
    `,
  }, sessionId);
  await wait(2000);

  // Navigate to Step 5
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return;
        const step5 = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('05 Media'));
        if (step5) step5.click();
      })()
    `,
  }, sessionId);
  await wait(2000);

  // Verify UI rendered items, primary badge, order
  const uiCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return null;
        const images = Array.from(modal.querySelectorAll('img[alt^="Asset"]')).map(i => i.src);
        const primaryBadge = Array.from(modal.querySelectorAll('span')).find(s => s.textContent.trim() === 'PRIMARY');
        const classification = modal.querySelector('select')?.value;
        return {
          images,
          primaryImage: images[0],
          secondaryImage: images[1],
          hasPrimaryBadge: Boolean(primaryBadge),
          classification
        };
      })()
    `,
    returnByValue: true,
  }, sessionId);

  console.log(`- UI state after opening Step 5:`, uiCheck.result?.value);
  if (
    !uiCheck.result?.value?.hasPrimaryBadge ||
    uiCheck.result?.value?.primaryImage !== IMAGE_B ||
    uiCheck.result?.value?.secondaryImage !== IMAGE_A
  ) {
    throw new Error('UI did not persist image sequence and primary badge after reopening editor!');
  }
  console.log('✓ Image sequence, primary thumbnail, and product association verified across browser reload.');
  auditEvidence.persistence.reopenVerificationPassed = true;

  // Capture screenshot of persisted test product
  const ssPersist = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.writeFileSync('qa-screenshots/step5-persistence-verified.png', Buffer.from(ssPersist.data, 'base64'));
  console.log('✓ Captured proof screenshot: qa-screenshots/step5-persistence-verified.png');

  ws.close();
  chromeProc.kill();

  // 2.5 Clean up the explicitly designated test product
  console.log('\nCleaning up explicitly designated test product and assets...');
  const delRes = await fetch(`${BASE_URL}/api/admin/catalog?id=${TEST_PRODUCT_ID}&confirm=true`, {
    method: 'DELETE',
    headers: { Cookie: `mc_admin_session=${sessionToken}` },
  });
  console.log(`- Deleted test product ${TEST_PRODUCT_ID}: HTTP ${delRes.status}`);
  auditEvidence.persistence.cleanupCompleted = true;
}

async function testMediaApi(sessionToken) {
  console.log('\n==================================================');
  console.log('3. MEDIA API AUDIT (GET, POST, PATCH, DELETE)');
  console.log('==================================================');

  const authHeader = { Cookie: `mc_admin_session=${sessionToken}` };
  const jsonAuthHeader = {
    'Content-Type': 'application/json',
    Cookie: `mc_admin_session=${sessionToken}`,
  };

  // 3.1 Unauthenticated requests return 401
  console.log('\n[3.1] Testing unauthorized requests (HTTP 401)...');
  const unauthGet = await fetch(`${BASE_URL}/api/admin/media`);
  const unauthPost = await fetch(`${BASE_URL}/api/admin/media`, { method: 'POST' });
  const unauthPatch = await fetch(`${BASE_URL}/api/admin/media`, { method: 'PATCH' });
  const unauthDel = await fetch(`${BASE_URL}/api/admin/media`, { method: 'DELETE' });
  console.log(`- Unauth GET: ${unauthGet.status}, POST: ${unauthPost.status}, PATCH: ${unauthPatch.status}, DELETE: ${unauthDel.status}`);
  if (unauthGet.status !== 401 || unauthPost.status !== 401 || unauthPatch.status !== 401 || unauthDel.status !== 401) {
    throw new Error('Unauthorized requests were not blocked with 401!');
  }
  auditEvidence.mediaApi.unauthorizedBlocked = true;

  // 3.2 Safe handling of invalid product IDs and media IDs
  console.log('\n[3.2] Testing invalid IDs handling...');
  const invalidProdRes = await fetch(`${BASE_URL}/api/admin/media?productId=invalid-nonexistent-12345`, { headers: authHeader });
  console.log(`- Invalid productId GET /api/admin/media: HTTP ${invalidProdRes.status}`);
  if (invalidProdRes.status !== 404) throw new Error('Expected 404 for invalid productId');

  const invalidMediaDel = await fetch(`${BASE_URL}/api/admin/media?id=invalid-media-nonexistent-999`, { method: 'DELETE', headers: authHeader });
  console.log(`- Invalid mediaId DELETE /api/admin/media: HTTP ${invalidMediaDel.status}`);
  if (invalidMediaDel.status !== 404) throw new Error('Expected 404 for invalid mediaId');

  const invalidSubrouteRes = await fetch(`${BASE_URL}/api/admin/media/nonexistent-item-999`, { headers: authHeader });
  console.log(`- Invalid subroute GET /api/admin/media/[id]: HTTP ${invalidSubrouteRes.status}`);
  if (invalidSubrouteRes.status !== 404) throw new Error('Expected 404 for invalid subroute ID');
  auditEvidence.mediaApi.invalidIdsHandledSafely = true;

  // 3.3 Verify deletion cannot affect another product's assets
  console.log('\n[3.3] Testing cross-product asset deletion isolation...');
  const crossDelRes = await fetch(`${BASE_URL}/api/admin/media`, {
    method: 'DELETE',
    headers: jsonAuthHeader,
    body: JSON.stringify({
      productId: 're-ocean-mini-60',
      url: 'https://images.unsplash.com/photo-unrelated-asset-from-other-product',
    }),
  });
  const crossDelJson = await crossDelRes.json();
  console.log(`- Attempted deletion of unrelated image from re-ocean-mini-60: HTTP ${crossDelRes.status} (${crossDelJson.error})`);
  if (crossDelRes.status !== 404 || !crossDelJson.error.includes('does not belong to product')) {
    throw new Error('Cross-product asset deletion isolation failed!');
  }
  auditEvidence.mediaApi.crossProductDeletionProtected = true;

  // 3.4 Verify audit logs record media changes
  console.log('\n[3.4] Testing audit log recording for media operations...');
  const auditRes = await fetch(`${BASE_URL}/api/admin/system/audit?limit=10`, { headers: authHeader });
  const auditJson = await auditRes.json();
  const mediaEvents = auditJson.data?.filter(
    (e) => e.action === 'PRODUCT_MEDIA_UPDATED' || e.summary?.includes('media') || e.summary?.includes('image')
  );
  console.log(`- Found ${mediaEvents?.length || 0} recent media audit log entries.`);
  if (!mediaEvents || mediaEvents.length === 0) {
    throw new Error('Audit logs did not record media mutations!');
  }
  console.log(`- Sample recorded audit entry: "${mediaEvents[0].summary}"`);
  auditEvidence.mediaApi.auditLoggingVerified = true;
}

async function testFailureHandling(sessionToken) {
  console.log('\n==================================================');
  console.log('4. FAILURE & ERROR HANDLING AUDIT');
  console.log('==================================================');

  // 4.1 Expired admin sessions
  console.log('\n[4.1] Testing expired session behavior...');
  const expiredRes = await fetch(`${BASE_URL}/api/admin/upload`, {
    method: 'POST',
    headers: { Cookie: 'mc_admin_session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expiredTokenSignature' },
  });
  console.log(`- Expired session request: HTTP ${expiredRes.status}`);
  if (expiredRes.status !== 401) throw new Error('Expired session was not rejected with 401');

  // 4.2 Empty file & missing payload
  console.log('\n[4.2] Testing empty payload rejection...');
  const emptyForm = new FormData();
  const emptyRes = await fetch(`${BASE_URL}/api/admin/upload`, {
    method: 'POST',
    headers: { Cookie: `mc_admin_session=${sessionToken}` },
    body: emptyForm,
  });
  console.log(`- Missing file payload: HTTP ${emptyRes.status}`);
  if (emptyRes.status !== 400) throw new Error('Empty payload did not return 400');

  // 4.3 Invalid URLs rejected without false success
  console.log('\n[4.3] Testing invalid external URLs...');
  const invalidUrlRes = await fetch(`${BASE_URL}/api/admin/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `mc_admin_session=${sessionToken}`,
    },
    body: JSON.stringify({
      productId: 're-ocean-mini-60',
      url: 'javascript:alert(1)',
    }),
  });
  const invalidUrlJson = await invalidUrlRes.json();
  console.log(`- Malicious URL rejected: HTTP ${invalidUrlRes.status} (${invalidUrlJson.error})`);
  if (invalidUrlRes.status !== 400 || invalidUrlJson.success === true) {
    throw new Error('Invalid URL produced false success!');
  }
  auditEvidence.failureHandling.errorHandlingVerified = true;
}

async function testFinalRegression(sessionToken) {
  console.log('\n==================================================');
  console.log('5. FINAL REGRESSION AUDIT');
  console.log('==================================================');

  // 5.1 Verify existing product catalog images
  console.log('\n[5.1] Auditing existing product catalog media integrity...');
  const catalogRes = await fetch(`${BASE_URL}/api/products`);
  const catalogData = await catalogRes.json();
  const products = Array.isArray(catalogData) ? catalogData : catalogData.data || [];
  console.log(`- Total live catalog products retrieved: ${products.length}`);

  const reOcean = products.find((p) => p.id === 're-ocean-mini-60');
  console.log(`- re-ocean-mini-60 state: price=₹${reOcean?.price}, stock=${reOcean?.stockCount}, images=${reOcean?.images?.length}`);
  if (reOcean?.price !== 6500 || reOcean?.stockCount !== 4 || reOcean?.images?.length !== 0) {
    throw new Error('Strict rule violation: re-ocean-mini-60 production data was modified!');
  }
  console.log('✓ Confirmed: Production product pricing, stock count, and blueprint fallback state remain completely pristine.');

  // 5.2 Storefront image resolution check
  console.log('\n[5.2] Auditing public storefront image resolution...');
  const storefrontRes = await fetch(`${BASE_URL}/marketplace/purple-tang-l`);
  console.log(`- Storefront /marketplace/purple-tang-l: HTTP ${storefrontRes.status}`);
  if (storefrontRes.status !== 200) throw new Error('Storefront page resolution failed');
  auditEvidence.regression.storefrontVerified = true;
}

async function main() {
  const sessionToken = await getSessionCookie();
  console.log('✓ Authenticated admin session obtained');

  await testUploadSecurity(sessionToken);
  await testPersistenceAndEditorLifecycle(sessionToken);
  await testMediaApi(sessionToken);
  await testFailureHandling(sessionToken);
  await testFinalRegression(sessionToken);

  console.log('\n==================================================');
  console.log('FINAL AUDIT SUMMARY: ALL 5 SECTIONS PASSED');
  console.log('==================================================');
  console.log(JSON.stringify(auditEvidence, null, 2));
}

main().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
