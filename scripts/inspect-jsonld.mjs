import fs from 'fs';

async function inspectJsonLd() {
  const products = [
    { name: 'Nemo E450', url: 'http://localhost:3000/marketplace/nemo-e450' },
    { name: 'Nemo E600', url: 'http://localhost:3000/marketplace/nemo-e600' },
    { name: 'Purple Tang', url: 'http://localhost:3000/marketplace/purple-tang-l' },
    { name: 'Sunsun JTP-3800', url: 'http://localhost:3000/marketplace/sunsun-pump-jtp3800' },
    { name: 'Bubble Magus QQ2', url: 'http://localhost:3000/marketplace/bubble-magus-qq2' },
    { name: 'Hikari Mysis Shrimp', url: 'http://localhost:3000/marketplace/hikari-frozen-mysis' },
  ];

  const results = {};

  for (const p of products) {
    const res = await fetch(p.url);
    const html = await res.text();

    const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    
    let productSchema = null;
    let breadcrumbSchema = null;

    for (const jsonStr of jsonLdMatches) {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed['@type'] === 'Product') productSchema = parsed;
        if (parsed['@type'] === 'BreadcrumbList') breadcrumbSchema = parsed;
      } catch (e) {}
    }

    results[p.name] = {
      url: p.url,
      httpStatus: res.status,
      hasProductSchema: !!productSchema,
      productSchema,
    };
  }

  console.log(JSON.stringify(results, null, 2));
  fs.writeFileSync('scripts/jsonld-audit.json', JSON.stringify(results, null, 2));
}

inspectJsonLd().catch(console.error);
