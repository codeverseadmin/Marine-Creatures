import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) results = results.concat(getFiles(fullPath));
    else if (file.endsWith('.ts')) results.push(fullPath);
  });
  return results;
}

const routes = getFiles('app/api');
const inventory = [];

routes.forEach((filePath) => {
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].filter((m) =>
    new RegExp('export\\s+async\\s+function\\s+' + m + '\\b').test(content)
  );

  methods.forEach((method) => {
    const regex = new RegExp('export\\s+async\\s+function\\s+' + method + '[\\s\\S]*?(?=export\\s+async\\s+function|$)');
    const match = content.match(regex);
    const block = match ? match[0] : '';

    let perm = 'NONE';
    const reqPermMatch = block.match(/requirePermission\(req,\s*['"]([^'"]+)['"]\)/);
    const reqAnyMatch = block.match(/requireAnyPermission\(req,\s*\[([^\]]+)\]\)/);
    const authEmpMatch = block.includes('requireAuthenticatedEmployee');
    const resolveAuthMatch = block.includes('resolveAuthContext');
    const isLogin = block.includes('verifyPasscode');

    let authMandatory = true;
    let intentionallyPublic = false;

    if (reqPermMatch) {
      perm = reqPermMatch[1];
    } else if (reqAnyMatch) {
      perm = reqAnyMatch[1].replace(/['"\s\n]/g, '');
    } else if (authEmpMatch) {
      perm = 'ANY_ACTIVE_EMPLOYEE';
    } else if (resolveAuthMatch) {
      perm = 'DYNAMIC / MULTI_TIER';
    } else if (isLogin) {
      perm = 'PUBLIC_AUTH (Email+Pass or Passcode)';
      authMandatory = false;
      intentionallyPublic = true;
    } else {
      perm = 'PUBLIC';
      authMandatory = false;
      intentionallyPublic = true;
    }

    if (relPath.includes('app/api/orders') && method === 'POST') {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC (Storefront order) / orders.create (Admin override)';
    }

    if (relPath.includes('app/api/products') && method === 'GET') {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC (Storefront catalog)';
    }

    if (relPath.includes('app/api/banners') && method === 'GET') {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC (Storefront banners)';
    }

    if (relPath.includes('app/api/settings') && method === 'GET') {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC (Storefront settings)';
    }

    if (relPath.includes('app/api/inquiries') && method === 'POST') {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC (Customer lead generation)';
    }

    if (relPath.includes('app/api/orders/track') && method === 'GET') {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC (Masked Tracking) / orders.read (Full Manifest)';
    }

    if (relPath.includes('app/api/orders/[id]') && method === 'GET') {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC_TOKEN (256-bit CSPRNG) / orders.read (Admin)';
    }

    if (relPath.includes('app/api/admin/analytics/events') && method === 'POST') {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC (Storefront Telemetry - Rate limited & Sanitized)';
    }

    if (relPath.includes('app/api/auth/invitation') && (method === 'POST' || method === 'GET')) {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC_INVITATION (Token verified)';
    }

    if (relPath.includes('app/api/reviews') && !relPath.includes('admin')) {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC_REVIEW (Token verified or read-only)';
    }

    if (relPath.includes('app/api/admin/logout')) {
      authMandatory = false;
      intentionallyPublic = true;
      perm = 'PUBLIC (Clears session cookie)';
    }

    inventory.push({
      route: '/' + relPath.replace('/route.ts', '').replace('app/', ''),
      method,
      permission: perm,
      authMandatory,
      intentionallyPublic,
      enforcedServerSide: perm !== 'PUBLIC'
    });
  });
});

console.log(JSON.stringify(inventory, null, 2));
console.log('Total Handlers Cataloged:', inventory.length);

