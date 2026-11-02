import fs from 'fs';
import mongoose from 'mongoose';

const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/MONGODB_URI=(.*)/);
const uri = match[1].trim().replace(/^['"]|['"]$/g, '');

async function main() {
  await mongoose.connect(uri);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const p = await Product.findOne({ id: 're-ocean-mini-60' }).lean();
  console.log('=== PRODUCT re-ocean-mini-60 IN DATABASE ===');
  if (p) {
    console.log(JSON.stringify(p, null, 2));
  } else {
    console.log('Product not found! Searching by regex...');
    const list = await Product.find({ id: /re-ocean/i }).lean();
    console.log('Found:', list.map(x => ({ id: x.id, name: x.name })));
  }

  // Also check Media collection if one exists!
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n=== DATABASE COLLECTIONS ===');
  console.log(collections.map(c => c.name));

  const Media = mongoose.model('Media', new mongoose.Schema({}, { strict: false }));
  try {
    const mediaCount = await Media.countDocuments();
    console.log('\nMedia collection count:', mediaCount);
    const mediaItems = await Media.find({}).limit(5).lean();
    console.log('Sample media items:', mediaItems);
  } catch (err) {
    console.log('Media query error:', err.message);
  }

  await mongoose.disconnect();
}

main().catch(console.error);

