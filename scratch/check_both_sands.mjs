import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function check() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const p1 = await db.collection('products').findOne({ id: 'blue-treasure-coral-sand' });
  const p2 = await db.collection('products').findOne({ id: 'blue-treasure-calcium-sand-2' });

  console.log('blue-treasure-coral-sand:', Boolean(p1), p1?._id, p1?.name);
  console.log('blue-treasure-calcium-sand-2:', Boolean(p2), p2?._id, p2?.name);

  // Search any other products with 'calcium' or 'sand' in id
  const sands = await db.collection('products').find({ id: { $regex: /sand/i } }).toArray();
  console.log('All sands in MongoDB:');
  sands.forEach(s => console.log(' -', s.id, '|', s.name, '| _id:', s._id));

  await mongoose.disconnect();
}
check().catch(console.error);

