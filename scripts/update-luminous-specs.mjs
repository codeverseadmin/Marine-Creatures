import fs from 'fs';

let c = fs.readFileSync('./lib/data/products.ts', 'utf8');

c = c.replace(
  /\{\s*id:\s*'q30',\s*name:\s*'Luminous Aqua Q30 \(30 cm tank\)',\s*inStock:\s*true\s*\}/,
  "{ id: 'q30', name: 'Luminous Aqua Q30 (30 cm tank)', inStock: true, specs: { 'Tank Size': '30 cm', 'Price': '₹2,600', 'MRP': '₹3,000' } }"
);
c = c.replace(
  /\{\s*id:\s*'q60',\s*name:\s*'Luminous Aqua Q60 \(60 cm tank\)',\s*inStock:\s*true\s*\}/,
  "{ id: 'q60', name: 'Luminous Aqua Q60 (60 cm tank)', inStock: true, specs: { 'Tank Size': '60 cm', 'Price': '₹3,400', 'MRP': '₹3,800' } }"
);
c = c.replace(
  /\{\s*id:\s*'q75',\s*name:\s*'Luminous Aqua Q75 \(75 cm tank\)',\s*inStock:\s*true\s*\}/,
  "{ id: 'q75', name: 'Luminous Aqua Q75 (75 cm tank)', inStock: true, specs: { 'Tank Size': '75 cm', 'Price': '₹4,000', 'MRP': '₹4,500' } }"
);
c = c.replace(
  /\{\s*id:\s*'q90',\s*name:\s*'Luminous Aqua Q90 \(90 cm tank\)',\s*inStock:\s*true\s*\}/,
  "{ id: 'q90', name: 'Luminous Aqua Q90 (90 cm tank)', inStock: true, specs: { 'Tank Size': '90 cm', 'Price': '₹5,500', 'MRP': '₹6,000' } }"
);
c = c.replace(
  /\{\s*id:\s*'q120',\s*name:\s*'Luminous Aqua Q120 \(120 cm tank\)',\s*inStock:\s*true\s*\}/,
  "{ id: 'q120', name: 'Luminous Aqua Q120 (120 cm tank)', inStock: true, specs: { 'Tank Size': '120 cm', 'Price': '₹6,800', 'MRP': '₹7,500' } }"
);

fs.writeFileSync('./lib/data/products.ts', c, 'utf8');
console.log('Luminous variants specs updated successfully!');
