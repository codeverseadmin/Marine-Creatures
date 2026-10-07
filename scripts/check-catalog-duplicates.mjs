import fs from 'fs';
import mongoose from 'mongoose';

const envFile = fs.readFileSync('.env.local', 'utf8');
let MONGODB_URI = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('MONGODB_URI=')) {
    MONGODB_URI = line.replace('MONGODB_URI=', '').trim();
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const collection = mongoose.connection.db.collection('products');
  const allProducts = await collection.find({}).toArray();

  console.log(`Total products in MongoDB collection: ${allProducts.length}`);

  // Check for duplicate names or slugs
  const slugs = {};
  const names = {};
  allProducts.forEach(p => {
    slugs[p.id] = (slugs[p.id] || 0) + 1;
    names[p.name.toLowerCase().trim()] = (names[p.name.toLowerCase().trim()] || 0) + 1;
  });

  console.log('Duplicate slugs:', Object.entries(slugs).filter(([_, count]) => count > 1));
  console.log('Duplicate names:', Object.entries(names).filter(([_, count]) => count > 1));

  // Check JTP-3800 products
  const jtp3800Matches = allProducts.filter(p => 
    p.id.includes('3800') || p.name.includes('3800') || (p.description && p.description.includes('3800'))
  );
  console.log(`\nJTP-3800 matching records: ${jtp3800Matches.length}`);
  jtp3800Matches.forEach(p => console.log(`  - [${p.id}] "${p.name}" (archived: ${p.isArchived})`));

  // Check Refractometer products
  const refractometerMatches = allProducts.filter(p => 
    p.id.toLowerCase().includes('refractometer') || p.name.toLowerCase().includes('refractometer')
  );
  console.log(`\nRefractometer matching records: ${refractometerMatches.length}`);
  refractometerMatches.forEach(p => console.log(`  - [${p.id}] "${p.name}" (archived: ${p.isArchived})`));

  // Check Nemo products
  const nemoMatches = allProducts.filter(p => 
    p.id.toLowerCase().includes('nemo') || p.name.toLowerCase().includes('nemo')
  );
  console.log(`\nNemo matching records: ${nemoMatches.length}`);
  nemoMatches.forEach(p => console.log(`  - [${p.id}] "${p.name}" (archived: ${p.isArchived})`));

  await mongoose.disconnect();
}

main().catch(console.error);
