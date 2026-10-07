import fs from 'fs';

const lines = fs.readFileSync('./lib/data/products.ts', 'utf8').split('\n');
const items = [];

lines.forEach((line, idx) => {
  const match = line.match(/^\s*id:\s*['"]([^'"]+)['"]/);
  if (match) {
    items.push({ id: match[1], line: idx + 1 });
  }
});

console.log(`Found ${items.length} products with 'id' in products.ts:`);
items.forEach((it, i) => {
  console.log(`${i + 1}. [${it.id}] at line ${it.line}`);
});
