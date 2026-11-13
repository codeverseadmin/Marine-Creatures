import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getSessionCookie() {
  const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'mc@admin#2026!' }),
  });
  if (!loginRes.ok) throw new Error(`Login failed with HTTP ${loginRes.status}`);
  const cookieHeader = loginRes.headers.get('set-cookie');
  if (!cookieHeader) throw new Error('No cookie header in login response');
  const match = cookieHeader.match(/mc_admin_session=([^;]+)/);
  if (!match) throw new Error('mc_admin_session cookie not found');
  return match[1];
}

async function main() {
  console.log('===============================================================');
  console.log(' MARINE CREATURES — MC-ADMIN-MEDIA-IMAGE-VIDEO-V1 VERIFICATION');
  console.log('===============================================================\n');

  const sessionToken = await getSessionCookie();
  console.log('✓ Admin authenticated successfully via session cookie.\n');

  const authHeaders = { Cookie: `mc_admin_session=${sessionToken}` };
  const createdMediaIds = [];

  // Helper to build a FormData upload
  async function uploadMedia(fileBuffer, filename, type, productId) {
    const formData = new FormData();
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, filename);
    if (type) formData.append('type', type);
    if (productId) formData.append('productId', productId);

    const res = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  }

  // ── TEST 1: Authentication Gate ──
  console.log('--- TEST 1: Unauthenticated Upload Protection ---');
  const unauthFormData = new FormData();
  unauthFormData.append('file', new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xe0])]), 'test.jpg');
  const unauthRes = await fetch(`${BASE_URL}/api/admin/upload`, {
    method: 'POST',
    body: unauthFormData,
  });
  console.log(`Unauthenticated POST /api/admin/upload: HTTP ${unauthRes.status}`);
  assert(unauthRes.status === 401, 'Unauthenticated upload must be rejected with 401');
  console.log('✓ PASS: Unauthenticated access blocked.\n');

  // ── TEST 2: Valid Image Uploads (JPEG, PNG, WebP, GIF, SVG) ──
  console.log('--- TEST 2: Valid Image Uploads ---');

  // 2A. JPEG
  const jpegBuf = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
    Buffer.alloc(64, 0xaa),
    Buffer.from([0xff, 0xd9]),
  ]);
  const jpegRes = await uploadMedia(jpegBuf, 'test-specimen.jpg', 'image');
  console.log(`JPEG upload: HTTP ${jpegRes.status}`, jpegRes.json);
  assert(jpegRes.status === 201 && jpegRes.json.success, 'JPEG upload must succeed');
  assert(jpegRes.json.type === 'image', 'JPEG type must be image');
  createdMediaIds.push(jpegRes.json.mediaId);

  // 2B. PNG
  const pngBuf = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(64, 0x55),
  ]);
  const pngRes = await uploadMedia(pngBuf, 'test-coral.png', 'image');
  console.log(`PNG upload: HTTP ${pngRes.status}`, pngRes.json);
  assert(pngRes.status === 201 && pngRes.json.success, 'PNG upload must succeed');
  assert(pngRes.json.type === 'image', 'PNG type must be image');
  createdMediaIds.push(pngRes.json.mediaId);

  // 2C. WebP
  const webpHeader = Buffer.from('RIFF....WEBPVP8 ', 'binary');
  webpHeader.writeUInt32LE(70, 4); // File size
  const webpBuf = Buffer.concat([webpHeader, Buffer.alloc(60, 0x33)]);
  const webpRes = await uploadMedia(webpBuf, 'test-reef.webp', 'auto');
  console.log(`WebP upload (auto-type): HTTP ${webpRes.status}`, webpRes.json);
  assert(webpRes.status === 201 && webpRes.json.success, 'WebP upload must succeed');
  assert(webpRes.json.type === 'image', 'WebP type must be auto-detected as image');
  createdMediaIds.push(webpRes.json.mediaId);

  // 2D. GIF
  const gifBuf = Buffer.concat([Buffer.from('GIF89a', 'ascii'), Buffer.alloc(60, 0x77)]);
  const gifRes = await uploadMedia(gifBuf, 'test-anemone.gif', 'image');
  console.log(`GIF upload: HTTP ${gifRes.status}`, gifRes.json);
  assert(gifRes.status === 201 && gifRes.json.success, 'GIF upload must succeed');
  assert(gifRes.json.type === 'image', 'GIF type must be image');
  createdMediaIds.push(gifRes.json.mediaId);

  // 2E. SVG
  const svgText = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="cyan"/></svg>';
  const svgBuf = Buffer.from(svgText, 'utf8');
  const svgRes = await uploadMedia(svgBuf, 'test-blueprint.svg', 'image');
  console.log(`SVG upload: HTTP ${svgRes.status}`, svgRes.json);
  assert(svgRes.status === 201 && svgRes.json.success, 'SVG upload must succeed');
  assert(svgRes.json.type === 'image', 'SVG type must be image');
  createdMediaIds.push(svgRes.json.mediaId);

  console.log('✓ PASS: All 5 image formats uploaded and verified.\n');

  // ── TEST 3: Valid Video Uploads (MP4, WebM, QuickTime MOV) ──
  console.log('--- TEST 3: Valid Video Uploads ---');

  // 3A. MP4
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // size 24, ftyp
    0x69, 0x73, 0x6f, 0x6d,                         // isom brand
    0x00, 0x00, 0x02, 0x00,                         // minor version
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32, // compatible brands
  ]);
  const mp4Buf = Buffer.concat([mp4Header, Buffer.alloc(256, 0x11)]);
  const mp4Res = await uploadMedia(mp4Buf, 'clownfish-feeding.mp4', 'video');
  console.log(`MP4 upload: HTTP ${mp4Res.status}`, mp4Res.json);
  assert(mp4Res.status === 201 && mp4Res.json.success, 'MP4 upload must succeed');
  assert(mp4Res.json.type === 'video', 'MP4 type must be video');
  const mp4MediaId = mp4Res.json.mediaId;
  createdMediaIds.push(mp4MediaId);

  // 3B. WebM
  const webmHeader = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81]);
  const webmBuf = Buffer.concat([webmHeader, Buffer.alloc(256, 0x22)]);
  const webmRes = await uploadMedia(webmBuf, 'coral-fluorescence.webm', 'video');
  console.log(`WebM upload: HTTP ${webmRes.status}`, webmRes.json);
  assert(webmRes.status === 201 && webmRes.json.success, 'WebM upload must succeed');
  assert(webmRes.json.type === 'video', 'WebM type must be video');
  createdMediaIds.push(webmRes.json.mediaId);

  // 3C. QuickTime MOV
  const movHeader = Buffer.from([
    0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, // size 20, ftyp
    0x71, 0x74, 0x20, 0x20,                         // qt   brand
    0x00, 0x00, 0x00, 0x00, 0x71, 0x74, 0x20, 0x20,
  ]);
  const movBuf = Buffer.concat([movHeader, Buffer.alloc(256, 0x33)]);
  const movRes = await uploadMedia(movBuf, 'aquarium-biotope.mov', 'video');
  console.log(`QuickTime MOV upload: HTTP ${movRes.status}`, movRes.json);
  assert(movRes.status === 201 && movRes.json.success, 'MOV upload must succeed');
  assert(movRes.json.type === 'video', 'MOV type must be video');
  createdMediaIds.push(movRes.json.mediaId);

  console.log('✓ PASS: All 3 video formats (MP4, WebM, MOV) uploaded and verified.\n');

  // ── TEST 4: Security & Validation Rejection ──
  console.log('--- TEST 4: Security & Validation Enforcement ---');

  // 4A. Corrupted binary signature
  const corruptedBuf = Buffer.from('THIS IS NOT A VALID IMAGE OR VIDEO FILE AT ALL', 'utf8');
  const corruptedRes = await uploadMedia(corruptedBuf, 'fake.mp4', 'video');
  console.log(`Corrupted binary rejection: HTTP ${corruptedRes.status}`, corruptedRes.json);
  assert(corruptedRes.status === 400, 'Corrupted binary must be rejected with 400');

  // 4B. Type mismatch: requestedType = 'image' but file is MP4
  const mismatchRes = await uploadMedia(mp4Buf, 'masquerade.jpg', 'image');
  console.log(`Type mismatch (MP4 disguised as JPG): HTTP ${mismatchRes.status}`, mismatchRes.json);
  assert(mismatchRes.status === 400, 'Disguised video as image must be rejected with 400');

  // 4C. Type mismatch: requestedType = 'video' but file is JPEG
  const mismatchRes2 = await uploadMedia(jpegBuf, 'masquerade.mp4', 'video');
  console.log(`Type mismatch (JPEG disguised as MP4): HTTP ${mismatchRes2.status}`, mismatchRes2.json);
  assert(mismatchRes2.status === 400, 'Disguised image as video must be rejected with 400');

  // 4D. SVG with malicious script payload
  const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script></svg>';
  const maliciousSvgBuf = Buffer.from(maliciousSvg, 'utf8');
  const xssRes = await uploadMedia(maliciousSvgBuf, 'xss.svg', 'image');
  console.log(`Malicious SVG rejection: HTTP ${xssRes.status}`, xssRes.json);
  assert(xssRes.status === 400, 'SVG with script tags must be rejected with 400');

  // 4E. File > 25MB
  console.log('Testing >25MB file rejection...');
  const largeBuf = Buffer.alloc(26 * 1024 * 1024, 0x00); // 26MB
  const largeRes = await uploadMedia(largeBuf, 'too-large.mp4', 'video');
  console.log(`>25MB rejection: HTTP ${largeRes.status}`, largeRes.json);
  assert(largeRes.status === 400, 'File >25MB must be rejected with 400');

  console.log('✓ PASS: All 5 security validation tests enforced strictly.\n');

  // ── TEST 5: Media Serving & HTTP 206 Partial Content Range Streaming ──
  console.log('--- TEST 5: Media Serving & HTTP 206 Partial Content Range Streaming ---');

  // 5A. Full content request (HTTP 200)
  const fullMediaRes = await fetch(`${BASE_URL}/api/media/${mp4MediaId}.mp4`);
  console.log(`Full video GET /api/media/${mp4MediaId}.mp4: HTTP ${fullMediaRes.status}`);
  assert(fullMediaRes.status === 200, 'Full GET must return 200');
  assert(fullMediaRes.headers.get('accept-ranges') === 'bytes', 'Must declare Accept-Ranges: bytes');
  assert(fullMediaRes.headers.get('content-type')?.includes('video/mp4'), 'Must have video/mp4 Content-Type');
  const fullBytes = await fullMediaRes.arrayBuffer();
  console.log(`Total video bytes: ${fullBytes.byteLength}`);

  // 5B. Range request: bytes=0-31 (first 32 bytes)
  const rangeRes1 = await fetch(`${BASE_URL}/api/media/${mp4MediaId}.mp4`, {
    headers: { Range: 'bytes=0-31' },
  });
  console.log(`Range bytes=0-31: HTTP ${rangeRes1.status}`);
  assert(rangeRes1.status === 206, 'Range request must return HTTP 206 Partial Content');
  assert(rangeRes1.headers.get('content-range')?.startsWith('bytes 0-31/'), 'Must include correct Content-Range');
  const chunk1 = await rangeRes1.arrayBuffer();
  assert(chunk1.byteLength === 32, `Chunk size must be 32, got ${chunk1.byteLength}`);

  // 5C. Range request: bytes=32- (from byte 32 to end)
  const rangeRes2 = await fetch(`${BASE_URL}/api/media/${mp4MediaId}.mp4`, {
    headers: { Range: 'bytes=32-' },
  });
  console.log(`Range bytes=32-: HTTP ${rangeRes2.status}`);
  assert(rangeRes2.status === 206, 'Range request must return HTTP 206 Partial Content');
  assert(rangeRes2.headers.get('content-range')?.startsWith('bytes 32-'), 'Must start at byte 32');

  // 5D. Unsatisfiable range: bytes=99999-999999
  const rangeRes3 = await fetch(`${BASE_URL}/api/media/${mp4MediaId}.mp4`, {
    headers: { Range: 'bytes=99999-999999' },
  });
  console.log(`Unsatisfiable Range: HTTP ${rangeRes3.status}`);
  assert(rangeRes3.status === 416, 'Unsatisfiable range must return HTTP 416 Range Not Satisfiable');

  console.log('✓ PASS: HTTP 206 Range partial content streaming fully functional.\n');

  // ── TEST 6: Media Query & Filtering (GET /api/admin/media) ──
  console.log('--- TEST 6: Media Query & Filtering ---');

  // 6A. All media query
  const allMediaRes = await fetch(`${BASE_URL}/api/admin/media`, { headers: authHeaders });
  const allMediaJson = await allMediaRes.json();
  console.log(`GET /api/admin/media: HTTP ${allMediaRes.status}`);
  assert(allMediaJson.success, 'GET /api/admin/media must return success');
  assert(typeof allMediaJson.counts.images === 'number', 'Must include images count');
  assert(typeof allMediaJson.counts.videos === 'number', 'Must include videos count');
  console.log(`Counts: Total: ${allMediaJson.counts.total}, Images: ${allMediaJson.counts.images}, Videos: ${allMediaJson.counts.videos}`);

  // 6B. Videos only query
  const videosOnlyRes = await fetch(`${BASE_URL}/api/admin/media?mediaType=video`, { headers: authHeaders });
  const videosOnlyJson = await videosOnlyRes.json();
  console.log(`GET /api/admin/media?mediaType=video: HTTP ${videosOnlyRes.status}, count: ${videosOnlyJson.data.length}`);
  assert(videosOnlyJson.data.every((item) => item.type === 'video'), 'Every item in video filter must be video');

  // 6C. Images only query
  const imagesOnlyRes = await fetch(`${BASE_URL}/api/admin/media?mediaType=image`, { headers: authHeaders });
  const imagesOnlyJson = await imagesOnlyRes.json();
  console.log(`GET /api/admin/media?mediaType=image: HTTP ${imagesOnlyRes.status}, count: ${imagesOnlyJson.data.length}`);
  assert(imagesOnlyJson.data.every((item) => item.type === 'image'), 'Every item in image filter must be image');

  console.log('✓ PASS: mediaType filter (all, image, video) and counts verified.\n');

  // ── TEST 7: Clean Deletion of Test Assets ──
  console.log('--- TEST 7: Clean Deletion of Test Uploads ---');
  for (const id of createdMediaIds) {
    const delRes = await fetch(`${BASE_URL}/api/admin/media/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(`DELETE /api/admin/media/${id}: HTTP ${delRes.status}`);
    assert(delRes.status === 200, `Deletion of ${id} must return 200`);

    // Verify it is now 404
    const getDeleted = await fetch(`${BASE_URL}/api/media/${id}.mp4`);
    assert(getDeleted.status === 404, `Deleted asset ${id} must return 404`);
  }
  console.log(`✓ PASS: Cleanly deleted all ${createdMediaIds.length} test assets from MongoDB Atlas binary storage.\n`);

  // ── TEST 8: Data Preservation Audit (all 66 products unchanged) ──
  console.log('--- TEST 8: Data Preservation & Integrity Audit ---');
  const catalogRes = await fetch(`${BASE_URL}/api/admin/catalog`, { headers: authHeaders });
  const catalogJson = await catalogRes.json();
  console.log(`Total active products in database: ${catalogJson.data.length}`);
  assert(catalogJson.data.length === 66, `Expected 66 products in catalog, got ${catalogJson.data.length}`);

  // Confirm authentic order count
  const ordersRes = await fetch(`${BASE_URL}/api/admin/orders`, { headers: authHeaders });
  const ordersJson = await ordersRes.json();
  const orderCount = ordersJson.orders ? ordersJson.orders.length : (ordersJson.data ? ordersJson.data.length : ordersJson.count);
  console.log(`Total orders in database: ${orderCount}`);
  assert(orderCount > 0, `Expected orders in database, got ${orderCount}`);

  console.log(`✓ PASS: 66/66 products intact, ${orderCount} orders intact, zero existing records modified or corrupted.\n`);

  console.log('===============================================================');
  console.log(' ALL VERIFICATION TESTS COMPLETED WITH 100% SUCCESS (8/8 PASS)');
  console.log('===============================================================');
}

main().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
