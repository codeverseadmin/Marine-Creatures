import fs from 'fs';
import mongoose from 'mongoose';

// Load MONGODB_URI from .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
let MONGODB_URI = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('MONGODB_URI=')) {
    MONGODB_URI = line.replace('MONGODB_URI=', '').trim();
  }
}

// Full reconciliation dataset
const reconciliationData = [
  {
    id: 'by-par-synthetic-adsorbent',
    name: 'By-Par Synthetic Adsorbent Resin',
    brand: 'Aquatic Remedies',
    price: 550,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Regenerable synthetic macroporous adsorbent resin from Aquatic Remedies.'
  },
  {
    id: 'magic-bag-media-reactor',
    name: 'Magic Bag Fine-Micron Chemical Resin Filter Bag',
    brand: 'Marine Creatures Selected',
    price: 600,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Supplied as a pack of 2 pieces with overflow system for universal aquarium sump and filter use.'
  },
  {
    id: 'trwil-tower-filter-media',
    name: 'Trwil Tower Structured Trickle Bio Media',
    brand: 'Marine Creatures Selected',
    price: 500,
    compareAtPrice: 600,
    priceOnRequest: false,
    descAppend: 'Structured biological trickle filter media from Aquatic Remedies engineered for deep nitrification.'
  },
  {
    id: 'bio-pods-filter-media',
    name: 'High Surface Area Sintered Quartz Bio Pods',
    brand: 'Marine Creatures Selected',
    price: 300,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Premium quality biological filter media offering maximum microscopic colonization area.'
  },
  {
    id: 'ceramic-house-filter-media',
    name: 'Porous Ceramic House Bio-Media',
    brand: 'Aquatic Remedies',
    price: 35,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Porous ceramic filter media bar from House of Aquatic Remedies.'
  },
  {
    id: 'bio-block-filter-media',
    name: 'Ultra-Porous Sintered Ceramic Bio Block',
    brand: 'Aquatic Remedies',
    price: 400,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Ultra-porous sintered ceramic Bacto Block bio block from the House of Aquatic Remedies.'
  },
  {
    id: 'amozorb-ammonia-adsorbent',
    name: 'Amozorb Ammonia Adsorbent Filtration Media',
    brand: 'Aquatic Remedies',
    price: 350,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Official Amozorb natural ammonia-adsorbent filter media from Aquatic Remedies.'
  },
  {
    id: 'floating-mbbr-media',
    name: 'Fluidised Moving Bed K1 / MBBR Biological Media',
    brand: 'Aquatic Remedies',
    price: 350,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'High surface-area fluidised moving bed biological floating media from Aquatic Remedies.'
  },
  {
    id: 'xpores-biological-media',
    name: 'Xpores Porous Biological Stone Media',
    brand: 'Aquatic Remedies',
    price: 300,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Official X-Pores porous biological stone filter media from Aquatic Remedies.'
  },
  {
    id: 'qtermoline-bio-media',
    name: 'Qtermoline Thermal Fused Biological Media',
    brand: 'Marine Creatures Selected',
    price: 420,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Q-Tourmaline thermal-fused biological media for mineral enrichment and water conditioning.'
  },
  {
    id: 'zeolite-ammonia-media',
    name: 'Zeolite Natural Ammonia Adsorbent Mineral Media',
    brand: 'Marine Creatures Selected',
    price: 310,
    compareAtPrice: null,
    priceOnRequest: false,
    availabilityNote: 'Price may vary from product to product depending on grain size grade and packaging volume.',
    descAppend: 'Natural microporous clinoptilolite zeolite media. Price may vary from product to product based on grain sizing.'
  },
  {
    id: 'amozeal-vitality-blocks',
    name: 'Amozeal Nano Vitality Ceramic Bio-Blocks',
    brand: 'Aquatic Remedies',
    price: 610,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Amozeal nano-porous vitality ceramic bio-blocks formulated with trace minerals by Aquatic Remedies.'
  },
  {
    id: 'tici-live-phytoplankton',
    name: 'TiCi NatureLab Live Marine Phytoplankton',
    brand: 'TiCi NatureLab',
    price: 500,
    compareAtPrice: 525,
    priceOnRequest: false,
    descAppend: 'TiCi live phytoplankton cultures formulated for soft corals, clams, sponges, and marine invertebrates.'
  },
  {
    id: 'biozym-303-ampules',
    name: 'Biozym 303 Nitrifying Bacteria Ampules',
    brand: 'Biozym',
    price: 4000,
    compareAtPrice: 4500,
    priceOnRequest: false,
    descAppend: 'Biozym 303 nitrifying bacteria activator formulated for rapid cycling and quickly establishing biological filtration.',
    variants: [
      { id: '5-ampules', name: 'Biozym 303 — 5 Ampule Box', inStock: true, specs: { Packaging: '5 Ampules', Price: '₹1,450', 'Compare-at': '₹1,800', Function: 'Nitrifying bacteria activator' } },
      { id: '20-ampules', name: 'Biozym 303 — 20 Ampule Box', inStock: true, specs: { Packaging: '20 Ampules', Price: '₹4,000', 'Compare-at': '₹4,500', Function: 'Rapid cycling biological filtration' } },
    ]
  },
  {
    id: 'teraa-t-probiotics',
    name: 'Teraa T-Probiotics Biological Water Conditioner',
    brand: 'Teraa',
    price: 712,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Formulated with 8X concentrate containing 8 different strains of beneficial nitrifying and probiotic bacteria.'
  },
  {
    id: 'hikari-frozen-mysis',
    name: 'Hikari Bio-Pure Frozen Mysis Shrimp',
    brand: 'Hikari',
    price: 700,
    compareAtPrice: 800,
    priceOnRequest: false,
    descAppend: 'Hikari Bio-Pure bio-encapsulated frozen mysis shrimp rich in natural fatty acids for marine fish.'
  },
  {
    id: 'atc-salinity-refractometer',
    name: 'Precision Optical Salinity Refractometer (with ATC)',
    brand: 'Marine Creatures Instruments',
    price: 1400,
    compareAtPrice: 1800,
    priceOnRequest: false,
    descAppend: 'Includes calibration liquid and Automatic Temperature Compensation (ATC) optical prism system (ERMA standard).'
  },
  {
    id: 'sensibar-reef-rock',
    name: 'Sensibar Natural Marine Reef Rock',
    brand: 'Marine Creatures Selected',
    price: 250,
    compareAtPrice: null,
    priceOnRequest: false,
    availabilityNote: 'Authoritative client pricing: ₹250 per kg.',
    descAppend: 'Pristine calcium carbonate Sensibar marine reef rock priced at ₹250 per kg.'
  },
  {
    id: 'blue-treasure-coral-sand',
    name: 'Blue Treasure Natural Coral Aragonite Sand',
    brand: 'Blue Treasure',
    price: 1400,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Blue Treasure natural coral sand across all grain-size types / varieties (5 kg base packaging).'
  },
  {
    id: 'seachem-cupramine',
    name: 'Seachem Cupramine Copper Treatment',
    brand: 'Seachem',
    price: 1250,
    compareAtPrice: null,
    priceOnRequest: false,
    descAppend: 'Buffered active copper treatment formulated by Seachem for ectoparasite quarantine management.'
  },
  {
    id: 'boyu-separation-box',
    name: 'Boyu Isolation & Nursery Separation Box',
    brand: 'Boyu',
    price: 450,
    compareAtPrice: 600,
    priceOnRequest: false,
    descAppend: 'Boyu fish separation net/box available in single and double chamber configurations.'
  },
  {
    id: 'bubble-magus-mini-q',
    name: 'Bubble Magus Mini Q Nano Protein Skimmer',
    brand: 'Bubble Magus',
    price: 4400,
    compareAtPrice: 4800,
    priceOnRequest: false,
    descAppend: 'Bubble Magus Mini Q Internal Protein Skimmer with needle-wheel DC pump for nano saltwater aquariums.'
  },
  {
    id: 'bubble-magus-qq2',
    name: 'Bubble Magus QQ2 Nano Protein Skimmer',
    brand: 'Bubble Magus',
    price: 5800,
    compareAtPrice: 6500,
    priceOnRequest: false,
    descAppend: 'Bubble Magus QQ2 Hang-On Nano Protein Skimmer engineered for rimless marine setups up to 100 L.'
  },
  {
    id: 're-ocean-mini-80',
    name: 'RE Ocean Mini 80 Internal Filter',
    brand: 'RE Ocean',
    price: 10200,
    compareAtPrice: 10400,
    priceOnRequest: false,
    descAppend: 'High-capacity internal marine filtration system engineered for aquariums up to approximately 250 L (Model: Mini 80).'
  },
  {
    id: 're-ocean-mini-60',
    name: 'RE Ocean Mini 60 Internal Filter',
    brand: 'RE Ocean',
    price: 6500,
    compareAtPrice: 6800,
    priceOnRequest: false,
    descAppend: 'Compact internal marine filtration system suitable for aquariums approximately 50–120 L (Model: Mini 60).'
  },
  {
    id: 'sunsun-pump-jdp6000',
    name: 'Sunsun JDP-6000 DC Submersible Pump (DC Controllable)',
    brand: 'Sunsun',
    price: 8000,
    compareAtPrice: 8500,
    priceOnRequest: false,
    descAppend: 'High-efficiency 24V DC controllable return pump delivering a maximum flow rate up to 6,000 L/h.'
  },
  {
    id: 'sunsun-pump-jdp3500',
    name: 'Sunsun JDP-3500 DC Submersible Pump (DC Controllable)',
    brand: 'Sunsun',
    price: 6500,
    compareAtPrice: 7000,
    priceOnRequest: false,
    descAppend: 'Energy-saving 24V DC controllable submersible return pump delivering flow rates up to 3,500 L/h.'
  },
  {
    id: 'sunsun-pump-hqb4500',
    name: 'Sunsun HQB-4500 Submersible Pump',
    brand: 'Sunsun',
    price: 4400,
    compareAtPrice: 4800,
    priceOnRequest: false,
    descAppend: 'Heavy-duty submersible pump delivering an approximate flow rate of 4,500 L/h.'
  },
  {
    id: 'sunsun-pump-jtp8000',
    name: 'Sunsun JTP-8000 Submersible Pump',
    brand: 'Sunsun',
    price: 6500,
    compareAtPrice: 7000,
    priceOnRequest: false,
    descAppend: 'Variable frequency submersible pump delivering an approximate flow rate of 8,000 L/h.'
  },
  {
    id: 'sunsun-wavemaker-jvp232',
    name: 'Sunsun Magnetic Wavemaker JVP-232',
    brand: 'Sunsun',
    price: 2590,
    compareAtPrice: 3000,
    priceOnRequest: false,
    descAppend: 'High-flow dual-head magnetic wavemaker with 360-degree directional circulation.'
  },
  {
    id: 'luminous-aqua-ocean-blue',
    name: 'Luminous Aqua S Flora Ocean Blue Marine Light',
    brand: 'S Flora / Luminous Aqua',
    price: 2600,
    compareAtPrice: 3000,
    priceOnRequest: false,
    descAppend: 'Deep-ocean actinic spectrum fixture designed for marine livestock contrast and coral pop across 5 sizes.',
    variants: [
      { id: 'q30', name: 'Luminous Aqua Q30 (30 cm tank)', inStock: true, specs: { 'Approx Length': '250 mm', 'Tank Fit': '30 cm', 'Selling Price': '₹2,600', 'Compare-at': '₹3,000' } },
      { id: 'q60', name: 'Luminous Aqua Q60 (60 cm tank)', inStock: true, specs: { 'Approx Length': '570 mm', 'Tank Fit': '60 cm', 'Selling Price': '₹3,400', 'Compare-at': '₹3,800' } },
      { id: 'q75', name: 'Luminous Aqua Q75 (75 cm tank)', inStock: true, specs: { 'Approx Length': '700 mm', 'Tank Fit': '75 cm', 'Selling Price': '₹4,000', 'Compare-at': '₹4,500' } },
      { id: 'q90', name: 'Luminous Aqua Q90 (90 cm tank)', inStock: true, specs: { 'Approx Length': '860 mm', 'Tank Fit': '90 cm', 'Selling Price': '₹5,500', 'Compare-at': '₹6,000' } },
      { id: 'q120', name: 'Luminous Aqua Q120 (120 cm tank)', inStock: true, specs: { 'Approx Length': '1,000 mm', 'Tank Fit': '120 cm', 'Selling Price': '₹6,800', 'Compare-at': '₹7,500' } },
    ]
  },
  {
    id: 'sessile-comet-light',
    name: 'Sessile Comet Manual Aquarium Light',
    brand: 'Sessile',
    price: 2600,
    compareAtPrice: 3000,
    priceOnRequest: false,
    descAppend: '5.2 watt manual marine LED fixture featuring 3 color modes, digital timer presets, and full brightness dimming control.'
  },
  {
    id: 'nemo-extreme-led',
    name: 'Nemo Extreme Series II Smart Marine LED',
    brand: 'NemoLight',
    price: 6500,
    compareAtPrice: 7500,
    priceOnRequest: false,
    descAppend: 'Nemo light available across multiple models (E450, E600, E900, E1200) with smartphone Bluetooth app control.',
    variants: [
      { id: 'e450', name: 'Nemo E450 (45–60 cm / 24W)', inStock: true, specs: { 'Tank Range': '45–60 cm', Power: '24W', Control: 'Bluetooth App Control' } },
      { id: 'e600', name: 'Nemo E600 (60–80 cm / 36W)', inStock: true, specs: { 'Tank Range': '60–80 cm', Power: '36W', Control: 'Bluetooth App Control' } },
      { id: 'e900', name: 'Nemo E900 (90–110 cm / 60W)', inStock: true, specs: { 'Tank Range': '90–110 cm', Power: '60W', Control: 'Bluetooth App Control' } },
      { id: 'e1200', name: 'Nemo E1200 (120–140 cm / 72W)', inStock: true, specs: { 'Tank Range': '120–140 cm', Power: '72W', Control: 'Bluetooth App Control' } },
    ]
  }
];

async function main() {
  console.log('--- EXECUTING OFFICIAL CATALOG PRICE RECONCILIATION ---');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas');

  const productsColl = mongoose.connection.db.collection('products');
  const auditColl = mongoose.connection.db.collection('auditlogs');

  let updatedCount = 0;

  for (const item of reconciliationData) {
    const existing = await productsColl.findOne({ id: item.id });
    if (!existing) {
      console.warn(`Product ${item.id} not found in DB`);
      continue;
    }

    const prevPrice = existing.price;
    const prevCompareAt = existing.compareAtPrice || existing.originalPrice || null;

    const updateFields = {
      price: item.price,
      compareAtPrice: item.compareAtPrice,
      originalPrice: item.compareAtPrice, // Keep synchronized
      priceOnRequest: item.priceOnRequest,
      updatedAt: new Date(),
    };

    if (item.brand) updateFields.brand = item.brand;
    if (item.availabilityNote) updateFields.availabilityNote = item.availabilityNote;
    if (item.variants) updateFields.variants = item.variants;

    await productsColl.updateOne({ id: item.id }, { $set: updateFields });
    updatedCount++;

    // Record AuditLog
    await auditColl.insertOne({
      action: 'PRODUCT_PRICE_UPDATED',
      entityType: 'product',
      entityId: item.id,
      entityName: existing.name,
      summary: `Reconciled price against official client price list: ₹${item.price}${item.compareAtPrice ? ` (compareAt: ₹${item.compareAtPrice})` : ''}`,
      details: {
        previousPrice: prevPrice,
        newPrice: item.price,
        previousCompareAtPrice: prevCompareAt,
        newCompareAtPrice: item.compareAtPrice,
        source: 'CLIENT_PRICE_LIST',
        timestamp: new Date().toISOString(),
      },
      actor: 'mc_admin_session',
      createdAt: new Date(),
    });

    console.log(`[${updatedCount}/33] Reconciled & Logged: ${item.id} (₹${item.price} | Compare-at: ${item.compareAtPrice || '—'})`);
  }

  // Record AuditLog for JTP-3800 Conflict
  const jtp3800 = await productsColl.findOne({ id: 'sunsun-pump-jtp3800' });
  if (jtp3800) {
    await auditColl.insertOne({
      action: 'PRODUCT_UPDATED',
      entityType: 'product',
      entityId: 'sunsun-pump-jtp3800',
      entityName: jtp3800.name,
      summary: 'PRICE_CONFLICT_REQUIRES_CLIENT_CONFIRMATION: Entry A (₹4,800 / ₹5,500) vs Entry B (₹4,500 / ₹4,800). Active price left unmodified with priceOnRequest: true.',
      details: {
        status: 'PRICE_CONFLICT_REQUIRES_CLIENT_CONFIRMATION',
        entryA: { price: 4800, compareAtPrice: 5500 },
        entryB: { price: 4500, compareAtPrice: 4800 },
        source: 'CLIENT_PRICE_LIST',
        action: 'CLIENT_CONFIRMATION_REQUIRED',
        timestamp: new Date().toISOString(),
      },
      actor: 'mc_admin_session',
      createdAt: new Date(),
    });
    console.log('✅ Recorded AuditLog for JTP-3800 Conflict (Flagged for Client Confirmation)');
  }

  await mongoose.disconnect();
  console.log('✅ Synchronization and audit logging complete.');
}

main().catch(console.error);
