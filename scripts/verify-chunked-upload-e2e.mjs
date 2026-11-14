import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

function createFounderToken() {
  const now = Date.now();
  const payload = {
    type: 'employee',
    sub: '6af8b7f29b3621acf9b2a97e',
    email: 'founder@marinecreatures.local',
    ver: 2,
    iat: now,
    exp: now + 8 * 3600 * 1000,
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', env.SESSION_SECRET).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${signature}`;
}

async function testTarget(baseUrl) {
  console.log(`\n========================================================================`);
  console.log(`  TESTING CHUNKED UPLOAD PIPELINE ON: ${baseUrl}`);
  console.log(`========================================================================`);

  const token = createFounderToken();
  const cookie = `mc_admin_session=${token}`;

  // 1. Test OPTIONS preflight
  console.log('1. Testing OPTIONS preflight on /api/admin/upload/chunk...');
  const optionsRes = await fetch(`${baseUrl}/api/admin/upload/chunk`, {
    method: 'OPTIONS',
    headers: {
      'Origin': baseUrl,
      'Access-Control-Request-Method': 'POST',
    },
  });
  console.log(`   OPTIONS status: ${optionsRes.status}`);
  console.log(`   CORS Origin header: ${optionsRes.headers.get('access-control-allow-origin')}`);
  console.log(`   CORS Credentials header: ${optionsRes.headers.get('access-control-allow-credentials')}`);
  if (optionsRes.status !== 204) throw new Error(`OPTIONS preflight failed: HTTP ${optionsRes.status}`);

  // 2. Authorize 7.38 MB video (same as customer file Screen Recording 2025-02-03 183057.mp4)
  const size = 7743668; // 7.38 MB
  const filename = 'Screen Recording 2025-02-03 183057.mp4';
  const contentType = 'video/mp4';

  console.log('2. Authorizing upload session...');
  const authRes = await fetch(`${baseUrl}/api/admin/upload/authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'Origin': baseUrl,
    },
    body: JSON.stringify({ filename, contentType, size }),
  });

  const authJson = await authRes.json();
  console.log(`   Authorize status: ${authRes.status}`);
  console.log(`   Chunk size: ${(authJson.chunkSize / (1024 * 1024)).toFixed(2)} MB (${authJson.chunkSize} bytes)`);
  console.log(`   Total chunks: ${authJson.totalChunks}`);
  console.log(`   Upload ID: ${authJson.uploadId}`);

  if (!authRes.ok) throw new Error(`Authorize failed: ${JSON.stringify(authJson)}`);
  if (authJson.chunkSize !== 1048576) {
    console.warn(`   Notice: Server returned chunkSize ${authJson.chunkSize} (expected 1048576 for updated server)`);
  }

  const { uploadId, chunkSize, totalChunks, signature, expiresAt } = authJson;

  // Build synthetic MP4 buffer with genuine ftypisom header
  const fullBuffer = Buffer.alloc(size);
  const mp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ....ftyp
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00, // isom....
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32  // isomiso2
  ]);
  mp4Header.copy(fullBuffer, 0);

  // 3. Upload all chunks sequentially
  console.log(`3. Uploading ${totalChunks} chunks sequentially...`);
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, size);
    const chunkBuffer = fullBuffer.subarray(start, end);
    const chunkBlob = new Blob([chunkBuffer], { type: contentType });

    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('size', size.toString());
    formData.append('contentType', contentType);
    formData.append('signature', signature);
    formData.append('expiresAt', expiresAt.toString());
    formData.append('chunk', chunkBlob, `${filename}.part${chunkIndex}`);

    const t0 = Date.now();
    const chunkRes = await fetch(`${baseUrl}/api/admin/upload/chunk`, {
      method: 'POST',
      headers: {
        'Cookie': cookie,
        'Origin': baseUrl,
      },
      body: formData,
    });

    const chunkData = await chunkRes.json();
    const duration = Date.now() - t0;
    console.log(`   Chunk ${chunkIndex + 1}/${totalChunks} (${(chunkBuffer.length / 1024).toFixed(0)} KB) -> HTTP ${chunkRes.status} in ${duration}ms`);

    if (!chunkRes.ok) {
      throw new Error(`Chunk ${chunkIndex + 1} failed: ${JSON.stringify(chunkData)}`);
    }
  }

  // 4. Complete upload
  console.log('4. Calling /api/admin/upload/complete...');
  const tComp = Date.now();
  const compRes = await fetch(`${baseUrl}/api/admin/upload/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'Origin': baseUrl,
    },
    body: JSON.stringify({
      uploadId,
      filename,
      contentType,
      size,
      totalChunks,
      signature,
      expiresAt,
    }),
  });

  const compData = await compRes.json();
  console.log(`   Complete status: ${compRes.status} in ${Date.now() - tComp}ms`);
  console.log(`   Assembled URL: ${compData.url}`);
  console.log(`   Media ID: ${compData.mediaId}`);
  console.log(`   Provider: ${compData.provider}`);

  if (!compRes.ok) throw new Error(`Complete failed: ${JSON.stringify(compData)}`);

  // 5. Test Range Streaming on the assembled media file
  console.log(`5. Verifying RFC 7233 Range streaming on ${compData.url}...`);
  const rangeRes = await fetch(`${baseUrl}${compData.url}`, {
    headers: { Range: 'bytes=0-1023' },
  });
  console.log(`   Range status: HTTP ${rangeRes.status}`);
  console.log(`   Content-Range: ${rangeRes.headers.get('content-range')}`);
  console.log(`   Content-Length: ${rangeRes.headers.get('content-length')}`);
  console.log(`   Accept-Ranges: ${rangeRes.headers.get('accept-ranges')}`);

  if (rangeRes.status !== 206) throw new Error(`Expected HTTP 206, got ${rangeRes.status}`);
  if (rangeRes.headers.get('accept-ranges') !== 'bytes') throw new Error('Missing Accept-Ranges: bytes');
  if (rangeRes.headers.get('content-length') !== '1024') throw new Error('Invalid partial content length');

  console.log(`\n>>> SUCCESS: ${baseUrl} passed all chunked upload & streaming tests cleanly!`);
}

async function main() {
  await testTarget('http://localhost:3000');
  await testTarget('http://192.168.31.14:3000');
}

main().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
