import { PRODUCTS } from './lib/data/products.ts';

const flora = PRODUCTS.find(p => p.id === 'luminous-aqua-ocean-blue');
const nemo = PRODUCTS.find(p => p.id === 'nemo-extreme-led');

console.log('--- FLORA IN PRODUCTS.TS ---');
console.log(JSON.stringify(flora, null, 2));

console.log('\n--- NEMO IN PRODUCTS.TS ---');
console.log(JSON.stringify(nemo, null, 2));

