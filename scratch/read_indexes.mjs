import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/MONGODB_URI=(.*)/);
const uri = match ? match[1].trim() : process.env.MONGODB_URI;

await mongoose.connect(uri);
const db = mongoose.connection.db;

const collections = await db.listCollections().toArray();
console.log('Collections in database:', collections.map(c => c.name));

for (const name of ['product_reviews', 'review_invitations', 'media', 'orders', 'products']) {
  const collExists = collections.some(c => c.name === name);
  if (collExists) {
    const indexes = await db.collection(name).indexes();
    console.log(`\nIndexes for [${name}]:`, JSON.stringify(indexes, null, 2));
  } else {
    console.log(`\nCollection [${name}] does not exist yet.`);
  }
}

await mongoose.disconnect();

