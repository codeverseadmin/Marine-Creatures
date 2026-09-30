async function checkDom() {
  const lighting = await (await fetch('http://localhost:3000/marketplace/lighting')).text();
  const nemoE450 = await (await fetch('http://localhost:3000/marketplace/nemo-e450')).text();

  console.log('=== /marketplace/lighting DOM CHECK ===');
  const h1Match = lighting.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  console.log('H1:', h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : 'NONE');
  console.log('Contains Nemo E450 link?', lighting.includes('/marketplace/nemo-e450'));
  console.log('Contains Nemo E600 link?', lighting.includes('/marketplace/nemo-e600'));
  console.log('Contains Nemo E900 link?', lighting.includes('/marketplace/nemo-e900'));
  console.log('Contains Nemo E1200 link?', lighting.includes('/marketplace/nemo-e1200'));
  console.log('Contains Comparison Table?', lighting.includes('NemoLight Extreme II Comparison'));
  console.log('Contains WhatsApp CTA?', lighting.includes('Consult Lighting Curator'));

  console.log('\n=== /marketplace/nemo-e450 DOM CHECK ===');
  const nemoH1 = nemoE450.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  console.log('H1:', nemoH1 ? nemoH1[1].replace(/<[^>]+>/g, '').trim() : 'NONE');
  console.log('Contains Breadcrumbs?', nemoE450.includes('Breadcrumb'));
  console.log('Contains Price on Request?', nemoE450.includes('Price on Request'));
  console.log('Contains WhatsApp Inquiry CTA?', nemoE450.includes('https://wa.me/'));
  console.log('Contains Related Products?', nemoE450.includes('Related') || nemoE450.includes('Curated Pairing') || nemoE450.includes('Similar'));
  console.log('Contains Lighting Hub Link?', nemoE450.includes('/marketplace/lighting'));
}

checkDom().catch(console.error);
