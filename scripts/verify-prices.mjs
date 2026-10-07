import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('./scripts/catalog-dump.json', 'utf8'));

console.log(`Verifying all ${dump.length} products from /api/products...`);

const withPrice = dump.filter(p => p.price > 0 && !p.priceOnRequest);
const withPOR = dump.filter(p => p.priceOnRequest || p.price === 0);

console.log(`\nProducts with active numeric selling price: ${withPrice.length}`);
withPrice.forEach(p => {
  console.log(`  - [${p.id}] "${p.name}": ₹${p.price.toLocaleString('en-IN')}${p.originalPrice ? ` (MRP: ₹${p.originalPrice.toLocaleString('en-IN')})` : ''}`);
});

console.log(`\nProducts with Price on Request: ${withPOR.length}`);
withPOR.forEach(p => {
  console.log(`  - [${p.id}] "${p.name}": price=${p.price}, priceOnRequest=${p.priceOnRequest}`);
});
