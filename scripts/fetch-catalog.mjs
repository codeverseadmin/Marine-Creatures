import fs from 'fs';

async function main() {
  const res = await fetch('http://localhost:3000/api/products');
  const json = await res.json();
  const products = json.data;

  console.log(`Fetched ${products.length} products from /api/products (MongoDB Atlas)`);

  const activeProducts = products.filter(p => !p.isArchived);
  console.log(`Active products: ${activeProducts.length}`);
  const archivedProducts = products.filter(p => p.isArchived);
  console.log(`Archived products: ${archivedProducts.length}`);

  // Summary by category
  const categories = {};
  for (const p of activeProducts) {
    categories[p.category] = (categories[p.category] || 0) + 1;
  }
  console.log('Categories breakdown:', categories);

  // Summary by itemType
  const itemTypes = {};
  for (const p of activeProducts) {
    itemTypes[p.itemType] = (itemTypes[p.itemType] || 0) + 1;
  }
  console.log('ItemType breakdown:', itemTypes);

  // Summary of researchStatus
  const researchStatuses = {};
  for (const p of activeProducts) {
    researchStatuses[p.researchStatus || 'NONE'] = (researchStatuses[p.researchStatus || 'NONE'] || 0) + 1;
  }
  console.log('Research status breakdown:', researchStatuses);

  // Summary of imageStatus
  const imageStatuses = {};
  for (const p of activeProducts) {
    imageStatuses[p.imageStatus || 'NONE'] = (imageStatuses[p.imageStatus || 'NONE'] || 0) + 1;
  }
  console.log('Image status breakdown:', imageStatuses);

  // Write full catalog json dump for easy processing
  fs.writeFileSync('scripts/catalog-dump.json', JSON.stringify(activeProducts, null, 2));
  console.log('Catalog dump written to scripts/catalog-dump.json');
}

main().catch(console.error);
