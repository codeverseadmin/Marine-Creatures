import fs from 'fs';

async function verifyPages() {
  console.log('Testing marketplace and product pages on http://localhost:3000...');

  // 1. Marketplace page
  const marketRes = await fetch('http://localhost:3000/marketplace');
  const marketHtml = await marketRes.text();
  console.log(`Marketplace HTTP status: ${marketRes.status}`);

  // Check some expected price strings in HTML
  const checks = [
    { label: '₹6,500 (Nemo / JDP 3500)', str: '₹6,500' },
    { label: '₹2,600 (Sessile / Luminous Aqua)', str: '₹2,600' },
    { label: '₹1,400 (Refractometer / Blue Treasure)', str: '₹1,400' },
    { label: '₹500 (Twirl Tower / Phytoplankton)', str: '₹500' },
    { label: '₹400 (Bacto Block)', str: '₹400' },
    { label: 'Price on Request', str: 'Price on Request' },
  ];

  for (const c of checks) {
    const present = marketHtml.includes(c.str);
    console.log(`Marketplace contains "${c.label}": ${present ? 'YES' : 'NO'}`);
  }

  // 2. Individual Product Detail Pages
  const productSlugs = [
    { slug: 'nemo-extreme-led', expectedPrice: '₹6,500', expectedOrig: '₹7,500', isPOR: false },
    { slug: 'sessile-comet-light', expectedPrice: '₹2,600', expectedOrig: '₹3,000', isPOR: false },
    { slug: 'atc-salinity-refractometer', expectedPrice: '₹1,400', expectedOrig: '₹1,800', isPOR: false },
    { slug: 'sunsun-pump-jtp3800', expectedPrice: null, expectedOrig: null, isPOR: true },
    { slug: 'manual-marine-light', expectedPrice: null, expectedOrig: null, isPOR: true },
    { slug: 'purple-tang-l', expectedPrice: null, expectedOrig: null, isPOR: true },
  ];

  for (const item of productSlugs) {
    const res = await fetch(`http://localhost:3000/marketplace/${item.slug}`);
    const html = await res.text();
    console.log(`\nProduct [${item.slug}] Status: ${res.status}`);

    if (item.isPOR) {
      const hasPOR = html.includes('Price on Request');
      const hasZero = html.includes('₹0');
      console.log(`  Price on Request displayed: ${hasPOR ? 'YES' : 'NO'}`);
      console.log(`  Has ₹0 (should be false): ${hasZero ? 'FAIL (has ₹0)' : 'PASS (no ₹0)'}`);
    } else {
      const hasPrice = html.includes(item.expectedPrice);
      const hasOrig = item.expectedOrig ? html.includes(item.expectedOrig) : true;
      console.log(`  Price "${item.expectedPrice}" displayed: ${hasPrice ? 'YES' : 'NO'}`);
      if (item.expectedOrig) {
        console.log(`  Original/MRP "${item.expectedOrig}" displayed: ${hasOrig ? 'YES' : 'NO'}`);
      }
    }

    // Inspect JSON-LD
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd['@type'] === 'Product') {
          if (item.isPOR) {
            console.log(`  JSON-LD Offer Type: ${jsonLd.offers?.priceSpecification ? 'PriceSpecification (CORRECT)' : 'MISSING'}`);
            console.log(`  JSON-LD has numeric price (should be undefined): ${jsonLd.offers?.price === undefined ? 'PASS (undefined)' : 'FAIL: ' + jsonLd.offers?.price}`);
          } else {
            console.log(`  JSON-LD Offer Price: ${jsonLd.offers?.price} (CORRECT)`);
          }
        }
      } catch (err) {
        console.warn(`  JSON-LD parse warning:`, err.message);
      }
    }
  }
}

verifyPages().catch(console.error);
