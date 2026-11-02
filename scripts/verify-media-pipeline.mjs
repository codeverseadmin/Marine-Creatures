import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\tmp\\chrome-media-verify';
const PORT = 9225;
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
  if (!cookieHeader) throw new Error('No cookie header in login response');
  const match = cookieHeader.match(/mc_admin_session=([^;]+)/);
  return match[1];
}

async function runApiTests(sessionToken) {
  console.log('\n========================================');
  console.log('1. RUNNING API SECURITY & MEDIA TESTS');
  console.log('========================================');

  // Test 1: Unauthenticated request to /api/admin/media
  const unauthRes = await fetch(`${BASE_URL}/api/admin/media?productId=re-ocean-mini-60`);
  console.log(`[Test 1] Unauthenticated GET /api/admin/media: HTTP ${unauthRes.status}`);
  if (unauthRes.status !== 401) throw new Error(`Expected 401, got ${unauthRes.status}`);

  // Test 2: Authenticated request for re-ocean-mini-60
  const authRes = await fetch(`${BASE_URL}/api/admin/media?productId=re-ocean-mini-60`, {
    headers: { Cookie: `mc_admin_session=${sessionToken}` },
  });
  console.log(`[Test 2] Authenticated GET /api/admin/media?productId=re-ocean-mini-60: HTTP ${authRes.status}`);
  const authData = await authRes.json();
  console.log('         Payload:', JSON.stringify(authData, null, 2));
  if (!authData.success || authData.data.productId !== 're-ocean-mini-60') {
    throw new Error('Failed to retrieve product media for re-ocean-mini-60');
  }

  // Test 3: Authenticated request to /api/admin/media/[id]
  const idRouteRes = await fetch(`${BASE_URL}/api/admin/media/re-ocean-mini-60`, {
    headers: { Cookie: `mc_admin_session=${sessionToken}` },
  });
  console.log(`[Test 3] Authenticated GET /api/admin/media/re-ocean-mini-60: HTTP ${idRouteRes.status}`);
  const idRouteData = await idRouteRes.json();
  if (!idRouteData.success || idRouteData.type !== 'product') {
    throw new Error('Failed to retrieve product media via subroute');
  }

  // Test 4: Global media query
  const globalMediaRes = await fetch(`${BASE_URL}/api/admin/media`, {
    headers: { Cookie: `mc_admin_session=${sessionToken}` },
  });
  console.log(`[Test 4] Authenticated GET /api/admin/media (all): HTTP ${globalMediaRes.status}`);
  const globalData = await globalMediaRes.json();
  console.log('         Global counts:', globalData.counts);
  if (!globalData.success || typeof globalData.counts.total !== 'number') {
    throw new Error('Global media query failed');
  }

  // Test 5: File upload validation - Reject invalid format (.txt / octet-stream)
  const badFormData = new FormData();
  badFormData.append('file', new Blob(['fake-binary'], { type: 'application/octet-stream' }), 'test.bin');
  badFormData.append('type', 'image');
  const badUploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
    method: 'POST',
    headers: { Cookie: `mc_admin_session=${sessionToken}` },
    body: badFormData,
  });
  console.log(`[Test 5] Reject invalid MIME format: HTTP ${badUploadRes.status}`);
  const badUploadJson = await badUploadRes.json();
  console.log('         Error message:', badUploadJson.error);
  if (badUploadRes.status !== 400 || !badUploadJson.error.includes('Unsupported image format')) {
    throw new Error('Upload validation did not reject invalid format');
  }

  // Test 6: File upload - Valid PNG image upload with productId association
  // Minimal valid 1x1 PNG
  const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(validPngBase64, 'base64');
  const validFormData = new FormData();
  validFormData.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'test-specimen.png');
  validFormData.append('type', 'image');
  validFormData.append('productId', 're-ocean-mini-60');

  const validUploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
    method: 'POST',
    headers: { Cookie: `mc_admin_session=${sessionToken}` },
    body: validFormData,
  });
  console.log(`[Test 6] Upload valid PNG with productId: HTTP ${validUploadRes.status}`);
  const validUploadJson = await validUploadRes.json();
  console.log('         Upload result:', validUploadJson);
  if (validUploadRes.status !== 201 || !validUploadJson.url || validUploadJson.productId !== 're-ocean-mini-60') {
    throw new Error('Valid upload failed or lacked productId');
  }

  // Test 7: Verify media streaming endpoint /api/media/[id]
  const mediaStreamRes = await fetch(`${BASE_URL}${validUploadJson.url}`);
  console.log(`[Test 7] Stream uploaded binary ${validUploadJson.url}: HTTP ${mediaStreamRes.status}`);
  if (mediaStreamRes.status !== 200 || mediaStreamRes.headers.get('content-type') !== 'image/png') {
    throw new Error('Binary media stream failed');
  }

  // Test 8: Clean up the test uploaded media record
  const cleanupRes = await fetch(`${BASE_URL}/api/admin/media/${validUploadJson.mediaId}`, {
    method: 'DELETE',
    headers: { Cookie: `mc_admin_session=${sessionToken}` },
  });
  console.log(`[Test 8] Clean up test media ${validUploadJson.mediaId}: HTTP ${cleanupRes.status}`);
  const cleanupJson = await cleanupRes.json();
  if (!cleanupJson.success) {
    throw new Error('Media cleanup failed');
  }

  console.log('✓ All API Security & Pipeline tests passed successfully!\n');
}

async function runBrowserTests(sessionToken) {
  console.log('========================================');
  console.log('2. RUNNING CDP BROWSER TESTS FOR STEP 5');
  console.log('========================================');

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

  if (!wsUrl) throw new Error('Could not connect to Chrome debugging port');

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();

  const networkRequests = [];
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Network.requestWillBeSent') {
      networkRequests.push({ url: msg.params.request.url, method: msg.params.request.method });
    } else if (msg.method === 'Network.responseReceived') {
      const existing = networkRequests.find((r) => r.url === msg.params.response.url);
      if (existing) {
        existing.status = msg.params.response.status;
      }
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push({ type: msg.params.type, text: msg.params.args?.map((a) => a.value).join(' ') });
    }

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

  // Set desktop viewport
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

  console.log('Navigating to /admin/catalog...');
  await send('Page.navigate', { url: `${BASE_URL}/admin/catalog` }, sessionId);
  await wait(3000);

  // Search specifically for re-ocean-mini-60 using React value setter
  console.log('Searching for "re-ocean-mini-60"...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('input[placeholder*="Search by product name"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 're-ocean-mini-60');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `,
  }, sessionId);
  await wait(2000);

  // Click Edit button on the matching product record (table row or card)
  console.log('Opening editor for re-ocean-mini-60...');
  const openResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        // Find row or card containing re-ocean-mini-60
        const rows = Array.from(document.querySelectorAll('tr, .group.rounded-2xl'));
        const targetRow = rows.find(r => r.innerText.includes('re-ocean-mini-60') || r.innerText.includes('RE Ocean Mini 60'));
        if (targetRow) {
          const editBtn = targetRow.querySelector('button[title="Edit Product Details"]') ||
                          Array.from(targetRow.querySelectorAll('button')).find(b => b.textContent.includes('Edit') || b.textContent.includes('✎'));
          if (editBtn) {
            editBtn.click();
            return { success: true, target: 'found_in_row' };
          }
        }
        // Fallback: search all buttons on page
        const allButtons = Array.from(document.querySelectorAll('button'));
        const fallbackBtn = allButtons.find(b => b.title === 'Edit Product Details' || b.textContent.includes('Edit Spec'));
        if (fallbackBtn) {
          fallbackBtn.click();
          return { success: true, target: 'fallback_button' };
        }
        return { success: false };
      })()
    `,
    returnByValue: true,
  }, sessionId);
  console.log('Editor opened:', openResult.result?.value);
  await wait(2000);

  // Click Step 5: 05 Media strictly inside the modal
  console.log('Navigating to Step 5 (05 Media)...');
  const step5ClickResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return { success: false, reason: 'no_modal' };
        const buttons = Array.from(modal.querySelectorAll('button'));
        const step5 = buttons.find(b => b.textContent.includes('05 Media'));
        if (step5) {
          step5.click();
          return { success: true };
        }
        return { success: false, reason: 'step_5_button_not_found', availableButtons: buttons.map(b => b.textContent.trim()) };
      })()
    `,
    returnByValue: true,
  }, sessionId);
  console.log('Step 5 clicked:', step5ClickResult.result?.value);
  await wait(2000);

  // Inspect the Step 5 DOM inside the modal
  const step5State = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        const text = modal ? modal.innerText : 'NO_MODAL';
        const hasFailedToFetch = text.includes('Failed to fetch');
        const hasNoVerifiedPhoto = text.includes('No verified photograph available');
        const hasConfirmedEmptyState = text.includes('No media assets currently attached');
        const hasZeroMedia = text.includes('Zero media assets attached');
        const activeMediaError = modal ? modal.querySelector('.bg-red-500\\\\/10') : null;
        return {
          textSnippet: text.slice(0, 800),
          hasFailedToFetch,
          hasNoVerifiedPhoto,
          hasConfirmedEmptyState,
          hasZeroMedia,
          activeMediaError: activeMediaError ? activeMediaError.innerText : null
        };
      })()
    `,
    returnByValue: true,
  }, sessionId);

  console.log('\n=== STEP 5 DOM EVALUATION ===');
  console.log('hasFailedToFetch (MUST BE FALSE):', step5State.result?.value?.hasFailedToFetch);
  console.log('hasNoVerifiedPhoto (TRUE for needs asset):', step5State.result?.value?.hasNoVerifiedPhoto);
  console.log('hasConfirmedEmptyState (TRUE):', step5State.result?.value?.hasConfirmedEmptyState);
  console.log('hasZeroMedia (FALSE - replaced with confirmed state):', step5State.result?.value?.hasZeroMedia);
  console.log('textSnippet:\n', step5State.result?.value?.textSnippet);

  if (step5State.result?.value?.hasFailedToFetch) {
    throw new Error('FAILURE: Step 5 still displays "Failed to fetch"!');
  }
  if (!step5State.result?.value?.hasConfirmedEmptyState) {
    throw new Error('FAILURE: Confirmed empty state was not displayed!');
  }

  // Save desktop screenshot
  const ss1 = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.writeFileSync('qa-screenshots/step5-desktop-re-ocean-mini-60.png', Buffer.from(ss1.data, 'base64'));
  console.log('✓ Captured desktop screenshot: qa-screenshots/step5-desktop-re-ocean-mini-60.png');

  // Test Invalid External URL validation
  console.log('\nTesting invalid URL validation...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return;
        const input = modal.querySelector('input[placeholder*="paste external asset URL"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'not-a-valid-url');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const buttons = Array.from(modal.querySelectorAll('button'));
        const addBtn = buttons.find(b => b.textContent.includes('Add URL'));
        if (addBtn) addBtn.click();
      })()
    `,
  }, sessionId);
  await wait(1000);

  const invalidUrlCheck = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        const errorEl = modal ? modal.querySelector('.bg-red-500\\\\/10') : null;
        return errorEl ? errorEl.innerText : null;
      })()
    `,
    returnByValue: true,
  }, sessionId);
  console.log('Invalid URL error displayed:', invalidUrlCheck.result?.value);
  if (!invalidUrlCheck.result?.value?.includes('Invalid URL format')) {
    throw new Error('Actionable error was not displayed for invalid URL');
  }

  // Test Valid External URL addition
  console.log('\nTesting valid external URL attachment...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return;
        const input = modal.querySelector('input[placeholder*="paste external asset URL"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'https://images.unsplash.com/photo-1546026423-cc4642628d2b');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const buttons = Array.from(modal.querySelectorAll('button'));
        const addBtn = buttons.find(b => b.textContent.includes('Add URL'));
        if (addBtn) addBtn.click();
      })()
    `,
  }, sessionId);
  await wait(1500);

  // Verify that the image card and PRIMARY badge appear
  const galleryState = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return null;
        const primaryBadge = Array.from(modal.querySelectorAll('span')).find(s => s.textContent.trim() === 'PRIMARY');
        const images = Array.from(modal.querySelectorAll('img[alt^="Asset"]')).map(img => img.src);
        return { hasPrimary: Boolean(primaryBadge), imageCount: images.length, images };
      })()
    `,
    returnByValue: true,
  }, sessionId);
  console.log('Gallery state after adding asset 1:', galleryState.result?.value);
  if (!galleryState.result?.value?.hasPrimary || galleryState.result?.value?.imageCount !== 1) {
    throw new Error('Gallery did not render primary image asset correctly');
  }

  // Attach second image
  console.log('Attaching secondary image...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return;
        const input = modal.querySelector('input[placeholder*="paste external asset URL"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const buttons = Array.from(modal.querySelectorAll('button'));
        const addBtn = buttons.find(b => b.textContent.includes('Add URL'));
        if (addBtn) addBtn.click();
      })()
    `,
  }, sessionId);
  await wait(1500);

  // Test "Set Main" (reorder primary image)
  console.log('Testing "Set Main" reordering...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return;
        const mainBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.trim() === 'Main');
        if (mainBtn) mainBtn.click();
      })()
    `,
  }, sessionId);
  await wait(1500);

  // Capture desktop screenshot with multi-image gallery
  const ssGallery = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.writeFileSync('qa-screenshots/step5-desktop-multi-image.png', Buffer.from(ssGallery.data, 'base64'));
  console.log('✓ Captured multi-image desktop screenshot: qa-screenshots/step5-desktop-multi-image.png');

  // Test Image Removal
  console.log('Testing image removal...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return;
        const removeButtons = Array.from(modal.querySelectorAll('button')).filter(b => b.textContent.trim() === '✕');
        // Click first remove button
        if (removeButtons.length > 0) removeButtons[0].click();
      })()
    `,
  }, sessionId);
  await wait(1000);

  // Mobile viewport test (375x812)
  console.log('\nSwitching to mobile viewport (375x812)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true,
  }, sessionId);
  await wait(1500);

  const ssMobile = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
  fs.writeFileSync('qa-screenshots/step5-mobile-re-ocean-mini-60.png', Buffer.from(ssMobile.data, 'base64'));
  console.log('✓ Captured mobile screenshot: qa-screenshots/step5-mobile-re-ocean-mini-60.png');

  // Close editor without saving so database record stays unchanged
  console.log('Closing editor modal cleanly without altering database...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return;
        const closeBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.trim() === '✕' && b.className.includes('min-w-[44px]'));
        if (closeBtn) closeBtn.click();
      })()
    `,
  }, sessionId);
  await wait(1000);

  ws.close();
  chromeProc.kill();
  console.log('\n✓ All browser tests completed successfully!');
}

async function main() {
  const sessionToken = await getSessionCookie();
  console.log('✓ Authenticated admin session obtained');
  await runApiTests(sessionToken);
  await runBrowserTests(sessionToken);
}

main().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
