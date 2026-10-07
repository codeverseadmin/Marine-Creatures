import fs from 'fs';

// Read docs/catalog_backup_pre_reconciliation.json
const backup = JSON.parse(fs.readFileSync('./docs/catalog_backup_pre_reconciliation.json', 'utf8'));
const dbProducts = backup.data || backup;

console.log(`Loaded ${dbProducts.length} products from backup.`);

dbProducts.forEach((p, index) => {
  console.log(`${index + 1}. [${p.id}] "${p.name}" | Brand: ${p.brand || 'N/A'} | Price: ${p.price} | Orig: ${p.originalPrice || 'N/A'} | PoR: ${p.priceOnRequest}`);
});
