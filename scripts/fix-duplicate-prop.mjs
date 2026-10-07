import fs from 'fs';

let c = fs.readFileSync('./lib/data/products.ts', 'utf8');

c = c.replace(/availabilityNote:\s*'Authoritative client pricing: ₹250 per kg\.',\s*\r?\n\s*itemType:/, 'itemType:');
c = c.replace(
  /availabilityNote:\s*'Natural calcium carbonate marine rock\. Highly porous aquascaping foundation\.',/,
  "availabilityNote: 'Authoritative client pricing: ₹250 per kg. Natural calcium carbonate marine rock, highly porous aquascaping foundation.',"
);

fs.writeFileSync('./lib/data/products.ts', c, 'utf8');
console.log('Fixed duplicate property in lib/data/products.ts successfully!');
