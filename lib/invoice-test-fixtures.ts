/**
 * Isolated QA Test Fixtures for Executive Invoice & WhatsApp Flow
 *
 * Synthetic test data guaranteeing 100% isolation from production customer records.
 * Contains:
 *  1. QA_STANDARD_FIXTURE — Standard 2-item consignment fitting cleanly on 1 A4 page.
 *  2. QA_MULTIPAGE_FIXTURE — Large 22-item consignment requiring exactly 2 A4 pages.
 *
 * ZERO production customer data or real PII is used.
 */

import { ExecutiveInvoiceOrderData } from './invoice-pdf-template';

export const QA_STANDARD_FIXTURE: ExecutiveInvoiceOrderData = {
  id: 'MC-QA-ISOLATED-STANDARD',
  customerName: 'QA Synthetic Collector',
  phone: '9800000001',
  address: 'Aquatic Research Lab 4, Marine Bio Complex',
  city: 'Bengaluru',
  pincode: '560001',
  orderNotes: 'Handle with insulated cold packs. Verification test consignment.',
  items: [
    {
      name: 'Purple Tang (Zebrasoma xanthurum)',
      price: 18500,
      quantity: 1,
      categoryLabel: 'Acanthuridae / Marine Livestock',
    },
    {
      name: 'Flameback Angelfish (Centropyge aurantonotus)',
      price: 9200,
      quantity: 2,
      categoryLabel: 'Pomacanthidae / Marine Livestock',
    },
  ],
  totalAmount: 36900,
  subtotal: 36900,
  courierName: 'IndiGo CarGo Priority',
  awbNumber: 'AWB-BLR-88192',
  estimatedDelivery: 'Express 24 Hours',
  invoiceNumber: 'INV-MC-QA-STANDARD',
  isApproved: true,
  approvedAt: '07 October 2026',
  createdAt: '07 October 2026',
};

// Generate 22 realistic marine specimen items for multi-page verification
const multiPageItems = [
  { name: 'Purple Tang (Zebrasoma xanthurum)', price: 18500, quantity: 1, categoryLabel: 'Surgeonfish' },
  { name: 'Sohal Tang (Acanthurus sohal)', price: 24000, quantity: 1, categoryLabel: 'Surgeonfish' },
  { name: 'Flameback Angelfish (Centropyge aurantonotus)', price: 9200, quantity: 2, categoryLabel: 'Dwarf Angel' },
  { name: 'Achilles Tang (Acanthurus achilles)', price: 38000, quantity: 1, categoryLabel: 'Surgeonfish' },
  { name: 'Regal Angelfish (Pygoplites diacanthus)', price: 16500, quantity: 1, categoryLabel: 'Large Angel' },
  { name: 'Blonde Naso Tang (Naso elegans)', price: 14500, quantity: 1, categoryLabel: 'Surgeonfish' },
  { name: 'Powder Blue Tang (Acanthurus leucosternon)', price: 11000, quantity: 2, categoryLabel: 'Surgeonfish' },
  { name: 'Chevron Tang (Ctenochaetus hawaiiensis)', price: 29000, quantity: 1, categoryLabel: 'Bristletooth' },
  { name: 'Gem Tang (Zebrasoma gemmatum)', price: 85000, quantity: 1, categoryLabel: 'Rare Surgeonfish' },
  { name: 'Potter Angelfish (Centropyge potteri)', price: 22000, quantity: 1, categoryLabel: 'Hawaiian Endemic' },
  { name: 'Conspicuous Angelfish (Chaetodontoplus conspicillatus)', price: 145000, quantity: 1, categoryLabel: 'Ultra Rare' },
  { name: 'Mystery Wrasse (Pseudocheilinus ocellatus)', price: 18000, quantity: 1, categoryLabel: 'Cryptic Wrasse' },
  { name: 'Lineatus Fairy Wrasse (Cirrhilabrus lineatus)', price: 26000, quantity: 1, categoryLabel: 'Fairy Wrasse' },
  { name: 'Rhomboid Fairy Wrasse (Cirrhilabrus rhomboidalis)', price: 32000, quantity: 1, categoryLabel: 'Fairy Wrasse' },
  { name: 'Helfrichi Firefish (Nemateleotris helfrichi)', price: 17500, quantity: 2, categoryLabel: 'Deepwater Goby' },
  { name: 'Yasha Goby & Pistol Shrimp Pair (Stonogobiops yasha)', price: 12500, quantity: 1, categoryLabel: 'Symbiosis Pair' },
  { name: 'Copperband Butterfly (Chelmon rostratus)', price: 8500, quantity: 1, categoryLabel: 'Butterflyfish' },
  { name: 'Tinkeri Butterfly (Chaetodon tinkeri)', price: 68000, quantity: 1, categoryLabel: 'Deep Reef Butterfly' },
  { name: 'Black Tang (Zebrasoma rostratum)', price: 95000, quantity: 1, categoryLabel: 'Rare Surgeonfish' },
  { name: 'Golden Dwarf Moray (Gymnothorax melatremus)', price: 42000, quantity: 1, categoryLabel: 'Mini Moray' },
  { name: 'Candy Basslet (Liopropoma carmabi)', price: 115000, quantity: 1, categoryLabel: 'Ultra Reef Fish' },
  { name: 'Multibar Angelfish (Paracentropyge multifasciata)', price: 16000, quantity: 1, categoryLabel: 'Deepwater Angel' },
];

const multiPageSubtotal = multiPageItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);

export const QA_MULTIPAGE_FIXTURE: ExecutiveInvoiceOrderData = {
  id: 'MC-QA-ISOLATED-MULTIPAGE',
  customerName: 'High-Capacity Aquaculture Facility QA',
  phone: '9800000002',
  address: 'Holding Facility Bay 7, East Pier Biosphere Complex, Sector 9',
  city: 'Mumbai',
  pincode: '400001',
  orderNotes: 'Comprehensive multi-species batch consignment. Temperature logging enabled.',
  items: multiPageItems,
  subtotal: multiPageSubtotal,
  totalAmount: multiPageSubtotal,
  courierName: 'IndiGo CarGo Priority Express Charter',
  awbNumber: 'AWB-BOM-77291',
  estimatedDelivery: 'Charter Priority 12 Hours',
  invoiceNumber: 'INV-MC-QA-MULTIPAGE',
  isApproved: true,
  approvedAt: '08 October 2026',
  createdAt: '08 October 2026',
};

