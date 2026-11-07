import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch[1].trim().replace(/^["']|["']$/g, '');

async function inspect() {
  await mongoose.connect(MONGODB_URI);
  const products = await mongoose.connection.collection('products').find({
    $or: [
      { id: /blue-treasure/i },
      { name: /blue treasure/i }
    ]
  }).toArray();
  console.log('Found', products.length, 'products:');
  for (const p of products) {
    console.log({
      _id: p._id.toString(),
      id: p.id,
      name: p.name,
      slug: p.slug,
      canonicalOverride: p.canonicalOverride,
      sku: p.sku,
      category: p.category,
      price: p.price,
      variantsCount: p.variants?.length,
      imagesCount: p.images?.length
    });
  }
  const media = await mongoose.connection.collection('media').find({
    productId: /blue-treasure/i
  }).toArray();
  console.log('Found', media.length, 'media items linked to blue-treasure:');
  for (const m of media) {
    console.log({ id: m.id, productId: m.productId, filename: m.filename, contentType: m.contentType });
  }
  await mongoose.disconnect();
}
inspect().catch(console.error);
