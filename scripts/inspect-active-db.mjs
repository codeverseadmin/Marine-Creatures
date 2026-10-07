import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

function getMongoUri() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split(/\r?\n/)) {
    if (line.startsWith('MONGODB_URI=')) {
      return line.substring('MONGODB_URI='.length).trim();
    }
  }
  return process.env.MONGODB_URI;
}

async function inspectActive() {
  const uri = getMongoUri();
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const allProducts = await db.collection('products').find({}).toArray();
  const activeProducts = await db.collection('products').find({ isArchived: { $ne: true } }).toArray();

  console.log('Total in collection:', allProducts.length);
  console.log('Active in collection (isArchived != true):', activeProducts.length);

  const activeList = activeProducts.map((p, idx) => ({
    idx: idx + 1,
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    images: p.images,
    imageStatus: p.imageStatus,
    isArchived: p.isArchived
  }));

  console.log('\n--- Active Products List ---');
  activeList.forEach(p => {
    console.log(`${p.idx}. [${p.id}] "${p.name}" | images: ${JSON.stringify(p.images)} | status: ${p.imageStatus}`);
  });

  fs.writeFileSync('scripts/active-products-db.json', JSON.stringify(activeList, null, 2));
  console.log('\nWritten to scripts/active-products-db.json');

  await mongoose.disconnect();
}

inspectActive().catch(console.error);
