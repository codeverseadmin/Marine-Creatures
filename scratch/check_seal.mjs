import fs from 'fs';
import mongoose from 'mongoose';

const envContent = fs.readFileSync('.env.local', 'utf8');
const MONGODB_URI = envContent.match(/MONGODB_URI=(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');

async function run() {
  await mongoose.connect(MONGODB_URI);
  const seal = await mongoose.connection.collection('settings').findOne({ key: 'security.bootstrap_sealed' });
  console.log('SEAL IN DB:', seal);
  await mongoose.disconnect();
}
run();

