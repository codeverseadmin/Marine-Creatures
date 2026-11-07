import fs from 'fs';
import mongoose from 'mongoose';

const envContent = fs.readFileSync('.env.local', 'utf8');
const MONGODB_URI = envContent.match(/MONGODB_URI=(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');

async function run() {
  await mongoose.connect(MONGODB_URI);
  const total = await mongoose.connection.collection('products').countDocuments({});
  const active = await mongoose.connection.collection('products').countDocuments({ isArchived: { $ne: true } });
  const archived = await mongoose.connection.collection('products').countDocuments({ isArchived: true });
  console.log({ total, active, archived });
  await mongoose.disconnect();
}
run();

