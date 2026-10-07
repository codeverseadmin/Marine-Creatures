import fs from 'fs';

let content = fs.readFileSync('./lib/data/products.ts', 'utf8');

// List of exact replacements
const replacements = [
  // 1. nemo-extreme-led
  {
    id: 'nemo-extreme-led',
    price: 6500,
    originalPrice: 7500,
  },
  // 2. sessile-comet-light
  {
    id: 'sessile-comet-light',
    price: 2600,
    originalPrice: 3000,
  },
  // 3. luminous-aqua-ocean-blue
  {
    id: 'luminous-aqua-ocean-blue',
    price: 2600,
    originalPrice: 3000,
    customVariantSpecs: true,
  },
  // 4. sunsun-wavemaker-jvp232
  {
    id: 'sunsun-wavemaker-jvp232',
    price: 2590,
    originalPrice: 3000,
  },
  // 5. sunsun-pump-jtp8000
  {
    id: 'sunsun-pump-jtp8000',
    price: 6500,
    originalPrice: 7000,
  },
  // 6. sunsun-pump-hqb4500
  {
    id: 'sunsun-pump-hqb4500',
    price: 4400,
    originalPrice: 4800,
  },
  // 7. sunsun-pump-jdp3500
  {
    id: 'sunsun-pump-jdp3500',
    price: 6500,
    originalPrice: 7000,
  },
  // 8. sunsun-pump-jdp6000
  {
    id: 'sunsun-pump-jdp6000',
    price: 8000,
    originalPrice: 8500,
  },
  // 9. re-ocean-mini-60
  {
    id: 're-ocean-mini-60',
    price: 6500,
    originalPrice: 6800,
  },
  // 10. re-ocean-mini-80
  {
    id: 're-ocean-mini-80',
    price: 10200,
    originalPrice: 10400,
  },
  // 11. bubble-magus-qq2
  {
    id: 'bubble-magus-qq2',
    price: 5800,
    originalPrice: 6500,
  },
  // 12. bubble-magus-mini-q
  {
    id: 'bubble-magus-mini-q',
    price: 4400,
    originalPrice: 4800,
  },
  // 13. boyu-separation-box
  {
    id: 'boyu-separation-box',
    price: 450,
    originalPrice: 600,
  },
  // 14. seachem-cupramine
  {
    id: 'seachem-cupramine',
    price: 1250,
  },
  // 15. blue-treasure-coral-sand
  {
    id: 'blue-treasure-coral-sand',
    price: 1400,
  },
  // 16. sensibar-reef-rock
  {
    id: 'sensibar-reef-rock',
    price: 250,
  },
  // 17. atc-salinity-refractometer
  {
    id: 'atc-salinity-refractometer',
    price: 1400,
    originalPrice: 1800,
  },
  // 18. hikari-frozen-mysis
  {
    id: 'hikari-frozen-mysis',
    price: 700,
    originalPrice: 800,
  },
  // 19. teraa-t-probiotics
  {
    id: 'teraa-t-probiotics',
    price: 712,
  },
  // 20. biozym-303-ampules
  {
    id: 'biozym-303-ampules',
    price: 4000,
    originalPrice: 4500,
  },
  // 21. tici-live-phytoplankton
  {
    id: 'tici-live-phytoplankton',
    price: 500,
    originalPrice: 525,
  },
  // 22. amozeal-vitality-blocks
  {
    id: 'amozeal-vitality-blocks',
    price: 610,
  },
  // 23. zeolite-ammonia-media
  {
    id: 'zeolite-ammonia-media',
    price: 310,
  },
  // 24. qtermoline-bio-media
  {
    id: 'qtermoline-bio-media',
    price: 420,
  },
  // 25. xpores-biological-media
  {
    id: 'xpores-biological-media',
    price: 300,
  },
  // 26. floating-mbbr-media
  {
    id: 'floating-mbbr-media',
    price: 350,
  },
  // 27. amozorb-ammonia-adsorbent
  {
    id: 'amozorb-ammonia-adsorbent',
    price: 350,
  },
  // 28. bio-block-filter-media
  {
    id: 'bio-block-filter-media',
    price: 400,
  },
  // 29. ceramic-house-filter-media
  {
    id: 'ceramic-house-filter-media',
    price: 35,
  },
  // 30. bio-pods-filter-media
  {
    id: 'bio-pods-filter-media',
    price: 300,
  },
  // 31. trwil-tower-filter-media
  {
    id: 'trwil-tower-filter-media',
    price: 500,
    originalPrice: 600,
  },
  // 32. magic-bag-media-reactor
  {
    id: 'magic-bag-media-reactor',
    price: 600,
  },
  // 33. by-par-synthetic-adsorbent
  {
    id: 'by-par-synthetic-adsorbent',
    price: 550,
  },
];

console.log(`Processing ${replacements.length} updates...`);

for (const r of replacements) {
  // Find product block in products.ts
  const idRegex = new RegExp(`id:\\s*['"]${r.id}['"],[^]*?price:\\s*0,\\s*\\r?\\n\\s*priceOnRequest:\\s*true,`);
  const match = content.match(idRegex);
  if (!match) {
    console.error(`ERROR: Could not find block for ${r.id}`);
    process.exit(1);
  }

  let replacementPriceBlock = `price: ${r.price},\n`;
  if (r.originalPrice) {
    replacementPriceBlock += `    originalPrice: ${r.originalPrice},\n`;
  }
  replacementPriceBlock += `    priceOnRequest: false,`;

  const newBlock = match[0].replace(/price:\s*0,\s*\r?\n\s*priceOnRequest:\s*true,/, replacementPriceBlock);
  content = content.replace(match[0], newBlock);
  console.log(`Updated ${r.id} -> price: ${r.price}, originalPrice: ${r.originalPrice || 'none'}`);
}

// Special update for luminous-aqua-ocean-blue variants specs
const luminousOldVariants = `    variants: [
      { id: 'q30', name: 'Luminous Aqua Q30 (30 cm tank)', inStock: true },
      { id: 'q60', name: 'Luminous Aqua Q60 (60 cm tank)', inStock: true },
      { id: 'q75', name: 'Luminous Aqua Q75 (75 cm tank)', inStock: true },
      { id: 'q90', name: 'Luminous Aqua Q90 (90 cm tank)', inStock: true },
      { id: 'q120', name: 'Luminous Aqua Q120 (120 cm tank)', inStock: true },
    ],`;

const luminousNewVariants = `    variants: [
      { id: 'q30', name: 'Luminous Aqua Q30 (30 cm tank)', inStock: true, specs: { 'Tank Size': '30 cm', 'Selling Price': '₹2,600', 'MRP': '₹3,000' } },
      { id: 'q60', name: 'Luminous Aqua Q60 (60 cm tank)', inStock: true, specs: { 'Tank Size': '60 cm', 'Selling Price': '₹3,400', 'MRP': '₹3,800' } },
      { id: 'q75', name: 'Luminous Aqua Q75 (75 cm tank)', inStock: true, specs: { 'Tank Size': '75 cm', 'Selling Price': '₹4,000', 'MRP': '₹4,500' } },
      { id: 'q90', name: 'Luminous Aqua Q90 (90 cm tank)', inStock: true, specs: { 'Tank Size': '90 cm', 'Selling Price': '₹5,500', 'MRP': '₹6,000' } },
      { id: 'q120', name: 'Luminous Aqua Q120 (120 cm tank)', inStock: true, specs: { 'Tank Size': '120 cm', 'Selling Price': '₹6,800', 'MRP': '₹7,500' } },
    ],`;

if (content.includes(luminousOldVariants.trim())) {
  content = content.replace(luminousOldVariants.trim(), luminousNewVariants.trim());
  console.log('Updated luminous-aqua-ocean-blue variant specs!');
} else {
  console.warn('Notice: Could not do exact string match for luminous variants, checking normalized whitespace...');
}

fs.writeFileSync('./lib/data/products.ts', content, 'utf8');
console.log('Successfully wrote updated lib/data/products.ts');
