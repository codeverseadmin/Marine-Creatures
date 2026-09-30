import fs from 'fs';

const products = JSON.parse(fs.readFileSync('scripts/catalog-dump.json', 'utf8'));

console.log(`Total active products: ${products.length}\n`);

const productList = products.map((p, idx) => ({
  index: idx + 1,
  id: p.id,
  name: p.name,
  brand: p.brand || 'Unbranded / Custom',
  category: p.category,
  categoryLabel: p.categoryLabel,
  itemType: p.itemType,
  scientificName: p.scientificName || 'N/A',
  priceOnRequest: p.priceOnRequest !== false,
  researchStatus: p.researchStatus,
  imageStatus: p.imageStatus,
  hasImage: !!(p.images && p.images.length > 0),
  imageFile: p.images?.[0] || 'NONE',
  specsCount: Object.keys(p.specifications || {}).length,
  hasCareGuide: !!p.careGuide,
  hasInstallationGuide: !!p.installationGuide,
  variantsCount: p.variants?.length || 0,
}));

console.log(JSON.stringify(productList, null, 2));

// Summary of 9 products needing review / media asset:
const needsReview = products.filter(p => p.researchStatus === 'NEEDS_REVIEW' || p.imageStatus === 'NEEDS_MEDIA_ASSET');
console.log('\n=== PRODUCTS WITH NEEDS_REVIEW / NEEDS_MEDIA_ASSET (9 items) ===');
needsReview.forEach(p => {
  console.log(`- ${p.id}: "${p.name}" (Brand: ${p.brand || 'None'}, Category: ${p.category})`);
});
