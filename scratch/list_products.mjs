import fs from 'fs';
import mongoose from 'mongoose';

const envContent = fs.readFileSync('.env.local', 'utf8');
const MONGODB_URI = envContent.match(/MONGODB_URI=(.+)/)[1].trim().replace(/^['"]|['"]$/g, '');

async function run() {
  await mongoose.connect(MONGODB_URI);
  const prods = await mongoose.connection.collection('products').find({}).project({ id: 1, category: 1, name: 1 }).toArray();
  console.log('Total in DB:', prods.length);
  const byCat = {};
  for (const p of prods) {
    if (!byCat[p.category]) byCat[p.category] = [];
    byCat[p.category].push({ id: p.id, name: p.name });
  }
  for (const cat in byCat) {
    console.log(`\nCategory [${cat}] (${byCat[cat].length}):`);
    console.log(byCat[cat].slice(0, 5));
  }
  await mongoose.disconnect();
}
run();

