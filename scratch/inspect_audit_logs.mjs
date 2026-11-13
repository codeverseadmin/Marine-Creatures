import fs from 'fs';
import mongoose from 'mongoose';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log('=== AUDIT LOGS (last 20) ===');
  const auditLogs = await db.collection('audit_logs').find({}).sort({ timestamp: -1, _id: -1 }).limit(20).toArray();
  auditLogs.forEach((l) => {
    console.log({
      action: l.action,
      summary: l.summary,
      timestamp: l.timestamp,
      details: l.details,
    });
  });

  const auditLogsAlt = await db.collection('auditlogs').find({}).sort({ timestamp: -1, _id: -1 }).limit(20).toArray();
  if (auditLogsAlt.length > 0) {
    console.log('\n=== AUDITLOGS ALT ===');
    auditLogsAlt.forEach((l) => {
      console.log({
        action: l.action,
        summary: l.summary,
        timestamp: l.timestamp,
      });
    });
  }

  await mongoose.disconnect();
}
run();

