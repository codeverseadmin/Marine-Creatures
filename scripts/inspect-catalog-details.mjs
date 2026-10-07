import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('./scripts/catalog-dump.json', 'utf8'));
console.log(`Analyzing ${dump.length} active products from scripts/catalog-dump.json:\n`);

dump.forEach((p, idx) => {
  console.log(`[${idx + 1}] ID: ${p.id}`);
  console.log(`    Name: ${p.name}`);
  console.log(`    Brand: ${p.brand || 'None'}`);
  console.log(`    Category: ${p.category} (${p.categoryLabel})`);
  console.log(`    Price: ${p.price} | OrigPrice: ${p.originalPrice || 'None'} | PriceOnRequest: ${p.priceOnRequest}`);
  if (p.variants && p.variants.length > 0) {
    console.log(`    Variants: ${p.variants.map(v => `${v.name} (${JSON.stringify(v.specs || {})})`).join('; ')}`);
  }
  console.log('');
});
