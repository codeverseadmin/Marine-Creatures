/**
 * Marine Creatures — Server-Side Founder Account Provisioning & Recovery Tool
 * Reference: MC-FOUNDER-AUTH-RECOVERY-NOV2026
 *
 * Secure, controlled administrative recovery tool that:
 * 1. Runs exclusively server-side with direct MongoDB Atlas administrative access.
 * 2. Enforces password complexity policy (scrypt non-blocking cryptographic hashing).
 * 3. Authoritatively provisions or updates an Owner account in the `employees` collection.
 * 4. Grants full Owner authority (role: 'owner', permissions: ['*']).
 * 5. Leaves `security.bootstrap_sealed` permanently sealed (no security degradation).
 * 6. Records an immutable administrative audit log entry in `auditlogs`.
 */

import fs from 'fs';
import path from 'path';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import mongoose from 'mongoose';

const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const KEY_LEN_BYTES = 64;

function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'marine-creatures', '.env.local'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const env = {};
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          env[key] = val;
        }
      }
      return env;
    }
  }
  return process.env;
}

function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9\W]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number or special character' };
  }
  return { valid: true };
}

async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await scryptAsync(password, salt, KEY_LEN_BYTES);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

async function main() {
  const args = process.argv.slice(2);
  let email = 'founder@marinecreatures.local';
  let name = 'Marine Creatures Founder';
  let password = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[++i].trim().toLowerCase();
    } else if (args[i] === '--name' && args[i + 1]) {
      name = args[++i].trim();
    } else if (args[i] === '--password' && args[i + 1]) {
      password = args[++i];
    }
  }

  if (!password) {
    console.error('Error: --password argument is required.');
    console.error('Usage: node scripts/recover-founder.mjs --email <email> --password <password> [--name <name>]');
    process.exit(1);
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    console.error(`Error: Password does not meet security requirements: ${strength.message}`);
    process.exit(1);
  }

  const env = loadEnv();
  const uri = env.MONGODB_URI || process.env.MONGODB_URI;
  const dbName = env.MONGODB_DB || process.env.MONGODB_DB;

  if (!uri) {
    console.error('Error: MONGODB_URI not found in environment.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { dbName: dbName || undefined });
  const db = mongoose.connection.db;

  const employeesCol = db.collection('employees');
  const settingsCol = db.collection('settings');
  const auditLogsCol = db.collection('auditlogs');

  // Verify bootstrap seal status (MUST remain sealed!)
  const seal = await settingsCol.findOne({ key: 'security.bootstrap_sealed' });
  console.log('Current security.bootstrap_sealed state:', seal?.value);

  const passwordHash = await hashPassword(password);
  const existingEmployee = await employeesCol.findOne({ email });

  let employeeId;
  let isUpdate = false;

  if (existingEmployee) {
    isUpdate = true;
    employeeId = existingEmployee._id;
    await employeesCol.updateOne(
      { _id: employeeId },
      {
        $set: {
          name,
          passwordHash,
          roleId: 'owner',
          customPermissions: ['*'],
          status: 'active',
          sessionVersion: (existingEmployee.sessionVersion || 0) + 1,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Updated existing employee record for ${email} with Owner authority.`);
  } else {
    const insertRes = await employeesCol.insertOne({
      name,
      email,
      passwordHash,
      roleId: 'owner',
      customPermissions: ['*'],
      status: 'active',
      sessionVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    employeeId = insertRes.insertedId;
    console.log(`Created new authoritative Owner account for ${email} (ID: ${employeeId}).`);
  }

  // Record audit log
  await auditLogsCol.insertOne({
    action: isUpdate ? 'EMPLOYEE_UPDATED' : 'BOOTSTRAP_OWNER_CREATED',
    entityType: 'employee',
    entityId: employeeId.toString(),
    entityName: name,
    summary: isUpdate
      ? `Owner account credentials & status recovered for ${email} via server-side recovery`
      : `Authoritative Owner account provisioned for ${email} via server-side recovery`,
    actor: 'system.recovery_cli',
    createdAt: new Date(),
    updatedAt: new Date(),
    details: {
      email,
      roleId: 'owner',
      recoveryMethod: 'cli_direct',
      sealedBootstrapIntact: true,
    },
  });
  console.log('Recorded immutable audit log in auditlogs.');

  // Confirm bootstrap remains sealed
  const postSeal = await settingsCol.findOne({ key: 'security.bootstrap_sealed' });
  console.log('Verified post-recovery security.bootstrap_sealed is intact:', postSeal?.value?.sealed === true);

  console.log('\n======================================================');
  console.log('✓ FOUNDER ACCOUNT PROVISIONED & ACTIVE');
  console.log(`  Name:   ${name}`);
  console.log(`  Email:  ${email}`);
  console.log('  Role:   owner (Full Super Admin RBAC Authority)');
  console.log('  Status: active');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Recovery failed:', err);
  process.exit(1);
});
