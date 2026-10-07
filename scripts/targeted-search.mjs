import fs from 'fs';

const dump = JSON.parse(fs.readFileSync('./scripts/catalog-dump.json', 'utf8'));

// Search helper
function findProducts(query) {
  const q = query.toLowerCase();
  return dump.filter(p => 
    p.id.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    (p.brand && p.brand.toLowerCase().includes(q)) ||
    (p.description && p.description.toLowerCase().includes(q)) ||
    (p.shortDesc && p.shortDesc.toLowerCase().includes(q))
  );
}

const checkList = [
  'manual-marine-light',
  'seachem-calcium',
  'atc-salinity-refractometer',
  'blue-treasure-coral-sand',
  'sensibar',
  'biozym',
  'hikari',
  'sunsun',
  'cleaner',
  'magnetic',
  'hitter',
  'cube',
  'one hitter',
  'irb',
  'heater',
  'elixe',
  'xlone',
  'quantum',
  'salt',
  'veggie',
  'sea veg',
  'two little',
  'cw 140',
  'yvs',
  'jvp',
  'jtp 5800',
  'erma'
];

console.log('--- TARGET SEARCH RESULTS ---');
for (const term of checkList) {
  const matches = findProducts(term);
  console.log(`\nSearch "${term}": found ${matches.length} matches:`);
  matches.forEach(m => console.log(`  - [${m.id}] "${m.name}" (brand: ${m.brand})`));
}
