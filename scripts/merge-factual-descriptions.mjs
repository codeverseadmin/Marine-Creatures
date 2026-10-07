import fs from 'fs';

let content = fs.readFileSync('./lib/data/products.ts', 'utf8');

// Sensibar rock note
content = content.replace(
  /name:\s*'Sensibar Natural Marine Reef Rock',\s*\r?\n\s*brand:\s*'Marine Creatures Selected',/,
  "name: 'Sensibar Natural Marine Reef Rock',\n    brand: 'Marine Creatures Selected',\n    availabilityNote: 'Authoritative client pricing: ₹250 per kg.',"
);

// Biozym 303 description and variants
const biozymOld = `    id: 'biozym-303-ampules',
    name: 'Biozym 303 Nitrifying Bacteria Ampules',
    brand: 'Biozym',
    itemType: 'dry',
    category: 'salt-chemistry',
    categoryLabel: 'Biological Additives',
    price: 4000,
    compareAtPrice: 4500,
    originalPrice: 4500,
    priceOnRequest: false,
    rating: 4.9,
    reviewsCount: 23,
    badge: 'Rapid Cycling',
    inStock: true,
    stockCount: 6,
    availabilityStatus: 'AVAILABLE',
    availabilityNote: 'Client descriptor: Premium bacteria formulated for rapid aquarium cycling. Glass ampule packaging.',
    images: ['/images/products/biozym-303-ampules.jpg'],
    imageStatus: 'VERIFIED',
    shortDesc: 'High-density dormant nitrifying bacterial ampules formulated to accelerate bio-filter colonization and reduce ammonia/nitrite.',
    description: 'Biozym 303 Nitrifying Bacteria Ampules provide concentrated biological activation for newly set up marine aquariums and ongoing maintenance. Formulated with stress-resistant nitrifying strains sealed in sterile glass ampules to preserve biological activity until use, supporting rapid biological filtration development.',`;

const biozymNew = `    id: 'biozym-303-ampules',
    name: 'Biozym 303 Nitrifying Bacteria Ampules',
    brand: 'Biozym',
    itemType: 'dry',
    category: 'salt-chemistry',
    categoryLabel: 'Biological Additives',
    price: 4000,
    compareAtPrice: 4500,
    originalPrice: 4500,
    priceOnRequest: false,
    rating: 4.9,
    reviewsCount: 23,
    badge: 'Rapid Cycling',
    inStock: true,
    stockCount: 6,
    availabilityStatus: 'AVAILABLE',
    availabilityNote: 'Biozym 303 nitrifying bacteria activator for rapid cycling and biological filtration.',
    variants: [
      { id: '5-ampules', name: 'Biozym 303 — 5 Ampule Box', inStock: true, specs: { Packaging: '5 Ampules', Price: '₹1,450', 'Compare-at': '₹1,800', Function: 'Nitrifying bacteria activator' } },
      { id: '20-ampules', name: 'Biozym 303 — 20 Ampule Box', inStock: true, specs: { Packaging: '20 Ampules', Price: '₹4,000', 'Compare-at': '₹4,500', Function: 'Rapid cycling biological filtration' } },
    ],
    images: ['/images/products/biozym-303-ampules.jpg'],
    imageStatus: 'VERIFIED',
    shortDesc: 'High-density dormant nitrifying bacterial ampules formulated to accelerate bio-filter colonization and reduce ammonia/nitrite.',
    description: 'Biozym 303 Nitrifying Bacteria Ampules provide concentrated biological activation for newly set up marine aquariums and ongoing maintenance. Rapid cycling formula quickly establishes biological filtration and breaks down toxic nitrogenous compounds.',`;

if (content.includes("id: 'biozym-303-ampules'") && !content.includes("Biozym 303 — 5 Ampule Box")) {
  content = content.replace(
    /id:\s*'biozym-303-ampules',[\s\S]*?images:\s*\['\/images\/products\/biozym-303-ampules\.jpg'\]/,
    `id: 'biozym-303-ampules',
    name: 'Biozym 303 Nitrifying Bacteria Ampules',
    brand: 'Biozym',
    itemType: 'dry',
    category: 'salt-chemistry',
    categoryLabel: 'Biological Additives',
    price: 4000,
    compareAtPrice: 4500,
    originalPrice: 4500,
    priceOnRequest: false,
    rating: 4.9,
    reviewsCount: 23,
    badge: 'Rapid Cycling',
    inStock: true,
    stockCount: 6,
    availabilityStatus: 'AVAILABLE',
    availabilityNote: 'Biozym 303 nitrifying bacteria activator for rapid cycling and biological filtration.',
    variants: [
      { id: '5-ampules', name: 'Biozym 303 — 5 Ampule Box', inStock: true, specs: { Packaging: '5 Ampules', Price: '₹1,450', 'Compare-at': '₹1,800', Function: 'Nitrifying bacteria activator' } },
      { id: '20-ampules', name: 'Biozym 303 — 20 Ampule Box', inStock: true, specs: { Packaging: '20 Ampules', Price: '₹4,000', 'Compare-at': '₹4,500', Function: 'Rapid cycling biological filtration' } },
    ],
    images: ['/images/products/biozym-303-ampules.jpg']`
  );
  console.log('Added Biozym 303 variants!');
}

fs.writeFileSync('./lib/data/products.ts', content, 'utf8');
console.log('Finished updating lib/data/products.ts');
