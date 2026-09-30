async function checkSsrContent() {
  const res = await fetch('http://localhost:3000/marketplace/purple-tang-l');
  const html = await res.text();

  console.log('HTML length:', html.length);
  console.log('Does HTML contain visible h1?', html.includes('<h1 class="font-display'));
  console.log('Does HTML contain visible care parameters?', html.includes('Temp: <strong class="text-white font-sans">24°C - 26°C</strong>'));
  console.log('Does HTML contain visible specs table?', html.includes('Specimen Size') && html.includes('Red Sea'));
  console.log('Does HTML contain visible service consultation link?', html.includes('Commission Bespoke Living Reef Aquarium Design'));
  console.log('Does HTML contain visible description?', html.includes('Vibrant cobalt-purple body with brilliant canary-yellow tail'));
}

checkSsrContent().catch(console.error);
