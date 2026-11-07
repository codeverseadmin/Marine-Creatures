import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';

const PORT = 3097;
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

function makeJpgBuffer() {
  const buf = Buffer.alloc(512);
  buf[0] = 0xff; buf[1] = 0xd8; buf[2] = 0xff; buf[3] = 0xe0;
  buf[4] = 0x00; buf[5] = 0x10; buf[6] = 0x4a; buf[7] = 0x46; // JFIF
  return buf;
}

function makePngBuffer() {
  const buf = Buffer.alloc(512);
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  sig.forEach((b, i) => { buf[i] = b; });
  return buf;
}

function makeWebpBuffer() {
  const buf = Buffer.alloc(512);
  // RIFF....WEBPVP8
  buf[0] = 0x52; buf[1] = 0x49; buf[2] = 0x46; buf[3] = 0x46;
  buf[4] = 0x00; buf[5] = 0x02; buf[6] = 0x00; buf[7] = 0x00;
  buf[8] = 0x57; buf[9] = 0x45; buf[10] = 0x42; buf[11] = 0x50;
  return buf;
}

async function runHotfixTests() {
  console.log('================================================================');
  console.log(' MARINE CREATURES — PRODUCT EDITOR & MEDIA UPLOAD P0 HOTFIX');
  console.log(' Reference: MC-RELEASE-BLOCKER-PRODUCT-IDENTITY-NOV2026');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('================================================================\n');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const testStats = { total: 0, passed: 0, failed: 0 };
  const failures = [];

  function assert(condition, testName, details = '') {
    testStats.total++;
    if (condition) {
      testStats.passed++;
      console.log(`  ✓ PASS [${testStats.total}]: ${testName}`);
    } else {
      testStats.failed++;
      console.error(`  ✗ FAIL [${testStats.total}]: ${testName} - ${details}`);
      failures.push({ testName, details });
      throw new Error(`Test Failed: ${testName} (${details})`);
    }
  }

  // 1. Setup temporary test admin employee for HTTP authorization
  const testAdminId = new mongoose.Types.ObjectId();
  const testAdminEmail = 'hotfix-verifier@marinecreatures.local';
  await db.collection('employees').insertOne({
    _id: testAdminId,
    id: 'emp-hotfix-test',
    email: testAdminEmail,
    name: 'Hotfix Verifier Admin',
    roleId: 'owner',
    status: 'active',
    sessionVersion: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const authCookie = createTestEmployeeCookie(testAdminId.toString(), testAdminEmail, 1);
  console.log(`🔑 Authenticated admin session provisioned for [${testAdminEmail}]\n`);

  try {
    // ══════════════════════════════════════════════════════════════════
    // PART G - TEST 1: Affected Product (Blue Treasure Calcium/Coral Sand)
    // ══════════════════════════════════════════════════════════════════
    console.log('--- TEST 1: Affected Product Identity & Editing Resolution ---');
    
    const btOriginal = await db.collection('products').findOne({ id: 'blue-treasure-coral-sand' });
    assert(Boolean(btOriginal), 'Target product [blue-treasure-coral-sand] exists in MongoDB Atlas');
    const originalMongoId = btOriginal._id.toString();
    const originalShortDesc = btOriginal.shortDesc || '';
    const originalName = btOriginal.name;

    // Simulate Admin Editor opening and saving with new name and public slug
    const testShortDesc = `P0 Hotfix Verified at ${Date.now()}`;
    const patchRes = await fetch(`${BASE_URL}/api/admin/catalog`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
      },
      body: JSON.stringify({
        canonicalId: 'blue-treasure-coral-sand',
        id: 'blue-treasure-coral-sand',
        slug: 'blue-treasure-calcium-sand',
        name: 'Blue Treasure Natural Coral Aragonite Sand',
        shortDesc: testShortDesc,
      }),
    });

    assert(patchRes.status === 200, 'PATCH /api/admin/catalog returns HTTP 200 for Blue Treasure edit', `Status: ${patchRes.status}`);
    const patchJson = await patchRes.json();
    assert(patchJson.success === true, 'PATCH /api/admin/catalog returns success: true');
    assert(patchJson.data.shortDesc === testShortDesc, 'Returned document reflects updated shortDesc');

    // Reload from database directly to confirm identity persistence
    const btReloaded = await db.collection('products').findOne({ id: 'blue-treasure-coral-sand' });
    assert(btReloaded._id.toString() === originalMongoId, 'Database _id is strictly preserved without recreation or mutation');
    assert(btReloaded.id === 'blue-treasure-coral-sand', 'Canonical Governance ID remains immutable [blue-treasure-coral-sand]');
    assert(btReloaded.slug === 'blue-treasure-calcium-sand', 'Public marketplace slug successfully set to [blue-treasure-calcium-sand]');
    assert(btReloaded.shortDesc === testShortDesc, 'Updated shortDesc persisted to MongoDB document');

    // Test trailing hyphen slug input: editor sends slug with trailing hyphens
    const trailingSlugRes = await fetch(`${BASE_URL}/api/admin/catalog`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
      },
      body: JSON.stringify({
        canonicalId: 'blue-treasure-coral-sand',
        id: 'blue-treasure-coral-sand',
        slug: 'blue-treasure-calcium-sand---',
      }),
    });
    assert(trailingSlugRes.status === 200, 'Trailing-hyphen slug PATCH succeeds');
    const btTrailing = await db.collection('products').findOne({ id: 'blue-treasure-coral-sand' });
    assert(btTrailing.slug === 'blue-treasure-calcium-sand', 'Trailing hyphens sanitized: slug is [blue-treasure-calcium-sand]');

    // Restore original shortDesc
    await fetch(`${BASE_URL}/api/admin/catalog`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({
        canonicalId: 'blue-treasure-coral-sand',
        id: 'blue-treasure-coral-sand',
        shortDesc: originalShortDesc,
      }),
    });
    console.log('  ✓ Restored original shortDesc for Blue Treasure sand.\n');

    // ══════════════════════════════════════════════════════════════════
    // PART G - TEST 2: Pricing and Variants Update
    // ══════════════════════════════════════════════════════════════════
    console.log('--- TEST 2: Pricing and Variant Updates ---');

    const originalPrice = btOriginal.price;
    const originalVariants = btOriginal.variants || [];
    assert(originalVariants.length > 0, 'Blue Treasure sand has configured variants', `Count: ${originalVariants.length}`);

    const updatedVariants = originalVariants.map((v, i) => ({
      ...v,
      price: (v.price || 1400) + (i + 1) * 10,
    }));

    const priceUpdateRes = await fetch(`${BASE_URL}/api/admin/catalog`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({
        canonicalId: 'blue-treasure-coral-sand',
        id: 'blue-treasure-coral-sand',
        price: originalPrice + 50,
        variants: updatedVariants,
      }),
    });

    assert(priceUpdateRes.status === 200, 'Price & variant update returns HTTP 200');
    const btPriceReloaded = await db.collection('products').findOne({ id: 'blue-treasure-coral-sand' });
    assert(btPriceReloaded.price === originalPrice + 50, 'Updated base price persisted');
    assert(btPriceReloaded.variants[0].price === updatedVariants[0].price, 'Updated variant price persisted');

    // Restore original pricing
    await fetch(`${BASE_URL}/api/admin/catalog`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({
        canonicalId: 'blue-treasure-coral-sand',
        id: 'blue-treasure-coral-sand',
        price: originalPrice,
        variants: originalVariants,
      }),
    });
    console.log('  ✓ Restored original pricing & variants for Blue Treasure sand.\n');

    // ══════════════════════════════════════════════════════════════════
    // PART G - TEST 3: Product Photography (JPEG, PNG, WebP)
    // ══════════════════════════════════════════════════════════════════
    console.log('--- TEST 3: Multi-Format Photo Upload and Product Association ---');

    // 3A. Real JPEG upload via Canonical ID
    const jpgBlob = makeJpgBuffer();
    const jpgForm = new FormData();
    jpgForm.append('file', new Blob([jpgBlob], { type: 'image/jpeg' }), 'specimen-photo.jpg');
    jpgForm.append('type', 'image');
    jpgForm.append('productId', 'blue-treasure-coral-sand');

    const jpgUploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: { 'Cookie': authCookie },
      body: jpgForm,
    });
    assert(jpgUploadRes.status === 201, 'JPEG upload returns HTTP 201 Created', `Status: ${jpgUploadRes.status}`);
    const jpgJson = await jpgUploadRes.json();
    assert(jpgJson.success === true, 'JPEG upload returns success: true');
    assert(jpgJson.productId === 'blue-treasure-coral-sand', 'JPEG upload response reports canonical productId');
    const jpgMediaId = jpgJson.mediaId;

    // Verify database MediaModel record
    const jpgMediaDoc = await db.collection('media').findOne({ id: jpgMediaId });
    assert(Boolean(jpgMediaDoc), 'JPEG media document created in MongoDB media collection');
    assert(jpgMediaDoc.productId === 'blue-treasure-coral-sand', 'JPEG media document correctly associated to canonical product id');
    assert(jpgMediaDoc.contentType === 'image/jpeg', 'JPEG media document contentType is image/jpeg');

    // 3B. Real PNG upload using the Public Slug 'blue-treasure-calcium-sand'
    const pngBlob = makePngBuffer();
    const pngForm = new FormData();
    pngForm.append('file', new Blob([pngBlob], { type: 'image/png' }), 'specimen-photo.png');
    pngForm.append('type', 'image');
    pngForm.append('productId', 'blue-treasure-calcium-sand'); // passed as public slug!

    const pngUploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: { 'Cookie': authCookie },
      body: pngForm,
    });
    assert(pngUploadRes.status === 201, 'PNG upload using public slug returns HTTP 201 Created', `Status: ${pngUploadRes.status}`);
    const pngJson = await pngUploadRes.json();
    assert(pngJson.productId === 'blue-treasure-coral-sand', 'Authoritative resolver resolved public slug to canonical id in upload');
    const pngMediaId = pngJson.mediaId;

    // 3C. Real WebP upload using MongoDB ObjectId
    const webpBlob = makeWebpBuffer();
    const webpForm = new FormData();
    webpForm.append('file', new Blob([webpBlob], { type: 'image/webp' }), 'specimen-photo.webp');
    webpForm.append('type', 'image');
    webpForm.append('productId', originalMongoId); // passed as MongoDB ObjectId!

    const webpUploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: { 'Cookie': authCookie },
      body: webpForm,
    });
    assert(webpUploadRes.status === 201, 'WebP upload using MongoDB ObjectId returns HTTP 201 Created', `Status: ${webpUploadRes.status}`);
    const webpJson = await webpUploadRes.json();
    assert(webpJson.productId === 'blue-treasure-coral-sand', 'Authoritative resolver resolved MongoDB ObjectId to canonical id in upload');
    const webpMediaId = webpJson.mediaId;

    // 3D. Query Product Media endpoint (GET /api/admin/media?productId=...)
    const mediaGetRes = await fetch(`${BASE_URL}/api/admin/media?productId=blue-treasure-coral-sand`, {
      headers: { 'Cookie': authCookie },
    });
    assert(mediaGetRes.status === 200, 'GET /api/admin/media?productId=... returns HTTP 200');
    const mediaGetJson = await mediaGetRes.json();
    assert(mediaGetJson.success === true, 'GET product media returns success: true');
    const uploadedIds = (mediaGetJson.data.uploadedMedia || []).map(m => m.id);
    assert(uploadedIds.includes(jpgMediaId), 'JPEG asset listed in uploadedMedia');
    assert(uploadedIds.includes(pngMediaId), 'PNG asset listed in uploadedMedia');
    assert(uploadedIds.includes(webpMediaId), 'WebP asset listed in uploadedMedia');

    // 3E. Attach JPEG asset to product images array and set primary
    const attachRes = await fetch(`${BASE_URL}/api/admin/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({
        productId: 'blue-treasure-coral-sand',
        url: jpgJson.url,
        isPrimary: true,
      }),
    });
    assert(attachRes.status === 201, 'POST /api/admin/media attaches asset and returns HTTP 201');
    const btAfterAttach = await db.collection('products').findOne({ id: 'blue-treasure-coral-sand' });
    assert(btAfterAttach.images.includes(jpgJson.url), 'Attached image URL present in product.images');
    assert(btAfterAttach.images[0] === jpgJson.url, 'Attached image placed as primary image at index 0');

    // Clean up test media records and restore product images
    await db.collection('media').deleteMany({ id: { $in: [jpgMediaId, pngMediaId, webpMediaId] } });
    await db.collection('products').updateOne(
      { id: 'blue-treasure-coral-sand' },
      { $set: { images: btOriginal.images || [] } }
    );
    console.log('  ✓ Cleaned up test media records and restored original images.\n');

    // ══════════════════════════════════════════════════════════════════
    // PART G - TEST 4: Verification Across Other Catalogue Products
    // ══════════════════════════════════════════════════════════════════
    console.log('--- TEST 4: Verification Across 3 Other Diverse Catalogue Products ---');

    const testProducts = [
      { id: 'designer-clownfish-pair', category: 'marine-life', testField: 'origin', testVal: 'Captive Bred — Red Sea' },
      { id: 'nemo-extreme-led', category: 'lighting-tech', testField: 'brand', testVal: 'Nemo Lighting Systems' },
      { id: 'red-sea-coral-pro-salt', category: 'salt-chemistry', testField: 'shortDesc', testVal: 'Premium SPS/LPS biological salt' },
    ];

    for (const tp of testProducts) {
      console.log(`  Checking product [${tp.id}]...`);
      const prodDoc = await db.collection('products').findOne({ id: tp.id });
      assert(Boolean(prodDoc), `Product [${tp.id}] exists in database`);
      const originalFieldVal = prodDoc[tp.testField];

      // Update field
      const updateRes = await fetch(`${BASE_URL}/api/admin/catalog`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
        body: JSON.stringify({
          canonicalId: tp.id,
          id: tp.id,
          [tp.testField]: tp.testVal,
        }),
      });
      assert(updateRes.status === 200, `PATCH /api/admin/catalog returns HTTP 200 for [${tp.id}]`);
      const reloadedDoc = await db.collection('products').findOne({ id: tp.id });
      assert(reloadedDoc[tp.testField] === tp.testVal, `Updated field persisted for [${tp.id}]`);
      assert(reloadedDoc.id === tp.id, `Canonical ID [${tp.id}] retained intact`);

      // Photo upload for this product
      const pJpg = makeJpgBuffer();
      const pForm = new FormData();
      pForm.append('file', new Blob([pJpg], { type: 'image/jpeg' }), `${tp.id}-test.jpg`);
      pForm.append('type', 'image');
      pForm.append('productId', tp.id);

      const pUploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
        method: 'POST',
        headers: { 'Cookie': authCookie },
        body: pForm,
      });
      assert(pUploadRes.status === 201, `Upload returns HTTP 201 for [${tp.id}]`);
      const pUploadJson = await pUploadRes.json();
      assert(pUploadJson.productId === tp.id, `Media associated to [${tp.id}]`);

      // Clean up uploaded media and restore field
      await db.collection('media').deleteOne({ id: pUploadJson.mediaId });
      await db.collection('products').updateOne(
        { id: tp.id },
        { $set: { [tp.testField]: originalFieldVal } }
      );
      console.log(`  ✓ Verified and restored [${tp.id}].`);
    }
    console.log();

    // ══════════════════════════════════════════════════════════════════
    // PART G - TEST 5: System Regression Suite
    // ══════════════════════════════════════════════════════════════════
    console.log('--- TEST 5: System Regression Suite ---');

    // 5A. Product creation with slug sanitization
    const draftSlug = `test-hotfix-${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/api/admin/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': authCookie },
      body: JSON.stringify({
        id: `${draftSlug}---`,
        name: 'Test Hotfix Product',
        category: 'rock-sand',
        price: 999,
        stockCount: 5,
        inStock: true,
      }),
    });
    assert(createRes.status === 201, 'POST /api/admin/catalog creates new product (HTTP 201)');
    const createdJson = await createRes.json();
    assert(createdJson.data.id === draftSlug, 'Slug sanitized without trailing hyphens on creation');
    // Clean up created test product
    await db.collection('products').deleteOne({ id: draftSlug });

    // 5B. Public product pages render cleanly
    const publicPages = [
      '/marketplace/purple-tang-l',
      '/marketplace/blue-treasure-coral-sand',
      '/marketplace/blue-treasure-calcium-sand',
      '/marketplace/nemo-e450',
    ];
    for (const urlPath of publicPages) {
      const pageRes = await fetch(`${BASE_URL}${urlPath}`);
      assert(pageRes.status === 200, `Public page [${urlPath}] returns HTTP 200`);
    }

    // 5C. Public products catalogue API (GET /api/products)
    const publicCatalogRes = await fetch(`${BASE_URL}/api/products`);
    assert(publicCatalogRes.status === 200, 'GET /api/products returns HTTP 200');
    const publicCatalogJson = await publicCatalogRes.json();
    assert(publicCatalogJson.success === true, 'Public catalog returns success: true');
    assert(publicCatalogJson.data.length === 55, `Public catalog returns exactly 55 active products (excluding 10 archived)`);

    const adminCatalogRes = await fetch(`${BASE_URL}/api/admin/catalog`, {
      headers: { 'Cookie': authCookie },
    });
    assert(adminCatalogRes.status === 200, 'GET /api/admin/catalog returns HTTP 200');
    const adminCatalogJson = await adminCatalogRes.json();
    assert(adminCatalogJson.metrics.totalProducts >= 64, `Admin catalog reports ${adminCatalogJson.metrics.totalProducts} total products in database`);

    // 5D. Authoritative cart checkout & order creation
    const clownfishDoc = await db.collection('products').findOne({ id: 'designer-clownfish-pair' });
    const authClownPrice = clownfishDoc.price || 3800;

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Hotfix Test Customer',
        phone: '9876543210',
        address: '123 Ocean Boulevard, Marine Drive, Mumbai',
        city: 'Mumbai',
        pincode: '400001',
        items: [
          {
            id: 'designer-clownfish-pair',
            name: 'Snowflake Clownfish (Altered Price Attempt)',
            price: 1, // Tampered client price (authoritative is ₹3800)
            quantity: 2,
          },
        ],
      }),
    });
    assert(orderRes.status === 200 || orderRes.status === 201, `Order creation returns HTTP 200/201 (Status: ${orderRes.status})`);
    const orderJson = await orderRes.json();
    assert(orderJson.success === true, 'Order created successfully');
    const testOrderId = orderJson.data.id;
    const testOrderDoc = await db.collection('orders').findOne({ id: testOrderId });
    assert(testOrderDoc.totalAmount === authClownPrice * 2, `Server enforced authoritative catalog price (2 * ${authClownPrice} = ${authClownPrice * 2}, ignoring tampered price 1)`);
    // Clean up test order
    await db.collection('orders').deleteOne({ id: testOrderId });

    // 5E. Historical orders integrity: MC-8921 and MC-8922
    const h1 = await db.collection('orders').findOne({ id: 'MC-8921' });
    const h2 = await db.collection('orders').findOne({ id: 'MC-8922' });
    assert(Boolean(h1), 'Historical order [MC-8921] preserved intact in MongoDB');
    assert(Boolean(h2), 'Historical order [MC-8922] preserved intact in MongoDB');
    assert(h1.isApproved === true, 'MC-8921 preserves approved status');
    assert(h2.isApproved === true, 'MC-8922 preserves approved status');

    // 5F. RBAC enforcement: Unauthenticated requests rejected
    const unauthPatch = await fetch(`${BASE_URL}/api/admin/catalog`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'designer-clownfish-pair', name: 'Hacked' }),
    });
    assert(unauthPatch.status === 401 || unauthPatch.status === 403, 'Unauthenticated PATCH /api/admin/catalog rejected (401/403)');

    const unauthUpload = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      body: new FormData(),
    });
    assert(unauthUpload.status === 401 || unauthUpload.status === 403, 'Unauthenticated POST /api/admin/upload rejected (401/403)');
    console.log();

    // ══════════════════════════════════════════════════════════════════
    // PART G - TEST 6: Security Regression Suite
    // ══════════════════════════════════════════════════════════════════
    console.log('--- TEST 6: Security Regression Suite ---');

    // 6A. Bootstrap seal verification
    const sealDoc = await db.collection('settings').findOne({ key: 'security.bootstrap_sealed' });
    assert(sealDoc?.value === true || sealDoc?.value?.sealed === true, 'Database bootstrap seal [security.bootstrap_sealed] remains TRUE');

    // 6B. Passcode backdoor rejection
    const passcodeRes = await fetch(`${BASE_URL}/api/admin/catalog`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': 'marinecreatures2026',
      },
      body: JSON.stringify({ id: 'designer-clownfish-pair', name: 'Backdoor Test' }),
    });
    assert(passcodeRes.status === 401, 'Passcode header override strictly rejected with HTTP 401');

    // 6C. Non-existent product upload rejection
    const fakeForm = new FormData();
    fakeForm.append('file', new Blob([makeJpgBuffer()], { type: 'image/jpeg' }), 'fake.jpg');
    fakeForm.append('type', 'image');
    fakeForm.append('productId', 'non-existent-product-xyz');

    const fakeUploadRes = await fetch(`${BASE_URL}/api/admin/upload`, {
      method: 'POST',
      headers: { 'Cookie': authCookie },
      body: fakeForm,
    });
    assert(fakeUploadRes.status === 404, 'Upload targeting non-existent product rejected with HTTP 404');
    console.log();

  } finally {
    // Clean up temporary test admin employee
    await db.collection('employees').deleteOne({ _id: testAdminId });
    await mongoose.disconnect();
    console.log('🧹 Cleaned up temporary test employee and disconnected from MongoDB.\n');
  }

  console.log('================================================================');
  console.log(` VERIFICATION SUMMARY:`);
  console.log(` Total Checks:  ${testStats.total}`);
  console.log(` Passed:        ${testStats.passed}`);
  console.log(` Failed:        ${testStats.failed}`);
  console.log('================================================================\n');

  if (testStats.failed > 0) {
    console.error('FAILURES:', failures);
    process.exit(1);
  } else {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY (100% PASS RATE).');
    process.exit(0);
  }
}

runHotfixTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

