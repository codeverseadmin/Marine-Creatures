import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function cleanAndCheck() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const res = await db.collection('employees').deleteMany({ email: { $regex: /marinecreatures\.local$/ } });
  console.log('Cleaned test employees:', res.deletedCount);

  const emps = await db.collection('employees').find({}).project({ name: 1, email: 1, roleId: 1, status: 1 }).toArray();
  console.log('REMAINING EMPLOYEES:', JSON.stringify(emps, null, 2));

  const seal = await db.collection('settings').findOne({ key: 'security.bootstrap_sealed' });
  console.log('SEAL:', JSON.stringify(seal, null, 2));

  await mongoose.disconnect();
}
cleanAndCheck().catch(console.error);
