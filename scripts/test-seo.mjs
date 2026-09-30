import http from 'http';

async function fetchUrl(path) {
  const url = `http://localhost:3000${path}`;
  const res = await fetch(url);
  const text = await res.text();
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), text };
}

async function run() {
  console.log('Testing SEO Endpoints...\n');

  // 1. robots.txt
  const robots = await fetchUrl('/robots.txt');
  console.log('--- /robots.txt ---');
  console.log(`Status: ${robots.status}`);
  console.log(robots.text.trim());
  console.log('\n');

  // 2. sitemap.xml
  const sitemap = await fetchUrl('/sitemap.xml');
  console.log('--- /sitemap.xml ---');
  console.log(`Status: ${sitemap.status}`);
  const sitemapUrls = (sitemap.text.match(/<loc>(.*?)<\/loc>/g) || []).map(m => m.replace(/<\/?loc>/g, ''));
  console.log(`Total URLs in sitemap: ${sitemapUrls.length}`);
  console.log('Sample URLs:');
  sitemapUrls.slice(0, 10).forEach(u => console.log('  ' + u));
  console.log('Lighting hub in sitemap?', sitemapUrls.some(u => u.includes('/marketplace/lighting')));
  console.log('Nemo aliases in sitemap?', sitemapUrls.some(u => u.includes('nemo-e450')));
  console.log('\n');

  // 3. /marketplace/lighting
  const lighting = await fetchUrl('/marketplace/lighting');
  console.log('--- /marketplace/lighting ---');
  console.log(`Status: ${lighting.status}`);
  const lightingTitle = lighting.text.match(/<title>(.*?)<\/title>/)?.[1];
  console.log(`Title: ${lightingTitle}`);
  const lightingCanonical = lighting.text.match(/<link rel="canonical" href="(.*?)"/)?.[1];
  console.log(`Canonical: ${lightingCanonical}`);
  console.log('Has ItemList Schema?', lighting.text.includes('"@type":"ItemList"'));
  console.log('Has BreadcrumbList Schema?', lighting.text.includes('"@type":"BreadcrumbList"'));
  console.log('\n');

  // 4. /marketplace/nemo-e450
  const nemoE450 = await fetchUrl('/marketplace/nemo-e450');
  console.log('--- /marketplace/nemo-e450 ---');
  console.log(`Status: ${nemoE450.status}`);
  const nemoTitle = nemoE450.text.match(/<title>(.*?)<\/title>/)?.[1];
  console.log(`Title: ${nemoTitle}`);
  const nemoCanonical = nemoE450.text.match(/<link rel="canonical" href="(.*?)"/)?.[1];
  console.log(`Canonical: ${nemoCanonical}`);
  console.log('Has Product Schema?', nemoE450.text.includes('"@type":"Product"'));
  console.log('Does Product Schema have fake 0 price?', nemoE450.text.includes('"price":0') || nemoE450.text.includes('"price":"0"'));
  console.log('Has BreadcrumbList Schema?', nemoE450.text.includes('"@type":"BreadcrumbList"'));
  console.log('\n');

  // 5. /aquarium-design
  const design = await fetchUrl('/aquarium-design');
  console.log('--- /aquarium-design ---');
  console.log(`Status: ${design.status}`);
  const designTitle = design.text.match(/<title>(.*?)<\/title>/)?.[1];
  console.log(`Title: ${designTitle}`);
  const designCanonical = design.text.match(/<link rel="canonical" href="(.*?)"/)?.[1];
  console.log(`Canonical: ${designCanonical}`);
  console.log('Has Service Schema?', design.text.includes('"@type":"Service"'));
  console.log('Has BreadcrumbList Schema?', design.text.includes('"@type":"BreadcrumbList"'));
  console.log('\n');

  console.log('ALL SEO ENDPOINT TESTS COMPLETED SUCCESSFULLY.');
}

run().catch(console.error);
