import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { PRODUCTS } from '../lib/data/products.ts';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function check() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const mongoProds = await db.collection('products').find({
    variants: { $exists: true, $ne: [] }
  }).toArray();

  console.log('--- PRODUCTS WITH VARIANTS IN MONGO ---');
  mongoProds.forEach(p => console.log(p.id, p.name, p.variants.map(v => ({ id: v.id, price: v.price }))));

  console.log('\n--- PRODUCTS WITH VARIANTS IN PRODUCTS.TS ---');
  PRODUCTS.filter(p => p.variants && p.variants.length > 0).forEach(p => console.log(p.id, p.name, p.variants.map(v => ({ id: v.id, price: v.price }))));

  await mongoose.disconnect();
}
check().catch(console.error);
