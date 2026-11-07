import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function search() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const prods = await db.collection('products').find({
    $or: [
      { name: { $regex: /flora|nemo|e-series|light/i } },
      { id: { $regex: /flora|nemo|e-series|light/i } },
      { category: { $regex: /light/i } },
    ]
  }).toArray();

  console.log('--- MATCHED LIGHTING PRODUCTS IN MONGO (' + prods.length + ') ---');
  prods.forEach(p => {
    console.log(JSON.stringify({
      _id: p._id,
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      variants: p.variants,
      models: p.models,
      specs: p.specs,
      specifications: p.specifications
    }, null, 2));
  });

  await mongoose.disconnect();
}

search().catch(console.error);

