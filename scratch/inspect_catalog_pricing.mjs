import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local'))
  ? path.resolve(process.cwd(), '.env.local')
  : path.resolve(process.cwd(), 'marine-creatures', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function check() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const prods = await db.collection('products').find({}).toArray();
  console.log(`Total MongoDB products: ${prods.length}`);

  const withVariants = prods.filter(p => p.variants && p.variants.length > 0);
  console.log(`Products with variants: ${withVariants.length}`);
  for (const p of withVariants) {
    console.log(`- ${p.id} (${p.name}): base price=${p.price}`);
    p.variants.forEach(v => console.log(`    variant: id=${v.id}, name="${v.name}", price=${v.price}, sku=${v.sku}`));
  }

  const porProducts = prods.filter(p => p.priceOnRequest);
  console.log(`\nPOR products: ${porProducts.length}`);
  for (const p of porProducts) {
    console.log(`- ${p.id} (${p.name}): priceOnRequest=${p.priceOnRequest}`);
  }

  await mongoose.disconnect();
}

check().catch(console.error);

