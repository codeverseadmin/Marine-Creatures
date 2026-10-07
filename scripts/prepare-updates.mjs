import fs from 'fs';

const lines = fs.readFileSync('./lib/data/products.ts', 'utf8').split('\n');

// The 33 direct matches:
const updates = [
  // 1. by-par-synthetic-adsorbent
  { id: 'by-par-synthetic-adsorbent', price: 550, originalPrice: null },
  // 2. magic-bag-media-reactor
  { id: 'magic-bag-media-reactor', price: 600, originalPrice: null },
  // 3. trwil-tower-filter-media
  { id: 'trwil-tower-filter-media', price: 500, originalPrice: 600 },
  // 4. bio-pods-filter-media
  { id: 'bio-pods-filter-media', price: 300, originalPrice: null },
  // 5. ceramic-house-filter-media
  { id: 'ceramic-house-filter-media', price: 35, originalPrice: null },
  // 6. bio-block-filter-media
  { id: 'bio-block-filter-media', price: 400, originalPrice: null },
  // 7. amozorb-ammonia-adsorbent
  { id: 'amozorb-ammonia-adsorbent', price: 350, originalPrice: null },
  // 8. floating-mbbr-media
  { id: 'floating-mbbr-media', price: 350, originalPrice: null },
  // 9. xpores-biological-media
  { id: 'xpores-biological-media', price: 300, originalPrice: null },
  // 10. qtermoline-bio-media
  { id: 'qtermoline-bio-media', price: 420, originalPrice: null },
  // 11. zeolite-ammonia-media
  { id: 'zeolite-ammonia-media', price: 310, originalPrice: null },
  // 12. amozeal-vitality-blocks
  { id: 'amozeal-vitality-blocks', price: 610, originalPrice: null },
  // 13. tici-live-phytoplankton
  { id: 'tici-live-phytoplankton', price: 500, originalPrice: 525 },
  // 14. biozym-303-ampules
  { id: 'biozym-303-ampules', price: 4000, originalPrice: 4500 },
  // 15. teraa-t-probiotics
  { id: 'teraa-t-probiotics', price: 712, originalPrice: null },
  // 16. hikari-frozen-mysis
  { id: 'hikari-frozen-mysis', price: 700, originalPrice: 800 },
  // 17. atc-salinity-refractometer
  { id: 'atc-salinity-refractometer', price: 1400, originalPrice: 1800 },
  // 18. sensibar-reef-rock
  { id: 'sensibar-reef-rock', price: 250, originalPrice: null },
  // 19. blue-treasure-coral-sand
  { id: 'blue-treasure-coral-sand', price: 1400, originalPrice: null },
  // 20. seachem-cupramine
  { id: 'seachem-cupramine', price: 1250, originalPrice: null },
  // 21. boyu-separation-box
  { id: 'boyu-separation-box', price: 450, originalPrice: 600 },
  // 22. bubble-magus-mini-q
  { id: 'bubble-magus-mini-q', price: 4400, originalPrice: 4800 },
  // 23. bubble-magus-qq2
  { id: 'bubble-magus-qq2', price: 5800, originalPrice: 6500 },
  // 24. re-ocean-mini-80
  { id: 're-ocean-mini-80', price: 10200, originalPrice: 10400 },
  // 25. re-ocean-mini-60
  { id: 're-ocean-mini-60', price: 6500, originalPrice: 6800 },
  // 26. sunsun-pump-jdp6000
  { id: 'sunsun-pump-jdp6000', price: 8000, originalPrice: 8500 },
  // 27. sunsun-pump-jdp3500
  { id: 'sunsun-pump-jdp3500', price: 6500, originalPrice: 7000 },
  // 28. sunsun-pump-hqb4500
  { id: 'sunsun-pump-hqb4500', price: 4400, originalPrice: 4800 },
  // 29. sunsun-pump-jtp8000
  { id: 'sunsun-pump-jtp8000', price: 6500, originalPrice: 7000 },
  // 30. sunsun-wavemaker-jvp232
  { id: 'sunsun-wavemaker-jvp232', price: 2590, originalPrice: 3000 },
  // 31. luminous-aqua-ocean-blue (Q30 base)
  { id: 'luminous-aqua-ocean-blue', price: 2600, originalPrice: 3000 },
  // 32. sessile-comet-light
  { id: 'sessile-comet-light', price: 2600, originalPrice: 3000 },
  // 33. nemo-extreme-led
  { id: 'nemo-extreme-led', price: 6500, originalPrice: 7500 },
];

console.log(`Checking line positions for all ${updates.length} products...`);
const updateMap = new Map(updates.map(u => [u.id, u]));

let currentId = null;
let foundCount = 0;

lines.forEach((line, idx) => {
  const m = line.match(/^\s*id:\s*['"]([^'"]+)['"]/);
  if (m) {
    currentId = m[1];
    if (updateMap.has(currentId)) {
      foundCount++;
      const u = updateMap.get(currentId);
      console.log(`Matched [${currentId}] at line ${idx + 1} -> New Price: ₹${u.price}, MRP: ${u.originalPrice ? `₹${u.originalPrice}` : 'None'}`);
    }
  }
});

console.log(`\nTotal verified matches: ${foundCount} / ${updates.length}`);
