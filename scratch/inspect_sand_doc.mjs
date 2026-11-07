import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function inspectDoc() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const doc = await db.collection('products').findOne({
    $or: [
      { id: 'blue-treasure-coral-sand' },
      { id: { $regex: /blue-treasure.*sand/i } },
      { name: { $regex: /blue treasure.*sand/i } },
    ]
  });

  console.log('--- FOUND DOCUMENT IN MONGO ---');
  console.log(JSON.stringify(doc, null, 2));

  await mongoose.disconnect();
}
inspectDoc().catch(console.error);

