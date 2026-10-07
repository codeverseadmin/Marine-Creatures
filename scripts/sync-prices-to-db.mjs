import fs from 'fs';
import mongoose from 'mongoose';

// Parse .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
let MONGODB_URI = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('MONGODB_URI=')) {
    MONGODB_URI = line.replace('MONGODB_URI=', '').trim();
  }
}

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

// 33 direct updates
const updates = [
  { id: 'nemo-extreme-led', price: 6500, originalPrice: 7500, priceOnRequest: false },
  { id: 'sessile-comet-light', price: 2600, originalPrice: 3000, priceOnRequest: false },
  { 
    id: 'luminous-aqua-ocean-blue', 
    price: 2600, 
    originalPrice: 3000, 
    priceOnRequest: false,
    variants: [
      { id: 'q30', name: 'Luminous Aqua Q30 (30 cm tank)', inStock: true, specs: { 'Tank Size': '30 cm', 'Price': '₹2,600', 'MRP': '₹3,000' } },
      { id: 'q60', name: 'Luminous Aqua Q60 (60 cm tank)', inStock: true, specs: { 'Tank Size': '60 cm', 'Price': '₹3,400', 'MRP': '₹3,800' } },
      { id: 'q75', name: 'Luminous Aqua Q75 (75 cm tank)', inStock: true, specs: { 'Tank Size': '75 cm', 'Price': '₹4,000', 'MRP': '₹4,500' } },
      { id: 'q90', name: 'Luminous Aqua Q90 (90 cm tank)', inStock: true, specs: { 'Tank Size': '90 cm', 'Price': '₹5,500', 'MRP': '₹6,000' } },
      { id: 'q120', name: 'Luminous Aqua Q120 (120 cm tank)', inStock: true, specs: { 'Tank Size': '120 cm', 'Price': '₹6,800', 'MRP': '₹7,500' } },
    ]
  },
  { id: 'sunsun-wavemaker-jvp232', price: 2590, originalPrice: 3000, priceOnRequest: false },
  { id: 'sunsun-pump-jtp8000', price: 6500, originalPrice: 7000, priceOnRequest: false },
  { id: 'sunsun-pump-hqb4500', price: 4400, originalPrice: 4800, priceOnRequest: false },
  { id: 'sunsun-pump-jdp3500', price: 6500, originalPrice: 7000, priceOnRequest: false },
  { id: 'sunsun-pump-jdp6000', price: 8000, originalPrice: 8500, priceOnRequest: false },
  { id: 're-ocean-mini-60', price: 6500, originalPrice: 6800, priceOnRequest: false },
  { id: 're-ocean-mini-80', price: 10200, originalPrice: 10400, priceOnRequest: false },
  { id: 'bubble-magus-qq2', price: 5800, originalPrice: 6500, priceOnRequest: false },
  { id: 'bubble-magus-mini-q', price: 4400, originalPrice: 4800, priceOnRequest: false },
  { id: 'boyu-separation-box', price: 450, originalPrice: 600, priceOnRequest: false },
  { id: 'seachem-cupramine', price: 1250, priceOnRequest: false },
  { id: 'blue-treasure-coral-sand', price: 1400, priceOnRequest: false },
  { id: 'sensibar-reef-rock', price: 250, priceOnRequest: false },
  { id: 'atc-salinity-refractometer', price: 1400, originalPrice: 1800, priceOnRequest: false },
  { id: 'hikari-frozen-mysis', price: 700, originalPrice: 800, priceOnRequest: false },
  { id: 'teraa-t-probiotics', price: 712, priceOnRequest: false },
  { id: 'biozym-303-ampules', price: 4000, originalPrice: 4500, priceOnRequest: false },
  { id: 'tici-live-phytoplankton', price: 500, originalPrice: 525, priceOnRequest: false },
  { id: 'amozeal-vitality-blocks', price: 610, priceOnRequest: false },
  { id: 'zeolite-ammonia-media', price: 310, priceOnRequest: false },
  { id: 'qtermoline-bio-media', price: 420, priceOnRequest: false },
  { id: 'xpores-biological-media', price: 300, priceOnRequest: false },
  { id: 'floating-mbbr-media', price: 350, priceOnRequest: false },
  { id: 'amozorb-ammonia-adsorbent', price: 350, priceOnRequest: false },
  { id: 'bio-block-filter-media', price: 400, priceOnRequest: false },
  { id: 'ceramic-house-filter-media', price: 35, priceOnRequest: false },
  { id: 'bio-pods-filter-media', price: 300, priceOnRequest: false },
  { id: 'trwil-tower-filter-media', price: 500, originalPrice: 600, priceOnRequest: false },
  { id: 'magic-bag-media-reactor', price: 600, priceOnRequest: false },
  { id: 'by-par-synthetic-adsorbent', price: 550, priceOnRequest: false },
];

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;
  const collection = db.collection('products');

  let updatedCount = 0;
  for (const item of updates) {
    const updateDoc = {
      price: item.price,
      priceOnRequest: item.priceOnRequest,
      updatedAt: new Date(),
    };
    if (item.originalPrice !== undefined) {
      updateDoc.originalPrice = item.originalPrice;
    }
    if (item.variants) {
      updateDoc.variants = item.variants;
    }

    const res = await collection.updateOne(
      { id: item.id },
      { $set: updateDoc }
    );
    if (res.matchedCount > 0) {
      updatedCount++;
      console.log(`✅ Updated MongoDB record: ${item.id} -> price: ₹${item.price}, MRP: ${item.originalPrice ? `₹${item.originalPrice}` : 'none'}`);
    } else {
      console.warn(`⚠️ Warning: Product ID ${item.id} not found in collection`);
    }
  }

  console.log(`\nMongoDB synchronization finished: ${updatedCount} / ${updates.length} products updated.`);

  // Verify conflicting product JTP 3800 is untouched
  const jtp3800 = await collection.findOne({ id: 'sunsun-pump-jtp3800' });
  console.log(`Conflict check [sunsun-pump-jtp3800]: price=${jtp3800?.price}, priceOnRequest=${jtp3800?.priceOnRequest} (UNMODIFIED)`);

  // Verify price on request product manual-marine-light is untouched
  const manualLight = await collection.findOne({ id: 'manual-marine-light' });
  console.log(`PoR check [manual-marine-light]: price=${manualLight?.price}, priceOnRequest=${manualLight?.priceOnRequest} (UNMODIFIED)`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB Atlas.');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
