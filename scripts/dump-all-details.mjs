import fs from 'fs';

const products = JSON.parse(fs.readFileSync('scripts/catalog-dump.json', 'utf8'));

console.log('Mapping all 50 products details:');
products.forEach((p, i) => {
  console.log(`[${i+1}] ID: ${p.id}`);
  console.log(`    Name: ${p.name}`);
  console.log(`    SciName: ${p.scientificName || 'None'}`);
  console.log(`    Brand: ${p.brand || 'None'}`);
  console.log(`    Cat: ${p.category} | Label: ${p.categoryLabel}`);
  console.log(`    Specs: ${JSON.stringify(p.specifications || {})}`);
  console.log(`    Care: ${p.careGuide ? `Temp: ${p.careGuide.temperature}, Tank: ${p.careGuide.minimumTankSize}, Diet: ${p.careGuide.diet}` : 'None'}`);
  console.log(`    Install: ${p.installationGuide ? `Diff: ${p.installationGuide.difficulty}, Mount: ${p.installationGuide.mountingType}` : 'None'}`);
  console.log(`    Research: ${p.researchStatus} | Image: ${p.imageStatus} (${p.images?.[0] || 'No Image'})`);
  console.log('');
});
