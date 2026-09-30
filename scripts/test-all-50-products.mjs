import fs from 'fs';

async function testAllProducts() {
  const products = JSON.parse(fs.readFileSync('scripts/catalog-dump.json', 'utf8'));
  console.log(`Starting automated validation across all ${products.length} active products...\n`);

  const results = [];
  const titles = new Set();
  const descriptions = new Set();

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const url = `http://localhost:3000/marketplace/${p.id}`;

    try {
      const res = await fetch(url);
      const html = await res.text();

      const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
      const title = html.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const metaDesc = html.match(/<meta name="description" content="(.*?)"/)?.[1] || '';
      const canonical = html.match(/<link rel="canonical" href="(.*?)"/)?.[1] || '';
      const hasProductSchema = html.includes('"@type":"Product"');
      const hasBreadcrumbSchema = html.includes('"@type":"BreadcrumbList"');
      const hasServiceLink = html.includes('/aquarium-design') || html.includes('/installation') || html.includes('/renovation') || html.includes('/maintenance');

      const isTitleDuplicate = titles.has(title);
      titles.add(title);

      const isDescDuplicate = descriptions.has(metaDesc);
      descriptions.add(metaDesc);

      const passed =
        res.status === 200 &&
        h1Matches.length === 1 &&
        title.length > 5 &&
        metaDesc.length > 20 &&
        canonical.includes(`/marketplace/${p.id}`) &&
        hasProductSchema &&
        hasBreadcrumbSchema &&
        !isTitleDuplicate &&
        !isDescDuplicate;

      results.push({
        index: i + 1,
        id: p.id,
        name: p.name,
        status: res.status,
        h1Count: h1Matches.length,
        h1: h1Matches[0] || 'NONE',
        title,
        metaDesc,
        canonical,
        hasProductSchema,
        hasBreadcrumbSchema,
        hasServiceLink,
        passed,
      });

      if (!passed) {
        console.error(`❌ FAIL [${i + 1}/${products.length}] ${p.id}: Status=${res.status}, H1Count=${h1Matches.length}, TitleDup=${isTitleDuplicate}, DescDup=${isDescDuplicate}`);
      } else {
        console.log(`✓ PASS [${i + 1}/${products.length}] ${p.id}`);
      }
    } catch (err) {
      console.error(`❌ ERROR [${i + 1}/${products.length}] ${p.id}:`, err.message);
      results.push({
        index: i + 1,
        id: p.id,
        name: p.name,
        status: 'FETCH_ERROR',
        passed: false,
        error: err.message,
      });
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  console.log(`\n================ VALIDATION SUMMARY ================`);
  console.log(`Total Products Tested: ${results.length}`);
  console.log(`Passed (100% compliant): ${passedCount}`);
  console.log(`Failed: ${results.length - passedCount}`);
  console.log(`Unique Titles: ${titles.size}`);
  console.log(`Unique Descriptions: ${descriptions.size}`);

  fs.writeFileSync('scripts/validation-results.json', JSON.stringify(results, null, 2));
}

testAllProducts().catch(console.error);
