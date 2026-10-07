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
  // Get active products in order
  const dbProducts = await collection.find({ isArchived: { $ne: true } }).toArray();

  console.log(`Fetched ${dbProducts.length} active products from MongoDB.`);

  let content = fs.readFileSync('./lib/data/products.ts', 'utf8');

  // Ensure interface has compareAtPrice
  if (!content.includes('compareAtPrice?: number;')) {
    content = content.replace(
      /price:\s*number;/,
      'price: number;\n  compareAtPrice?: number;'
    );
  }

  // Update each product block with compareAtPrice if it exists
  const productMap = new Map(dbProducts.map(p => [p.id, p]));

  for (const [id, p] of productMap.entries()) {
    // Regex to match the price line for this product
    const idBlockRegex = new RegExp(`(id:\\s*['"]${id}['"][^]*?price:\\s*\\d+,\\s*\\r?\\n)`);
    const match = content.match(idBlockRegex);
    if (match) {
      let replacement = match[1];
      // Ensure compareAtPrice is present if p.compareAtPrice is set
      if (p.compareAtPrice && !match[1].includes('compareAtPrice:')) {
        replacement = match[1] + `    compareAtPrice: ${p.compareAtPrice},\n`;
      }
      if (replacement !== match[1]) {
        content = content.replace(match[1], replacement);
        console.log(`Added compareAtPrice to ${id} in products.ts: ₹${p.compareAtPrice}`);
      }
    }
  }

  fs.writeFileSync('./lib/data/products.ts', content, 'utf8');
  console.log('Successfully updated lib/data/products.ts');

  await mongoose.disconnect();
}

main().catch(console.error);
