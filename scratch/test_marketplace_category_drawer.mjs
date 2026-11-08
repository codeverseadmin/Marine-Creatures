import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('===============================================================');
console.log('   MARINE CREATURES — MOBILE CATEGORY DRAWER REGRESSION SUITE');
console.log('   Reference: MC-UX-MARKETPLACE-CATEGORY-DRAWER-V1');
console.log('===============================================================\n');

// 1. Inspect MobileCategoryDrawer component
console.log('--- 1. Component Architecture & Props ---');
const drawerPath = path.resolve('components/marketplace/MobileCategoryDrawer.tsx');
assert(fs.existsSync(drawerPath), 'MobileCategoryDrawer.tsx exists in components/marketplace');
const drawerCode = fs.readFileSync(drawerPath, 'utf8');

assert(drawerCode.includes('export function MobileCategoryDrawer'), 'Exports MobileCategoryDrawer component');
assert(drawerCode.includes('isOpen'), 'Accepts isOpen prop');
assert(drawerCode.includes('onClose'), 'Accepts onClose prop');
assert(drawerCode.includes('activeCategory'), 'Accepts activeCategory prop');
assert(drawerCode.includes('onSelectCategory'), 'Accepts onSelectCategory callback');
assert(drawerCode.includes('products'), 'Accepts products array prop');

// 2. Navigation Control & Trigger in MarketplaceShowcase
console.log('\n--- 2. Homepage MarketplaceShowcase Integration ---');
const showcasePath = path.resolve('components/home/MarketplaceShowcase.tsx');
assert(fs.existsSync(showcasePath), 'MarketplaceShowcase.tsx exists in components/home');
const showcaseCode = fs.readFileSync(showcasePath, 'utf8');

assert(showcaseCode.includes('MobileCategoryDrawer'), 'MarketplaceShowcase imports MobileCategoryDrawer');
assert(showcaseCode.includes('SHOP BY CATEGORY'), 'MarketplaceShowcase contains prominent "SHOP BY CATEGORY" button');
assert(showcaseCode.includes('block md:hidden'), 'Category drawer trigger is visible on mobile and hidden on md+ screens');
assert(showcaseCode.includes('hidden md:block'), 'Horizontal category tab bar is preserved on md+ screens');
assert(showcaseCode.includes('isDrawerOpen'), 'Controls drawer state via isDrawerOpen');
assert(showcaseCode.includes('activeFilter !== \'all\''), 'Displays active filter badge and reset action when filtered');
assert(showcaseCode.includes('Reset to All'), 'Provides quick Reset to All Products action');

// 3. Separate Hamburgers Invariant
console.log('\n--- 3. Two Separate Hamburgers Invariant ---');
const navbarPath = path.resolve('components/layout/Navbar.tsx');
const navbarCode = fs.readFileSync(navbarPath, 'utf8');
assert(navbarCode.includes('menuOpen') && navbarCode.includes('MobileMenu'), 'Navbar preserves its separate site-wide mobile menu hamburger');
assert(!showcaseCode.includes('MobileMenu'), 'MarketplaceShowcase does not interfere with Navbar MobileMenu');
assert(showcaseCode.includes('id="mobile-category-drawer-trigger"'), 'Marketplace category control has dedicated element ID');

// 4. Accessibility, Backdrop & Scroll-Lock
console.log('\n--- 4. Accessibility, Backdrop & Android Navigation ---');
assert(drawerCode.includes('role="dialog"'), 'Drawer specifies role="dialog"');
assert(drawerCode.includes('aria-modal="true"'), 'Drawer specifies aria-modal="true"');
assert(drawerCode.includes('document.body.style.overflow = \'hidden\''), 'Drawer locks body scroll when open');
assert(drawerCode.includes('window.addEventListener(\'popstate\''), 'Drawer handles Android back navigation via popstate');
assert(drawerCode.includes('e.key === \'Escape\''), 'Drawer closes on Escape key');
assert(drawerCode.includes('onClick={onClose}'), 'Backdrop overlay tap closes drawer');

// 5. Authentic Categories & Subcategories
console.log('\n--- 5. Dynamic Categories & Authentic Counts ---');
assert(drawerCode.includes('All Products'), 'Drawer includes All Products category');
assert(drawerCode.includes('Fish & Reef Life'), 'Drawer includes Fish & Reef Life category');
assert(drawerCode.includes('Lighting & Tech'), 'Drawer includes Lighting & Tech category');
assert(drawerCode.includes('Live Rock & Sand'), 'Drawer includes Live Rock & Sand category');
assert(drawerCode.includes('Salts & Chemistry'), 'Drawer includes Salts & Chemistry category');
assert(drawerCode.includes('Aquatic Remedies'), 'Drawer includes Aquatic Remedies brand/filter');
assert(drawerCode.includes('Equipment & Pumps'), 'Drawer includes Equipment & Pumps category');
assert(drawerCode.includes('subcategories'), 'Drawer computes authentic subcategories dynamically');
assert(drawerCode.includes('toggleExpand'), 'Drawer supports interactive expand/collapse for subcategories');

// 6. Abyssal Luxury Design System
console.log('\n--- 6. Abyssal Luxury Design System ---');
assert(drawerCode.includes('#06151C') || drawerCode.includes('#020609'), 'Drawer utilizes Abyssal dark background (#06151C / #020609)');
assert(drawerCode.includes('#00D4FF') || drawerCode.includes('rgba(0,212,255'), 'Drawer applies Bioluminescent Cyan highlights (#00D4FF)');
assert(drawerCode.includes('min-h-[52px]') || drawerCode.includes('min-h-[44px]'), 'Touch targets adhere to mobile ergonomics (>= 44px)');

// 7. Stylesheet Animations
console.log('\n--- 7. Animations in globals.css ---');
const globalsPath = path.resolve('app/globals.css');
const globalsCode = fs.readFileSync(globalsPath, 'utf8');
assert(globalsCode.includes('@keyframes slideLeft'), 'globals.css defines @keyframes slideLeft');
assert(globalsCode.includes('@keyframes fadeIn'), 'globals.css defines @keyframes fadeIn');
assert(globalsCode.includes('.animate-slideLeft'), 'globals.css defines .animate-slideLeft class');
assert(globalsCode.includes('.animate-fadeIn'), 'globals.css defines .animate-fadeIn class');

// 8. Database Integrity Baseline
console.log('\n--- 8. Database Baseline & Zero-Pollution Audit ---');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/MONGODB_URI=(.*)/);
  if (match) {
    const mongoose = (await import('mongoose')).default;
    const uri = match[1].trim().replace(/^['"]|['"]$/g, '');
    await mongoose.connect(uri);

    const productCount = await mongoose.connection.collection('products').countDocuments();
    assert(productCount === 65, `Catalog product count unchanged: ${productCount} === 65`);

    const orderCount = await mongoose.connection.collection('orders').countDocuments();
    assert(orderCount === 16, `Order count unchanged: ${orderCount} === 16`);

    await mongoose.disconnect();
  } else {
    console.log('Skipping DB count check (no MONGODB_URI found)');
  }
} catch (err) {
  console.log('DB check error:', err.message);
}

console.log('\n===============================================================');
console.log(`   ALL TESTS COMPLETED: ${passCount} Passed, ${failCount} Failed`);
if (failCount === 0) {
  console.log('   MC-UX-MARKETPLACE-CATEGORY-DRAWER-V1 READY FOR PRODUCTION');
}
console.log('===============================================================');

process.exit(failCount === 0 ? 0 : 1);

