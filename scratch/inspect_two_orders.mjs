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
  const o1 = await db.collection('orders').findOne({ id: 'MC-1794581839870-FF732139F3BAF0B9232D515CD1CF6635' });
  const o2 = await db.collection('orders').findOne({ id: 'MC-1794581162176-168DFF950B636833CE6514C166F77BF4' });
  console.log('Order 1:');
  console.log(JSON.stringify(o1, null, 2));
  console.log('\nOrder 2:');
  console.log(JSON.stringify(o2, null, 2));
  await mongoose.disconnect();
}
run();

