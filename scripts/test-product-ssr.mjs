async function inspectPages() {
  const ids = [
    'purple-tang-l',
    'sunsun-pump-jtp3800',
    'bubble-magus-qq2',
    'hikari-bio-pure-fd-mysis-shrimp',
    'blue-treasure-synthetic-reef-sea-salt-6-39kg',
    'bio-block-filter-media',
    'nemo-e450'
  ];

  for (const id of ids) {
    const res = await fetch(`http://localhost:3000/marketplace/${id}`);
    const html = await res.text();

    console.log(`\n=================== /marketplace/${id} ===================`);
    console.log('HTTP Status:', res.status);

    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
    console.log('H1 Headings count:', h1s.length, '->', h1s);

    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    console.log('Page Title:', title);

    const metaDesc = html.match(/<meta name="description" content="(.*?)"/)?.[1];
    console.log('Meta Description:', metaDesc);

    const canonical = html.match(/<link rel="canonical" href="(.*?)"/)?.[1];
    console.log('Canonical:', canonical);

    const hasServiceLink = html.includes('/aquarium-design') || html.includes('/installation') || html.includes('/renovation') || html.includes('/maintenance');
    console.log('Has Architectural Service Connection?', hasServiceLink);

    const jsonLdScripts = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    console.log(`JSON-LD Scripts count: ${jsonLdScripts.length}`);
  }
}

inspectPages().catch(console.error);
