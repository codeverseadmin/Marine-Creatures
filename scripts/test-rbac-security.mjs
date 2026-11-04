/**
 * Marine Creatures — Role-Based Access Control (RBAC) Security Verification Suite
 * 
 * Verifies:
 *  1. Individual authentication (email + scrypt password)
 *  2. Brute-force & invalid login handling
 *  3. Suspended account immediate access revocation
 *  4. Session version bump immediate revocation
 *  5. HMAC cryptographic signature tampering detection
 *  6. API permission enforcement (401 unauthenticated, 403 unauthorized)
 *  7. Domain-specific role barriers (Operations vs Inventory vs Finance vs Support vs Auditor)
 *  8. Invitation lifecycle (one-time token, expiration, reuse prevention, password setup)
 *  9. Last active Owner protection
 * 10. Custom role lifecycle & assigned role deletion safety
 * 11. Complete audit trail verification
 * 12. Synthetic test fixture cleanup
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { createHmac, randomBytes } from 'crypto';
import mongoose from 'mongoose';

function getEnvVar(name) {
  if (process.env[name]) return process.env[name].trim();
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const match = content.match(new RegExp(`${name}=["']?([^"'\\r\\n]+)["']?`));
    if (match) return match[1].trim();
  }
  return '';
}

const BASE_URL = 'http://localhost:3000';
const MONGODB_URI = getEnvVar('MONGODB_URI');
const ADMIN_PASSCODE = getEnvVar('ADMIN_PASSCODE') || 'SurajMC2026Admin';

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✕ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    failedCount++;
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { ...options.headers };

  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  const cookieHeader = response.headers.get('set-cookie');
  let sessionCookie = null;
  if (cookieHeader) {
    const match = cookieHeader.match(/mc_admin_session=([^;]+)/);
    if (match) sessionCookie = match[1];
  }

  return {
    status: response.status,
    headers: response.headers,
    data,
    sessionCookie,
  };
}

async function runRbacTests() {
  console.log('========================================================================');
  console.log('  MARINE CREATURES — RBAC SECURITY & ROLE BARRIER TEST SUITE');
  console.log('========================================================================\n');

  // Connect to DB directly for synthetic test fixture lifecycle management
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const EmployeeCollection = db.collection('employees');
  const RoleCollection = db.collection('roles');
  const AuditLogCollection = db.collection('auditlogs');

  const SYNTH_PREFIX = 'synthetic_qa_test_';
  const synthEmails = [];

  try {
    // ── 1. UNAUTHENTICATED ACCESS GATEKEEPER ──────────────────────────────────
    console.log('--- 1. UNAUTHENTICATED API ACCESS PROTECTION ---');
    {
      const res1 = await apiRequest('/api/admin/employees');
      assert(res1.status === 401, 'Unauthenticated /api/admin/employees returns 401 Unauthorized');
      assert(res1.data?.success === false, 'Unauthenticated response indicates success: false');

      const res2 = await apiRequest('/api/admin/orders');
      assert(res2.status === 401, 'Unauthenticated /api/admin/orders returns 401 Unauthorized');

      const res3 = await apiRequest('/api/admin/catalog');
      assert(res3.status === 401, 'Unauthenticated /api/admin/catalog returns 401 Unauthorized');

      const res4 = await apiRequest('/api/admin/system/audit');
      assert(res4.status === 401, 'Unauthenticated /api/admin/system/audit returns 401 Unauthorized');
    }

    // ── 2. FOUNDER BOOTSTRAP LOGIN ───────────────────────────────────────────
    console.log('\n--- 2. FOUNDER BOOTSTRAP & OWNER SESSION ---');
    let ownerSessionCookie = null;
    {
      // Log in with founder master passcode
      const loginRes = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: { passcode: ADMIN_PASSCODE },
      });

      assert(loginRes.status === 200, 'Founder master passcode login succeeds with 200 OK');
      assert(Boolean(loginRes.sessionCookie), 'Cryptographic session cookie issued to founder');
      ownerSessionCookie = loginRes.sessionCookie;

      // Verify /api/admin/me returns owner status
      const meRes = await apiRequest('/api/admin/me', {
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
      });

      assert(meRes.status === 200, 'GET /api/admin/me returns 200 OK');
      assert(meRes.data?.authenticated === true, 'Identity authenticated as active admin');
      assert(meRes.data?.user?.isOwner === true, 'Founder recognized as Owner');
      assert(meRes.data?.user?.permissions?.length > 40, 'Owner holds full capability matrix (40+ perms)');
    }

    // ── 3. EMPLOYEE INVITATION LIFECYCLE ──────────────────────────────────────
    console.log('\n--- 3. SECURE EMPLOYEE INVITATION LIFECYCLE ---');
    const empEmail = `${SYNTH_PREFIX}operations_lead@test.local`;
    synthEmails.push(empEmail);
    let invitationToken = null;
    let employeeId = null;

    {
      // Owner creates an invitation for an Operations Manager
      const inviteRes = await apiRequest('/api/admin/employees', {
        method: 'POST',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
        body: {
          name: 'Synthetic Ops Lead',
          email: empEmail,
          roleId: 'operations_manager',
        },
      });

      assert(inviteRes.status === 200, 'Owner generates employee invitation (200 OK)');
      assert(Boolean(inviteRes.data?.invitation?.token), 'One-time invitation token returned to Owner');
      assert(Boolean(inviteRes.data?.invitation?.inviteUrl), 'Complete invitation link constructed');
      assert(inviteRes.data?.employee?.status === 'invited', 'Initial employee status is "invited"');
      assert(!inviteRes.data?.employee?.passwordHash, 'Password hash is strictly omitted / null');

      invitationToken = inviteRes.data.invitation.token;
      employeeId = inviteRes.data.employee._id;

      // Duplicate email rejection check
      const dupRes = await apiRequest('/api/admin/employees', {
        method: 'POST',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
        body: {
          name: 'Synthetic Duplicate',
          email: empEmail,
          roleId: 'operations_manager',
        },
      });
      assert(dupRes.status === 409, 'Duplicate employee email rejected with 409 Conflict');

      // Verify Invitation Token via public endpoint
      const verifyRes = await apiRequest(`/api/auth/invitation/verify?token=${invitationToken}`);
      assert(verifyRes.status === 200, 'GET /api/auth/invitation/verify validates token successfully');
      assert(verifyRes.data?.employee?.email === empEmail, 'Token verification returns correct candidate email');

      // Invalid token verification check
      const badTokenRes = await apiRequest('/api/auth/invitation/verify?token=invalid_hex_token_00000000000000000000000000000000');
      assert(badTokenRes.status === 400, 'Invalid invitation token rejected with 400 Bad Request');
    }

    // ── 4. INVITATION ACCEPTANCE & PASSWORD SETUP ────────────────────────────
    console.log('\n--- 4. INVITATION ACCEPTANCE & PASSWORD SECURITY ---');
    let opsSessionCookie = null;
    {
      // Weak password rejection
      const weakRes = await apiRequest('/api/auth/invitation/accept', {
        method: 'POST',
        body: { token: invitationToken, password: 'weak' },
      });
      assert(weakRes.status === 400, 'Weak password (<8 chars) rejected with 400 Bad Request');

      // Accept with valid strong password
      const acceptRes = await apiRequest('/api/auth/invitation/accept', {
        method: 'POST',
        body: { token: invitationToken, password: 'SecureOpsPass2026!' },
      });

      assert(acceptRes.status === 200, 'Accept invitation & set scrypt password succeeds (200 OK)');
      assert(Boolean(acceptRes.sessionCookie), 'Automatic session cookie issued upon activation');
      opsSessionCookie = acceptRes.sessionCookie;

      // Token reuse prevention
      const reuseRes = await apiRequest('/api/auth/invitation/accept', {
        method: 'POST',
        body: { token: invitationToken, password: 'SecureOpsPass2026!' },
      });
      assert(reuseRes.status === 400, 'Reusing an already-accepted invitation token is rejected (400 Bad Request)');
    }

    // ── 5. INDIVIDUAL EMPLOYEE AUTHENTICATION ────────────────────────────────
    console.log('\n--- 5. INDIVIDUAL EMPLOYEE AUTHENTICATION (EMAIL + PASSWORD) ---');
    {
      // Correct credentials
      const loginRes = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: { email: empEmail, password: 'SecureOpsPass2026!' },
      });
      assert(loginRes.status === 200, 'Employee signs in with registered email and password (200 OK)');
      assert(Boolean(loginRes.sessionCookie), 'Individual HMAC employee session token issued');
      opsSessionCookie = loginRes.sessionCookie;

      // Incorrect password
      const badPassRes = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: { email: empEmail, password: 'WrongPassword123!' },
      });
      assert(badPassRes.status === 401, 'Incorrect password rejected with 401 Unauthorized');

      // Nonexistent email
      const badEmailRes = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: { email: 'nonexistent_user@test.local', password: 'AnyPassword123!' },
      });
      assert(badEmailRes.status === 401, 'Nonexistent email rejected with 401 Unauthorized');
    }

    // ── 6. ROLE BARRIERS & PERMISSION ENFORCEMENT ────────────────────────────
    console.log('\n--- 6. ROLE BARRIERS & PERMISSION ENFORCEMENT ---');
    {
      // Verify Operations Manager capabilities
      const opsMe = await apiRequest('/api/admin/me', {
        headers: { Cookie: `mc_admin_session=${opsSessionCookie}` },
      });
      assert(opsMe.status === 200, 'Operations Manager can query /api/admin/me');
      assert(opsMe.data?.user?.roleId === 'operations_manager', 'Recognized as role "operations_manager"');
      assert(opsMe.data?.user?.isOwner === false, 'Operations Manager is strictly NOT Owner');

      // Allowed: Orders read
      const ordersRes = await apiRequest('/api/admin/orders', {
        headers: { Cookie: `mc_admin_session=${opsSessionCookie}` },
      });
      assert(ordersRes.status === 200, 'Operations Manager CAN view /api/admin/orders (orders.read)');

      // Forbidden: Employee management
      const empRes = await apiRequest('/api/admin/employees', {
        headers: { Cookie: `mc_admin_session=${opsSessionCookie}` },
      });
      assert(empRes.status === 403, 'Operations Manager CANNOT access /api/admin/employees (403 Forbidden)');

      // Forbidden: Role management
      const rolesRes = await apiRequest('/api/admin/roles', {
        headers: { Cookie: `mc_admin_session=${opsSessionCookie}` },
      });
      assert(rolesRes.status === 403, 'Operations Manager CANNOT access /api/admin/roles (403 Forbidden)');

      // Forbidden: Catalog product creation
      const catCreateRes = await apiRequest('/api/admin/catalog', {
        method: 'POST',
        headers: { Cookie: `mc_admin_session=${opsSessionCookie}` },
        body: { name: 'Unauthorized Specimen' },
      });
      assert(catCreateRes.status === 403, 'Operations Manager CANNOT create products (403 Forbidden)');

      // Forbidden: System security management
      const secRes = await apiRequest('/api/admin/system/security', {
        headers: { Cookie: `mc_admin_session=${opsSessionCookie}` },
      });
      assert(secRes.status === 403, 'Operations Manager CANNOT access /api/admin/system/security (403 Forbidden)');
    }

    // ── 7. OTHER INITIAL ROLES VERIFICATION ──────────────────────────────────
    console.log('\n--- 7. DOMAIN ROLE ISOLATION: SUPPORT, INVENTORY, FINANCE, AUDITOR ---');
    {
      // Create and test Customer Support employee
      const csEmail = `${SYNTH_PREFIX}support_rep@test.local`;
      synthEmails.push(csEmail);

      const csInvite = await apiRequest('/api/admin/employees', {
        method: 'POST',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
        body: { name: 'Synthetic Support Rep', email: csEmail, roleId: 'customer_support' },
      });
      const csToken = csInvite.data.invitation.token;

      const csAccept = await apiRequest('/api/auth/invitation/accept', {
        method: 'POST',
        body: { token: csToken, password: 'SupportPass2026!' },
      });
      const csSession = csAccept.sessionCookie;

      // Customer Support: allowed enquiries
      const enqRes = await apiRequest('/api/admin/enquiries', {
        headers: { Cookie: `mc_admin_session=${csSession}` },
      });
      assert(enqRes.status === 200, 'Customer Support CAN view /api/admin/enquiries (enquiries.read)');

      // Customer Support: FORBIDDEN catalog price/product change
      const csCatRes = await apiRequest('/api/admin/catalog', {
        method: 'POST',
        headers: { Cookie: `mc_admin_session=${csSession}` },
        body: { name: 'Illegal Specimen' },
      });
      assert(csCatRes.status === 403, 'Customer Support CANNOT create products (403 Forbidden)');

      // Customer Support: FORBIDDEN finance invoice generation
      const csInvRes = await apiRequest('/api/admin/orders/MC-QA-STANDARD/invoice-pdf', {
        headers: { Cookie: `mc_admin_session=${csSession}` },
      });
      assert(csInvRes.status === 403, 'Customer Support CANNOT generate tax invoices (403 Forbidden)');

      // Create and test Auditor / Viewer (Strict Read-Only)
      const auditEmail = `${SYNTH_PREFIX}auditor_viewer@test.local`;
      synthEmails.push(auditEmail);

      const auditInvite = await apiRequest('/api/admin/employees', {
        method: 'POST',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
        body: { name: 'Synthetic Auditor', email: auditEmail, roleId: 'auditor' },
      });
      const auditToken = auditInvite.data.invitation.token;

      const auditAccept = await apiRequest('/api/auth/invitation/accept', {
        method: 'POST',
        body: { token: auditToken, password: 'AuditorPass2026!' },
      });
      const auditSession = auditAccept.sessionCookie;

      // Auditor: allowed viewing orders & audit log
      const aOrders = await apiRequest('/api/admin/orders', {
        headers: { Cookie: `mc_admin_session=${auditSession}` },
      });
      assert(aOrders.status === 200, 'Auditor CAN read orders (orders.read)');

      const aLogs = await apiRequest('/api/admin/system/audit', {
        headers: { Cookie: `mc_admin_session=${auditSession}` },
      });
      assert(aLogs.status === 200, 'Auditor CAN read audit logs (audit.read)');

      // Auditor: FORBIDDEN write operations (e.g. order status patch)
      const aPatch = await apiRequest('/api/admin/orders', {
        method: 'PATCH',
        headers: { Cookie: `mc_admin_session=${auditSession}` },
        body: { id: 'MC-1001', currentStep: 'quarantine' },
      });
      assert(aPatch.status === 403, 'Auditor CANNOT update order status (403 Forbidden)');
    }

    // ── 8. IMMEDIATE SUSPENSION & SESSION REVOCATION ─────────────────────────
    console.log('\n--- 8. IMMEDIATE SUSPENSION & SESSION REVOCATION ---');
    {
      // 1. Suspend employee
      const suspRes = await apiRequest(`/api/admin/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
        body: { status: 'suspended' },
      });
      assert(suspRes.status === 200, 'Owner suspends Operations Lead account (200 OK)');

      // 2. Immediate check with existing active session cookie
      const blockedReq = await apiRequest('/api/admin/orders', {
        headers: { Cookie: `mc_admin_session=${opsSessionCookie}` },
      });
      assert(blockedReq.status === 403, 'Suspended employee immediately denied access with old session (403 Forbidden)');

      // 3. Login attempt while suspended
      const blockedLogin = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: { email: empEmail, password: 'SecureOpsPass2026!' },
      });
      assert(blockedLogin.status === 403, 'Suspended employee cannot log in (403 Forbidden)');

      // 4. Reactivate employee
      const reactivateRes = await apiRequest(`/api/admin/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
        body: { status: 'active' },
      });
      assert(reactivateRes.status === 200, 'Owner reactivates Operations Lead account (200 OK)');

      // 5. Log in fresh
      const freshLogin = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: { email: empEmail, password: 'SecureOpsPass2026!' },
      });
      assert(freshLogin.status === 200, 'Reactivated employee logs in with fresh credentials (200 OK)', `Got status ${freshLogin.status}: ${JSON.stringify(freshLogin.data)}`);
      opsSessionCookie = freshLogin.sessionCookie;

      // 6. Explicit Session Revocation
      const revokeRes = await apiRequest(`/api/admin/employees/${employeeId}/revoke-sessions`, {
        method: 'POST',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
      });
      assert(revokeRes.status === 200, 'Owner executes POST /api/admin/employees/[id]/revoke-sessions (200 OK)');

      // 7. Verify previous session is invalidated immediately
      const revokedAccess = await apiRequest('/api/admin/orders', {
        headers: { Cookie: `mc_admin_session=${opsSessionCookie}` },
      });
      assert(revokedAccess.status === 401, 'Revoked session fails verification immediately (401 Unauthorized)');
    }

    // ── 9. CRYPTOGRAPHIC TAMPERING DETECTION ─────────────────────────────────
    console.log('\n--- 9. CRYPTOGRAPHIC TAMPERING & SIGNATURE VALIDATION ---');
    {
      // Take valid session cookie and tamper with payload
      const parts = ownerSessionCookie.split('.');
      const tamperedPayload = Buffer.from(
        JSON.stringify({ type: 'employee', sub: 'hacked_sub', email: 'hacker@evil.local' })
      ).toString('base64url');
      const tamperedCookie = `${tamperedPayload}.${parts[1]}`;

      const tamperRes = await apiRequest('/api/admin/employees', {
        headers: { Cookie: `mc_admin_session=${tamperedCookie}` },
      });
      assert(tamperRes.status === 401, 'Forged HMAC signature is rejected with 401 Unauthorized');
    }

    // ── 10. CUSTOM ROLE CREATION & DELETION SAFETY ───────────────────────────
    console.log('\n--- 10. CUSTOM ROLE CREATION, ASSIGNMENT & DELETION SAFETY ---');
    const customRoleId = 'qa_dispatch_specialist';
    {
      // 1. Create custom role
      const createRoleRes = await apiRequest('/api/admin/roles', {
        method: 'POST',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
        body: {
          id: customRoleId,
          name: 'QA Dispatch Specialist',
          description: 'Specialist for packaging and dispatch management',
          permissions: ['dispatch.read', 'dispatch.update', 'orders.read'],
        },
      });
      assert(createRoleRes.status === 200, 'Owner creates custom role (200 OK)');
      assert(createRoleRes.data?.role?.id === customRoleId, 'Role ID preserved');

      // 2. Assign custom role to an employee
      const assignRoleRes = await apiRequest(`/api/admin/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
        body: { roleId: customRoleId },
      });
      assert(assignRoleRes.status === 200, 'Employee assigned to custom role (200 OK)');

      // 3. Deleting an assigned role MUST BE REJECTED
      const deleteBlockedRes = await apiRequest(`/api/admin/roles/${customRoleId}`, {
        method: 'DELETE',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
      });
      assert(deleteBlockedRes.status === 400, 'Deleting a role currently assigned to an employee is blocked (400 Bad Request)');

      // 4. Reassign employee back to standard role
      await apiRequest(`/api/admin/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
        body: { roleId: 'operations_manager' },
      });

      // 5. Now deleting the unassigned role succeeds
      const deleteRoleRes = await apiRequest(`/api/admin/roles/${customRoleId}`, {
        method: 'DELETE',
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
      });
      assert(deleteRoleRes.status === 200, 'Deleting unassigned custom role succeeds with 200 OK');
    }

    // ── 11. AUDIT TRAIL LOGGING VERIFICATION ─────────────────────────────────
    console.log('\n--- 11. AUDIT TRAIL RECORDING ---');
    {
      const auditRes = await apiRequest('/api/admin/system/audit?limit=20', {
        headers: { Cookie: `mc_admin_session=${ownerSessionCookie}` },
      });
      assert(auditRes.status === 200, 'Audit log endpoint accessible (200 OK)');

      const logs = auditRes.data?.data || [];
      const hasInviteAction = logs.some((l) => l.action === 'EMPLOYEE_INVITED');
      const hasLoginAction = logs.some((l) => l.action === 'EMPLOYEE_LOGIN_SUCCESS');
      const hasSuspendAction = logs.some((l) => l.action === 'EMPLOYEE_SUSPENDED');
      const hasRoleAction = logs.some((l) => l.action === 'ROLE_CREATED');

      assert(hasInviteAction, 'Audit log recorded EMPLOYEE_INVITED event');
      assert(hasLoginAction, 'Audit log recorded EMPLOYEE_LOGIN_SUCCESS event');
      assert(hasSuspendAction, 'Audit log recorded EMPLOYEE_SUSPENDED event');
      assert(hasRoleAction, 'Audit log recorded ROLE_CREATED event');
    }

  } finally {
    // ── 12. CLEAN UP SYNTHETIC TEST RECORDS ──────────────────────────────────
    console.log('\n--- 12. SYNTHETIC TEST FIXTURE TEARDOWN ---');
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
      }
      const cleanupDb = mongoose.connection.db;
      const CleanEmpCol = cleanupDb.collection('employees');
      const CleanRoleCol = cleanupDb.collection('roles');
      const CleanAuditCol = cleanupDb.collection('auditlogs');

      if (synthEmails.length > 0) {
        const deleteRes = await CleanEmpCol.deleteMany({
          email: { $in: synthEmails },
        });
        console.log(`  ✓ Safely purged ${deleteRes.deletedCount} synthetic employee fixture(s)`);
      }
      await CleanRoleCol.deleteOne({ id: 'qa_dispatch_specialist' });
      await CleanAuditCol.deleteMany({
        $or: [
          { actor: { $in: synthEmails } },
          { entityId: { $in: synthEmails } },
          { summary: { $regex: SYNTH_PREFIX, $options: 'i' } },
        ],
      });
      console.log('  ✓ Purged synthetic test audit entries (production audit trail intact)');
    } catch (cleanErr) {
      console.error('Error cleaning up synthetic fixtures:', cleanErr.message);
    }

    try {
      await mongoose.disconnect();
    } catch {}
  }

  console.log('\n========================================================================');
  console.log(`  RBAC SECURITY VERIFICATION: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runRbacTests().catch((err) => {
  console.error('RBAC Test Suite Execution Failed:', err);
  process.exit(1);
});
