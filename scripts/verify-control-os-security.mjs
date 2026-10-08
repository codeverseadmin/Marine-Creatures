import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function checkEndpoint(path, headers = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    return { status: res.status, ok: res.ok, json: await res.json().catch(() => null) };
  } catch (err) {
    return { error: err.message };
  }
}

async function runSecurityAudit() {
  console.log('--- STARTING CONTROL OS SECURITY & AUTH VERIFICATION ---');

  const adminEndpoints = [
    '/api/admin/overview',
    '/api/admin/orders',
    '/api/admin/enquiries',
    '/api/admin/customers',
    '/api/admin/follow-ups',
    '/api/admin/inventory',
    '/api/admin/media',
    '/api/admin/operations/quarantine',
    '/api/admin/operations/dispatch',
    '/api/admin/operations/maintenance',
    '/api/admin/content/seo',
    '/api/admin/analytics',
    '/api/admin/system/audit',
    '/api/admin/system/health',
    '/api/admin/system/security',
    '/api/admin/system/settings',
    '/api/admin/search?q=test',
  ];

  let unauthPassCount = 0;
  for (const ep of adminEndpoints) {
    const res = await checkEndpoint(ep);
    if (res.status === 401) {
      unauthPassCount++;
    } else {
      console.error(`FAILED: ${ep} returned status ${res.status} when unauthenticated!`);
    }
  }
  console.log(`✓ Unauthenticated Security Check: ${unauthPassCount}/${adminEndpoints.length} endpoints correctly returned HTTP 401.`);

  // Check forged session cookie
  const forgedRes = await checkEndpoint('/api/admin/overview', {
    cookie: 'mc_admin_session=eyJmb3JnZWQiOnRydWV9.fake_signature',
  });
  if (forgedRes.status === 401) {
    console.log('✓ Forged Cookie Session Check: Correctly returned HTTP 401.');
  } else {
    console.error(`FAILED: Forged session returned ${forgedRes.status}!`);
  }

  // Check public endpoint privacy (CaseStudies must not leak ClientProject PII)
  const publicWorldsRes = await checkEndpoint('/api/worlds');
  if (publicWorldsRes.ok && publicWorldsRes.json) {
    const dataStr = JSON.stringify(publicWorldsRes.json);
    const hasPhone = dataStr.includes('clientPhone') || dataStr.includes('+91');
    const hasEmail = dataStr.includes('clientEmail') || dataStr.includes('@');
    const hasAddress = dataStr.includes('privateAddress');
    const hasBudget = dataStr.includes('estimatedBudget');

    if (!hasPhone && !hasEmail && !hasAddress && !hasBudget) {
      console.log('✓ Public Privacy Boundary: /api/worlds completely redacts all client PII.');
    } else {
      console.error('FAILED: Public API leaked client details!', { hasPhone, hasEmail, hasAddress, hasBudget });
    }
  }

  console.log('--- CONTROL OS SECURITY VERIFICATION COMPLETE ---');
}

runSecurityAudit();
