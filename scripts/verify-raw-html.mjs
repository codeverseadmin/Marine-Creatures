import { promises as fs } from 'fs';

const TARGET_URLS = [
  { name: 'Nemo E450', url: 'http://localhost:3000/marketplace/nemo-e450' },
  { name: 'Nemo E600', url: 'http://localhost:3000/marketplace/nemo-e600' },
  { name: 'Purple Tang (Large)', url: 'http://localhost:3000/marketplace/purple-tang-l' },
  { name: 'Sunsun JTP-3800 (Official Slug)', url: 'http://localhost:3000/marketplace/sunsun-pump-jtp3800' },
  { name: 'Bubble Magus QQ2', url: 'http://localhost:3000/marketplace/bubble-magus-qq2' }
];

async function inspectRawHtml() {
  const results = {};

  for (const target of TARGET_URLS) {
    try {
      const res = await fetch(target.url);
      const status = res.status;
      const html = await res.text();

      // 1. Title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : null;

      // 2. Meta Description
      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
      const metaDescription = descMatch ? descMatch[1] : null;

      // 3. Canonical
      const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i) ||
                             html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);
      const canonical = canonicalMatch ? canonicalMatch[1] : null;

      // 4. H1
      const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());

      // 5. Product Name presence
      const hasProductName = h1Matches.length > 0 && h1Matches[0].length > 0;

      // 6. Meaningful Product Description in visible / rendered text
      // Checking for <p class="..."> containing substantial description
      const hasMeaningfulDesc = html.includes('leading-relaxed') && 
        (html.includes('NemoLight') || html.includes('Zebrasoma') || html.includes('variable-frequency') || html.includes('protein skimmer'));

      // 7. Important Specifications
      const hasSpecs = html.includes('Technical') || html.includes('Specifications') || html.includes('Reef Compatibility') || html.includes('Water Temperature');

      // 8. JSON-LD scripts
      const jsonLdBlocks = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => {
        try {
          return JSON.parse(m[1]);
        } catch (e) {
          return { error: 'invalid json', raw: m[1] };
        }
      });

      // 9. Image URL
      const hasImageUrl = html.includes('/images/products/') || html.includes('https://marine-creatures-krgsrl5sn-codeverse1.vercel.app/images/products/');

      // 10. Internal Links
      const hasInternalLinks = html.includes('href="/marketplace"') && (html.includes('href="/services"') || html.includes('href="/aquarium-design"') || html.includes('href="/shipping-policy"'));

      results[target.name] = {
        url: target.url,
        httpStatus: status,
        title,
        metaDescription,
        canonical,
        h1Count: h1Matches.length,
        h1Text: h1Matches[0] || null,
        hasProductName,
        hasMeaningfulDesc,
        hasSpecs,
        jsonLdCount: jsonLdBlocks.length,
        jsonLdTypes: jsonLdBlocks.map(b => b['@type']),
        hasImageUrl,
        hasInternalLinks,
        rawHtmlLength: html.length
      };
    } catch (err) {
      results[target.name] = {
        url: target.url,
        error: err.message
      };
    }
  }

  await fs.writeFile('scripts/raw-html-audit.json', JSON.stringify(results, null, 2));
  console.log('Raw HTML audit completed: scripts/raw-html-audit.json');
  console.log(JSON.stringify(results, null, 2));
}

inspectRawHtml();
