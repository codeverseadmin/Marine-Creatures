import fs from 'fs';

const backup = JSON.parse(fs.readFileSync('./docs/catalog_backup_pre_reconciliation.json', 'utf8'));
const products = backup.data || backup;

// Explicit mappings identified by SKU / Brand / Model / Name / Identity
// Map client items to catalog product ID
const directMappings = [
  // Biological / Media
  { clientItem: 'Bacto Block', sellingPrice: 400, mrp: null, catalogId: 'bio-block-filter-media' },
  { clientItem: 'Yee Magic Bag / Filter Bag', sellingPrice: 600, mrp: null, catalogId: 'magic-bag-media-reactor' },
  { clientItem: 'Aquatic Remedies Ceramic Bar', sellingPrice: 35, mrp: null, catalogId: 'ceramic-house-filter-media' },
  { clientItem: 'By Par', sellingPrice: 550, mrp: null, catalogId: 'by-par-synthetic-adsorbent' },
  { clientItem: 'Floating Media', sellingPrice: 350, mrp: null, catalogId: 'floating-mbbr-media' },
  { clientItem: 'Amozorb', sellingPrice: 350, mrp: null, catalogId: 'amozorb-ammonia-adsorbent' },
  { clientItem: 'X-Pores', sellingPrice: 300, mrp: null, catalogId: 'xpores-biological-media' },
  { clientItem: 'Twirl Tower Media', sellingPrice: 500, mrp: 600, catalogId: 'trwil-tower-filter-media' },
  { clientItem: 'Bio Pods', sellingPrice: 300, mrp: null, catalogId: 'bio-pods-filter-media' },
  { clientItem: 'Amozeal', sellingPrice: 610, mrp: null, catalogId: 'amozeal-vitality-blocks' },
  { clientItem: 'Q-Tourmaline', sellingPrice: 420, mrp: null, catalogId: 'qtermoline-bio-media' },
  { clientItem: 'Zeolite', sellingPrice: 310, mrp: null, catalogId: 'zeolite-ammonia-media' },

  // Rock / Sand / Salt
  { clientItem: 'Sensibar Rock', sellingPrice: 250, mrp: null, catalogId: 'sensibar-reef-rock' },
  { clientItem: 'Blue Treasure Sand 5kg', sellingPrice: 1400, mrp: null, catalogId: 'blue-treasure-coral-sand' },

  // Food / Biological Products
  { clientItem: 'Hikari Mysis Shrimp', sellingPrice: 700, mrp: 800, catalogId: 'hikari-frozen-mysis' },
  { clientItem: 'Terra T-Probiotics', sellingPrice: 712, mrp: null, catalogId: 'teraa-t-probiotics' },
  { clientItem: 'Biozym 303 — 20 ampoules box', sellingPrice: 4000, mrp: 4500, catalogId: 'biozym-303-ampules' },
  { clientItem: 'Phytoplankton (TICI)', sellingPrice: 500, mrp: 525, catalogId: 'tici-live-phytoplankton' },

  // Medication / Testing
  { clientItem: 'Cupramine', sellingPrice: 1250, mrp: null, catalogId: 'seachem-cupramine' },
  { clientItem: 'Refractometer / ERMA Refractometer', sellingPrice: 1400, mrp: 1800, catalogId: 'atc-salinity-refractometer' },

  // Equipment / Cleaning
  { clientItem: 'Boyu Separation Box', sellingPrice: 450, mrp: 600, catalogId: 'boyu-separation-box' },

  // SunSun Pumps / Wavemakers
  { clientItem: 'Sun Sun JVP 232', sellingPrice: 2590, mrp: 3000, catalogId: 'sunsun-wavemaker-jvp232' },
  { clientItem: 'Sun Sun JTP 8000', sellingPrice: 6500, mrp: 7000, catalogId: 'sunsun-pump-jtp8000' },
  { clientItem: 'Sun Sun HQB 4500', sellingPrice: 4400, mrp: 4800, catalogId: 'sunsun-pump-hqb4500' },
  { clientItem: 'Sun Sun JDP 6000', sellingPrice: 8000, mrp: 8500, catalogId: 'sunsun-pump-jdp6000' },
  { clientItem: 'Sun Sun JDP 3500', sellingPrice: 6500, mrp: 7000, catalogId: 'sunsun-pump-jdp3500' },

  // Lighting
  { clientItem: 'Sessile Comet 5.2 Watt', sellingPrice: 2600, mrp: 3000, catalogId: 'sessile-comet-light' },
  { clientItem: 'Luminous Aqua / S Flora Ocean Blue (Q30/Q60/Q75/Q90/Q120)', sellingPrice: 2600, mrp: 3000, catalogId: 'luminous-aqua-ocean-blue' },
  { clientItem: 'Nemo Light (Parent Product / Base Model)', sellingPrice: 6500, mrp: 7500, catalogId: 'nemo-extreme-led' },

  // Filtration / Skimmers
  { clientItem: 'Bubble Magus QQ2', sellingPrice: 5800, mrp: 6500, catalogId: 'bubble-magus-qq2' },
  { clientItem: 'Bubble Magus Mini Q', sellingPrice: 4400, mrp: 4800, catalogId: 'bubble-magus-mini-q' },
  { clientItem: 'Ocean Tech / RE Ocean Mini 80', sellingPrice: 10200, mrp: 10400, catalogId: 're-ocean-mini-80' },
  { clientItem: 'Ocean Tech / RE Ocean Mini 60', sellingPrice: 6500, mrp: 6800, catalogId: 're-ocean-mini-60' },
];

// Items with Conflict
const conflictItems = [
  {
    clientItem: 'Sun Sun JTP 3800',
    catalogId: 'sunsun-pump-jtp3800',
    screenshotA: { sellingPrice: 4800, mrp: 5500 },
    screenshotB: { sellingPrice: 4500, mrp: 4800 },
    status: 'PRICE_CONFLICT_REQUIRES_CLIENT_CONFIRMATION',
    action: 'RETAIN current value (priceOnRequest: true), flag for client confirmation'
  }
];

// Screenshot items NOT in the 50-item catalog
const notInCatalogItems = [
  { clientItem: 'Elixe-C Carbon', sellingPrice: 680, mrp: null },
  { clientItem: 'Blue Treasure Sand and Salt', sellingPrice: 950, mrp: null },
  { clientItem: 'Quantum Salt', sellingPrice: 5900, mrp: 6000 },
  { clientItem: 'Saki Hikari Marine Carnivorous', sellingPrice: 550, mrp: null },
  { clientItem: 'Hikari Rotifar', sellingPrice: 800, mrp: 900 },
  { clientItem: 'Biozym 300 — 5 ampoule box', sellingPrice: 1450, mrp: 1800 },
  { clientItem: '"To Little Fish Sea Veggies"', sellingPrice: 1300, mrp: null },
  { clientItem: 'Magnetic Glass Cleaner M', sellingPrice: 1300, mrp: 1500 },
  { clientItem: 'Sun Sun IRB 250/500 Watt', sellingPrice: 890, mrp: 1000 },
  { clientItem: 'Cube One Hitter', priceMode: 'PRICE_ON_REQUEST' },
  { clientItem: 'Sun Sun JVP 231', sellingPrice: 2300, mrp: 2800 },
  { clientItem: 'Sun Sun JVP 131', sellingPrice: 1375, mrp: 1500 },
  { clientItem: 'Sun Sun JTP 5800', sellingPrice: 5800, mrp: 6300 },
  { clientItem: 'Sun Sun YVS 25', sellingPrice: 5500, mrp: 6000 },
  { clientItem: 'Sun Sun Grech CW 140', sellingPrice: 8300, mrp: 9000 },
  { clientItem: 'XLONE', sellingPrice: 470, mrp: null },
];

console.log('=== RECONCILIATION SUMMARY ===');
console.log(`Directly matched & updated products: ${directMappings.length}`);
console.log(`Conflicting products: ${conflictItems.length}`);
console.log(`Screenshot products not found in catalog: ${notInCatalogItems.length}`);

// Check all catalog products
const matchedCatalogIds = new Set(directMappings.map(m => m.catalogId));
matchedCatalogIds.add('sunsun-pump-jtp3800');

const untouchedCatalogProducts = products.filter(p => !matchedCatalogIds.has(p.id));
console.log(`\nCatalog products untouched / unchanged: ${untouchedCatalogProducts.length}`);
untouchedCatalogProducts.forEach((p, idx) => {
  console.log(`  ${idx + 1}. [${p.id}] "${p.name}" (${p.itemType})`);
});
