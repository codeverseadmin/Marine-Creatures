/**
 * Isolated QA Test Fixtures for Executive Invoice & WhatsApp Flow
 *
 * Synthetic test data guaranteeing 100% isolation from production customer records.
 * Contains:
 *  1. QA_STANDARD_FIXTURE — Standard 2-item consignment fitting cleanly on 1 A4 page.
 *  2. QA_MULTIPAGE_FIXTURE — Large 22-item consignment requiring exactly 2 A4 pages.
 *  3. QA_POR_FIXTURE — Order with unresolved Price On Request (POR) specimen requiring agreed pricing.
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
  currentStep: 'placed',
  history: [
    { step: 'placed', timestamp: '07 October 2026, 10:00 AM', note: 'Order confirmed and registered' },
  ],
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
  currentStep: 'placed',
  history: [
    { step: 'placed', timestamp: '08 October 2026, 10:00 AM', note: 'Large consignment confirmed' },
  ],
};

export const QA_POR_FIXTURE: ExecutiveInvoiceOrderData = {
  id: 'MC-QA-POR-FIXTURE',
  customerName: 'Rare Marine Bio Sanctuary QA',
  phone: '9800000003',
  address: 'Aquarium Wing 2, Marine Research Lab',
  city: 'Chennai',
  pincode: '600001',
  orderNotes: 'Contains ultra-rare specimen requiring agreed pricing quote before release.',
  items: [
    {
      id: 'item-std-1',
      name: 'Purple Tang (Zebrasoma xanthurum)',
      price: 18500,
      quantity: 1,
      categoryLabel: 'Acanthuridae / Marine Livestock',
      priceOnRequest: false,
    },
    {
      id: 'item-por-1',
      name: 'Conspicuous Angelfish (Chaetodontoplus conspicillatus)',
      price: 0,
      quantity: 1,
      categoryLabel: 'Ultra Rare / POR Specimen',
      priceOnRequest: true,
      pricingStatus: 'PENDING_POR',
    },
  ],
  subtotal: 18500,
  totalAmount: 18500,
  courierName: 'IndiGo CarGo Priority',
  awbNumber: 'AWB-MAA-99001',
  estimatedDelivery: 'Express 24 Hours',
  invoiceNumber: 'INV-MC-QA-POR',
  originalInvoiceNumber: 'INV-MC-QA-POR',
  pricingVersion: 1,
  invoiceRevisions: [],
  isApproved: false,
  currentStep: 'placed',
  hasUnresolvedPorItems: true,
  createdAt: '03 Nov 2026, 01:00 AM',
  history: [
    {
      step: 'placed',
      timestamp: '03 Nov 2026, 01:00 AM',
      note: 'Order confirmed with rare specimen under review',
    },
  ],
};

export const QA_POR_RESOLVED_FIXTURE: ExecutiveInvoiceOrderData = {
  id: 'MC-QA-POR-RESOLVED-FIXTURE',
  customerName: 'Rare Marine Bio Sanctuary QA',
  phone: '9800000003',
  address: 'Aquarium Wing 2, Marine Research Lab',
  city: 'Chennai',
  pincode: '600001',
  orderNotes: 'Agreed pricing quote approved by concierge.',
  items: [
    {
      id: 'item-std-1',
      name: 'Purple Tang (Zebrasoma xanthurum)',
      price: 18500,
      quantity: 1,
      categoryLabel: 'Acanthuridae / Marine Livestock',
      priceOnRequest: false,
    },
    {
      id: 'item-por-1',
      name: 'Conspicuous Angelfish (Chaetodontoplus conspicillatus)',
      price: 145000,
      agreedUnitPrice: 145000,
      quantity: 1,
      categoryLabel: 'Ultra Rare / POR Specimen',
      priceOnRequest: true,
      pricingStatus: 'AGREED',
      pricedAt: '03 Nov 2026, 02:00 AM',
      pricedBy: 'Admin Concierge QA',
    },
  ],
  subtotal: 163500,
  totalAmount: 163500,
  courierName: 'IndiGo CarGo Priority',
  awbNumber: 'AWB-MAA-99001',
  estimatedDelivery: 'Express 24 Hours',
  invoiceNumber: 'INV-MC-QA-POR-RESOLVED',
  originalInvoiceNumber: 'INV-MC-QA-POR-RESOLVED',
  pricingVersion: 1,
  invoiceRevisions: [],
  isApproved: true,
  currentStep: 'packed',
  hasUnresolvedPorItems: false,
  porPricingResolvedAt: '03 Nov 2026, 02:00 AM',
  porPricingResolvedBy: 'Admin Concierge QA',
  createdAt: '03 Nov 2026, 01:00 AM',
  history: [
    { step: 'placed', timestamp: '03 Nov 2026, 01:00 AM', note: 'Order confirmed' },
    { step: 'quarantine', timestamp: '03 Nov 2026, 01:30 AM', note: 'Quarantine check passed' },
    { step: 'packed', timestamp: '03 Nov 2026, 02:00 AM', note: 'Packed in oxygen pod' },
  ],
};

export const QA_FINANCIAL_RECON_FIXTURE: ExecutiveInvoiceOrderData = {
  id: 'MC-QA-FINANCIAL-RECON',
  customerName: 'Synthetic Financial Audit Collector',
  phone: '9800000004',
  address: 'Aquarium Wing 5, Precision Audit Facility',
  city: 'Kolkata',
  pincode: '700001',
  orderNotes: 'Precision financial reconciliation test with fractional decimals and multiple POR units.',
  items: [
    {
      id: 'recon-std-1',
      name: 'Purple Tang (Zebrasoma xanthurum)',
      price: 18500,
      quantity: 1,
      categoryLabel: 'Acanthuridae / Marine Livestock',
      priceOnRequest: false,
    },
    {
      id: 'recon-por-2u',
      name: 'Gem Tang (Zebrasoma gemmatum)',
      price: 0,
      quantity: 2,
      categoryLabel: 'Rare Surgeonfish / POR Specimen',
      priceOnRequest: true,
      pricingStatus: 'PENDING_POR',
    },
    {
      id: 'recon-por-1u',
      name: 'Conspicuous Angelfish (Chaetodontoplus conspicillatus)',
      price: 0,
      quantity: 1,
      categoryLabel: 'Ultra Rare / POR Specimen',
      priceOnRequest: true,
      pricingStatus: 'PENDING_POR',
    },
  ],
  subtotal: 18500,
  totalAmount: 18500,
  courierName: 'IndiGo CarGo Priority',
  awbNumber: 'AWB-CCU-88201',
  estimatedDelivery: 'Express 24 Hours',
  invoiceNumber: 'INV-MC-QA-RECON',
  originalInvoiceNumber: 'INV-MC-QA-RECON',
  pricingVersion: 1,
  invoiceRevisions: [],
  isApproved: false,
  currentStep: 'placed',
  hasUnresolvedPorItems: true,
  createdAt: '03 Nov 2026, 01:00 AM',
  history: [
    { step: 'placed', timestamp: '03 Nov 2026, 01:00 AM', note: 'Order placed with 1 standard, 2 POR units, 1 POR unit' },
  ],
};

export const QA_FINANCIAL_RECON_RESOLVED_FIXTURE: ExecutiveInvoiceOrderData = {
  id: 'MC-QA-FINANCIAL-RECON-RESOLVED',
  customerName: 'Synthetic Financial Audit Collector',
  phone: '9800000004',
  address: 'Aquarium Wing 5, Precision Audit Facility',
  city: 'Kolkata',
  pincode: '700001',
  orderNotes: 'Precision financial reconciliation test with fractional decimals and multiple POR units.',
  items: [
    {
      id: 'recon-std-1',
      name: 'Purple Tang (Zebrasoma xanthurum)',
      price: 18500,
      quantity: 1,
      categoryLabel: 'Acanthuridae / Marine Livestock',
      priceOnRequest: false,
    },
    {
      id: 'recon-por-2u',
      name: 'Gem Tang (Zebrasoma gemmatum)',
      price: 82500.50,
      agreedUnitPrice: 82500.50,
      quantity: 2,
      categoryLabel: 'Rare Surgeonfish / POR Specimen',
      priceOnRequest: true,
      pricingStatus: 'AGREED',
      pricedAt: '03 Nov 2026, 02:00 AM',
      pricedBy: 'Senior Release Auditor',
    },
    {
      id: 'recon-por-1u',
      name: 'Conspicuous Angelfish (Chaetodontoplus conspicillatus)',
      price: 145000,
      agreedUnitPrice: 145000,
      quantity: 1,
      categoryLabel: 'Ultra Rare / POR Specimen',
      priceOnRequest: true,
      pricingStatus: 'AGREED',
      pricedAt: '03 Nov 2026, 02:00 AM',
      pricedBy: 'Senior Release Auditor',
    },
  ],
  subtotal: 328501,
  totalAmount: 328501,
  courierName: 'IndiGo CarGo Priority',
  awbNumber: 'AWB-CCU-88201',
  estimatedDelivery: 'Express 24 Hours',
  invoiceNumber: 'INV-MC-QA-RECON-RESOLVED',
  originalInvoiceNumber: 'INV-MC-QA-RECON-RESOLVED',
  pricingVersion: 1,
  invoiceRevisions: [],
  isApproved: true,
  currentStep: 'quarantine',
  hasUnresolvedPorItems: false,
  porPricingResolvedAt: '03 Nov 2026, 02:00 AM',
  porPricingResolvedBy: 'Senior Release Auditor',
  createdAt: '03 Nov 2026, 01:00 AM',
  history: [
    { step: 'placed', timestamp: '03 Nov 2026, 01:00 AM', note: 'Order placed' },
    { step: 'quarantine', timestamp: '03 Nov 2026, 01:30 AM', note: 'Moved to quarantine following pricing agreement' },
  ],
};

// ── In-Memory Isolated Fixture State Store ───────────────────────────────────
const dynamicFixtureStore = new Map<string, ExecutiveInvoiceOrderData>();

export function getFixture(id: string): ExecutiveInvoiceOrderData | undefined {
  if (dynamicFixtureStore.has(id)) {
    return JSON.parse(JSON.stringify(dynamicFixtureStore.get(id)));
  }

  const base =
    id === 'MC-QA-ISOLATED-STANDARD'
      ? QA_STANDARD_FIXTURE
      : id === 'MC-QA-ISOLATED-MULTIPAGE'
      ? QA_MULTIPAGE_FIXTURE
      : id === 'MC-QA-POR-RESOLVED-FIXTURE'
      ? QA_POR_RESOLVED_FIXTURE
      : id === 'MC-QA-FINANCIAL-RECON'
      ? QA_FINANCIAL_RECON_FIXTURE
      : id === 'MC-QA-FINANCIAL-RECON-RESOLVED'
      ? QA_FINANCIAL_RECON_RESOLVED_FIXTURE
      : id === 'MC-QA-POR-FIXTURE'
      ? QA_POR_FIXTURE
      : undefined;

  return base ? JSON.parse(JSON.stringify(base)) : undefined;
}

export function saveFixture(id: string, fixture: ExecutiveInvoiceOrderData): void {
  dynamicFixtureStore.set(id, JSON.parse(JSON.stringify(fixture)));
}

export function resetAllFixtures(): void {
  dynamicFixtureStore.clear();
}

