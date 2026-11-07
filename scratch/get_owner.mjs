import fs from 'fs';
import mongoose from 'mongoose';

const envContent = fs.readFileSync('.env.local', 'utf8');
const MONGODB_URI = envContent.match(/MONGODB_URI=(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');

async function run() {
  await mongoose.connect(MONGODB_URI);
  const emps = await mongoose.connection.collection('employees').find({}).toArray();
  console.log(JSON.stringify(emps.map(e => ({ id: e.id, email: e.email, roleId: e.roleId, status: e.status, sessionVersion: e.sessionVersion })), null, 2));
  await mongoose.disconnect();
}
run();

