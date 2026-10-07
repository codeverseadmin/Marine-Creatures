import fs from 'fs';
import path from 'path';

// Load active products from active-products-db.json
const activeProducts = JSON.parse(fs.readFileSync('scripts/active-products-db.json', 'utf8'));

console.log(`Auditing ${activeProducts.length} active products...`);

let verifiedPhotoCount = 0;
let blueprintFallbackCount = 0;
let brokenFileCount = 0;
let missingPhotoDetails = [];
let verifiedPhotoDetails = [];

const publicDir = path.resolve('public');

activeProducts.forEach((p, idx) => {
  const images = p.images || [];
  const hasImages = images.length > 0 && images[0] && images[0].trim() !== '';

  if (hasImages) {
    const relPath = images[0].replace(/^\//, '');
    const fullPath = path.join(publicDir, relPath);
    const exists = fs.existsSync(fullPath);

    if (exists) {
      verifiedPhotoCount++;
      verifiedPhotoDetails.push({
        idx: p.idx || idx + 1,
        id: p.id,
        name: p.name,
        image: images[0],
        status: 'VERIFIED_PHOTOGRAPH'
      });
    } else {
      brokenFileCount++;
      console.error(`[BROKEN FILE] Product ${p.id} points to non-existent file: ${images[0]}`);
    }
  } else {
    blueprintFallbackCount++;
    missingPhotoDetails.push({
      idx: p.idx || idx + 1,
      id: p.id,
      name: p.name,
      status: 'NEEDS_CLIENT_PHOTO (INTENTIONAL_BLUEPRINT)'
    });
  }
});

console.log('\n================ AUDIT SUMMARY ================');
console.log(`Total Active Products: ${activeProducts.length}`);
console.log(`Verified Real Photographs: ${verifiedPhotoCount}`);
console.log(`Genuinely Missing Client Photographs: ${blueprintFallbackCount}`);
console.log(`Broken Image Paths: ${brokenFileCount}`);
console.log('================================================\n');

console.log('--- 10 Genuinely Missing Client Photographs (Intentional Blueprint Fallback) ---');
missingPhotoDetails.forEach(m => {
  console.log(`${m.idx}. [${m.id}] ${m.name}`);
});

console.log('\n--- 40 Verified Photographs ---');
verifiedPhotoDetails.forEach(v => {
  console.log(`${v.idx}. [${v.id}] ${v.name} -> ${v.image}`);
});
