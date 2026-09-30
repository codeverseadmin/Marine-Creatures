import fs from 'fs';

const products = JSON.parse(fs.readFileSync('scripts/catalog-dump.json', 'utf8'));

// Base URL
const BASE_URL = 'https://marine-creatures-krgsrl5sn-codeverse1.vercel.app';

// Define exact SEO rules for each product
function buildProductSeo(p) {
  const isLive = p.itemType === 'live' || p.category === 'marine-life';
  let productType = '';
  let primaryIntent = '';
  let secondaryIntents = [];
  let seoTitle = '';
  let metaDescription = '';
  let h1 = '';
  let subcategory = p.categoryLabel || '';
  let serviceLink = '';
  let serviceText = '';

  // Determine Subcategory & Product Type & Service Connection
  if (p.category === 'marine-life') {
    if (p.id.includes('tang')) {
      productType = 'Marine Aquarium Fish';
      subcategory = 'Surgeonfish / Tangs';
    } else if (p.id.includes('clown')) {
      productType = 'Captive Clownfish';
      subcategory = 'Clownfish Morphs';
    } else if (p.id.includes('angel')) {
      productType = 'Dwarf Angelfish';
      subcategory = 'Pygmy Angelfish';
    } else if (p.id.includes('wrasse')) {
      productType = 'Reef Safe Wrasse';
      subcategory = 'Pest Control Wrasses';
    } else if (p.id.includes('butterfly')) {
      productType = 'Marine Butterflyfish';
      subcategory = 'Specialist Marine Fish';
    } else if (p.id.includes('hogfish')) {
      productType = 'Marine Hogfish';
      subcategory = 'Reef Fish';
    } else if (p.id.includes('cardinal')) {
      productType = 'Banggai Cardinalfish';
      subcategory = 'Peaceful Reef Fish';
    } else if (p.id.includes('foxface')) {
      productType = 'Rabbitfish / Algae Grazer';
      subcategory = 'Herbivorous Marine Life';
    } else if (p.id.includes('damsel')) {
      productType = 'Marine Damselfish';
      subcategory = 'Hardy Marine Fish';
    } else {
      productType = 'Marine Aquarium Fish';
      subcategory = 'Marine Fish';
    }

    primaryIntent = `${p.name.replace(/ \(.*?\)/, '')} marine fish`;
    secondaryIntents = [
      `${p.name.replace(/ \(.*?\)/, '')} aquarium`,
      `${p.name.replace(/ \(.*?\)/, '')} reef tank`,
      p.scientificName ? `${p.scientificName} care` : '',
      'quarantined marine fish India',
    ].filter(Boolean);

    seoTitle = `${p.name} | ${productType}`;
    h1 = `${p.name} Marine Fish`;

    const origin = p.origin || p.specifications?.['Geographical Origin'] || 'Indo-Pacific';
    const minTank = p.careGuide?.minimumTankSize || 'suitable reef aquarium';
    const diet = p.careGuide?.diet || 'balanced marine diet';
    const sci = p.scientificName ? ` (${p.scientificName})` : '';

    metaDescription = `Certified quarantined ${p.name}${sci} from the ${origin}. Requires a ${minTank}. Conditioned for ${diet.slice(0, 45).toLowerCase()} at Marine Creatures.`;

    serviceLink = '/aquarium-design';
    serviceText = 'Commission Bespoke Living Reef Aquarium Design';
  } else if (p.category === 'lighting-tech') {
    productType = 'Marine Aquarium Light';
    subcategory = 'Marine LED Fixtures';
    primaryIntent = `${p.name} aquarium light`;
    secondaryIntents = [
      `${p.name} marine light`,
      'marine aquarium LED light',
      'reef tank lighting India',
    ];
    seoTitle = `${p.name} | ${productType}`;
    h1 = `${p.name} Marine Aquarium Light`;

    const tankLen = p.specifications?.['Recommended Tank Length'] || p.specifications?.['Suitable Length'] || 'marine reef systems';
    const control = p.specifications?.['Control Method'] || 'precision spectrum diodes';

    metaDescription = `${p.name} engineered for ${tankLen}. Features ${control.toLowerCase()} to support SPS and LPS coral fluorescence at Marine Creatures.`;

    serviceLink = '/aquarium-design';
    serviceText = 'Explore Custom Aquarium Design & Lighting Placement';
  } else if (p.category === 'hardware') {
    if (p.id.includes('pump') || p.id.includes('jtp') || p.id.includes('jdp')) {
      productType = 'Controllable Aquarium Pump';
      subcategory = 'Return Pumps';
      primaryIntent = `${p.name} aquarium pump`;
      secondaryIntents = [
        `${p.brand || 'Sunsun'} ${p.name.split(' ')[1] || 'pump'}`,
        'submersible aquarium return pump',
        'marine sump pump India',
      ];
      h1 = `${p.name}`;
      const flow = p.specifications?.['Flow Rate'] || p.specifications?.['Max Flow Rate'] || 'high-efficiency flow';
      const power = p.specifications?.['Power Consumption'] || 'energy-efficient DC motor';
      metaDescription = `${p.name} delivering ${flow} with ${power}. Ideal for marine sumps, closed loops, and silent return plumbing at Marine Creatures.`;
      serviceLink = '/installation';
      serviceText = 'Turnkey Marine Sump & Schedule 80 Plumbing Installation';
    } else if (p.id.includes('skimmer') || p.id.includes('qq2') || p.id.includes('mini-q')) {
      productType = 'Protein Skimmer';
      subcategory = 'Internal Protein Skimmers';
      primaryIntent = `${p.name} protein skimmer`;
      secondaryIntents = [
        `${p.brand || 'Bubble Magus'} nano skimmer`,
        'nano reef protein skimmer',
        'internal marine aquarium skimmer',
      ];
      h1 = `${p.name}`;
      const cap = p.specifications?.['Recommended Aquarium Volume'] || p.specifications?.['Capacity'] || 'nano marine aquariums';
      metaDescription = `${p.name} engineered for ${cap}. Features precision micro-bubble contact for organic waste removal in nano reefs at Marine Creatures.`;
      serviceLink = '/installation';
      serviceText = 'Precision Marine Filtration Installation & Tuning';
    } else if (p.id.includes('wavemaker') || p.id.includes('jvp')) {
      productType = 'Dual-Head Wavemaker';
      subcategory = 'Circulation Pumps';
      primaryIntent = `${p.name} wavemaker`;
      secondaryIntents = [
        'dual head aquarium wavemaker',
        'marine reef circulation pump',
        'aquarium water flow pump',
      ];
      h1 = `${p.name}`;
      const flow = p.specifications?.['Flow Rate'] || 'high-volume turbulent circulation';
      metaDescription = `${p.name} providing ${flow}. Dual articulating directional nozzles eliminate dead zones across SPS/LPS reefs at Marine Creatures.`;
      serviceLink = '/renovation';
      serviceText = 'Aquarium Flow Optimization & Dead-Zone Elimination';
    } else {
      productType = 'Internal Power Filter';
      subcategory = 'Internal Filters';
      primaryIntent = `${p.name} internal filter`;
      secondaryIntents = [
        'compact aquarium internal filter',
        'aquarium mechanical filtration',
      ];
      h1 = `${p.name}`;
      metaDescription = `${p.name} compact mechanical and biological internal filter. Verified technical specifications available at Marine Creatures.`;
      serviceLink = '/installation';
      serviceText = 'Consult on Marine Equipment Installation';
    }
    seoTitle = `${p.name} | ${productType}`;
  } else if (p.category === 'rock-sand') {
    if (p.id.includes('sand')) {
      productType = 'Marine Aquarium Substrate';
      subcategory = 'Aragonite Coral Sand';
      primaryIntent = 'Blue Treasure coral sand aquarium';
      secondaryIntents = [
        'natural aragonite sand marine aquarium',
        'calcium carbonate reef substrate',
        'marine aquarium sand India',
      ];
      h1 = `${p.name}`;
      const grain = p.specifications?.['Grain Size'] || 'natural calcium carbonate grain';
      metaDescription = `${p.name} with ${grain}. Natural pH-buffering aragonite substrate promoting beneficial nitrifying bacteria at Marine Creatures.`;
      serviceLink = '/aquarium-design';
      serviceText = 'Incorporate Natural Substrates into Custom Aquarium Design';
    } else {
      productType = 'Dry Reef Rock';
      subcategory = 'Aquascaping Rock';
      primaryIntent = 'Fiji dry reef rock aquarium';
      secondaryIntents = [
        'porous branch rock marine aquarium',
        'natural reef rock aquascaping',
        'fiji rock for reef tank',
      ];
      h1 = `${p.name}`;
      metaDescription = `${p.name}. Highly porous natural branch architecture for biological colonization and stable coral perches at Marine Creatures.`;
      serviceLink = '/aquarium-design';
      serviceText = 'Bespoke Architectural Reef Aquascaping & Hardscaping';
    }
    seoTitle = `${p.name} | ${productType}`;
  } else if (p.category === 'salt-chemistry') {
    if (p.id.includes('salt')) {
      productType = 'Synthetic SPS Reef Salt';
      subcategory = 'Reef Sea Salt';
      primaryIntent = 'Blue Treasure reef salt marine aquarium';
      secondaryIntents = [
        'synthetic sea salt mix coral reef',
        'SPS grade marine aquarium salt',
        'aquarium salt mix India',
      ];
      h1 = `${p.name}`;
      metaDescription = `${p.name}. Engineered for SPS coral growth with elevated calcium, magnesium, and trace elements at Marine Creatures.`;
      serviceLink = '/maintenance';
      serviceText = 'White-Glove Water Chemistry & Salinity Maintenance';
    } else if (p.id.includes('cupramine') || p.id.includes('calcium')) {
      productType = p.id.includes('cupramine') ? 'Quarantine & Parasite Control' : 'Reef Mineral Supplement';
      subcategory = 'Water Chemistry & Additives';
      primaryIntent = `${p.name} marine aquarium`;
      secondaryIntents = [
        p.id.includes('cupramine') ? 'marine ich velvet treatment' : 'concentrated calcium for corals',
        'Seachem marine additives India',
      ];
      h1 = `${p.name}`;
      metaDescription = `${p.name}. Professional-grade marine water formulation for precise parameter control in reef systems at Marine Creatures.`;
      serviceLink = '/maintenance';
      serviceText = 'Concierge Water Testing & Supplement Dosing';
    } else if (p.id.includes('refractometer') || p.id.includes('copper')) {
      productType = p.id.includes('refractometer') ? 'Optical Salinity Refractometer' : 'Marine Water Test Kit';
      subcategory = 'Testing & Precision Instruments';
      primaryIntent = p.id.includes('refractometer') ? 'marine aquarium refractometer salinity' : 'Seachem copper test kit marine';
      secondaryIntents = [
        'optical salinity tester aquarium',
        'marine water testing tools India',
      ];
      h1 = `${p.name}`;
      metaDescription = `${p.name}. Precision optical or chemical testing instrument for critical marine water parameters at Marine Creatures.`;
      serviceLink = '/maintenance';
      serviceText = 'Schedule Precision Water Quality Diagnostic';
    } else if (p.id.includes('hikari') || p.id.includes('ocean-nutrition') || p.id.includes('phytoplankton')) {
      productType = p.id.includes('phytoplankton') ? 'Live Coral Nutrition' : 'Premium Marine Fish Food';
      subcategory = 'Marine Nutrition & Feeds';
      primaryIntent = `${p.name} marine food`;
      secondaryIntents = [
        'marine fish pellets flakes India',
        'freeze dried mysis marine fish',
        'live phytoplankton reef corals',
      ];
      h1 = `${p.name}`;
      metaDescription = `${p.name}. Scientifically formulated nutrition delivering essential fatty acids and protein for marine life at Marine Creatures.`;
      serviceLink = '/maintenance';
      serviceText = 'Custom Marine Dietary & Feeding Protocol Consulting';
    } else if (p.id.includes('resin') || p.id.includes('by-par') || p.id.includes('amozorb') || p.id.includes('zeolite')) {
      productType = 'Chemical Filter Media';
      subcategory = 'Chemical Adsorbent Media';
      primaryIntent = `${p.name} filter media`;
      secondaryIntents = [
        'aquarium ammonia adsorbent',
        'chemical resin filter marine aquarium',
        'water clarification filter media',
      ];
      h1 = `${p.name}`;
      metaDescription = `${p.name}. High-capacity chemical adsorbent targeting dissolved organics and ammonia in marine aquariums at Marine Creatures.`;
      serviceLink = '/renovation';
      serviceText = 'Aquarium Crash Recovery & Chemical Filtration Overhaul';
    } else {
      productType = 'Biological Filter Media';
      subcategory = 'Biological Filtration';
      primaryIntent = `${p.name} bio media`;
      secondaryIntents = [
        'sintered ceramic bio media marine',
        'high surface area biological media',
        'aquarium nitrifying media India',
      ];
      h1 = `${p.name}`;
      metaDescription = `${p.name}. Ultra-porous sintered media delivering expansive surface area for nitrifying colonies in marine filters at Marine Creatures.`;
      serviceLink = '/renovation';
      serviceText = 'Biological Filter Colonization & Renovation Protocol';
    }
    seoTitle = `${p.name} | ${productType}`;
  }

  // Ensure title isn't excessively long
  if (seoTitle.length > 60) {
    // Keep it concise
    seoTitle = `${p.name.slice(0, 35)} | ${productType}`;
  }

  // Related products logic (deterministic)
  const relatedProductIds = products
    .filter(other => other.id !== p.id && (other.category === p.category || p.recommendedPairings?.includes(other.id)))
    .slice(0, 4)
    .map(other => other.id);

  const imageAlt = p.imageStatus === 'NEEDS_MEDIA_ASSET'
    ? `${p.name} — Technical Specification Graphic`
    : p.scientificName
      ? `${p.name} (${p.scientificName}) marine specimen`
      : `${p.name} — ${productType}`;

  return {
    id: p.id,
    name: p.name,
    scientificName: p.scientificName || 'N/A',
    brand: p.brand || (p.researchStatus === 'NEEDS_REVIEW' ? 'Unbranded / Custom' : 'Marine Creatures Selected'),
    model: p.specifications?.['Model'] || p.specifications?.['Fixture Model'] || 'N/A',
    category: p.category,
    categoryLabel: p.categoryLabel,
    subcategory,
    productType,
    primaryIntent,
    secondaryIntents,
    seoTitle,
    metaDescription,
    h1,
    canonical: `${BASE_URL}/marketplace/${p.id}`,
    imageStatus: p.imageStatus || 'VERIFIED',
    imageFile: p.images?.[0] || 'NONE',
    imageAlt,
    researchStatus: p.researchStatus || 'READY',
    serviceLink,
    serviceText,
    relatedProductIds,
    hasCareGuide: !!p.careGuide,
    hasInstallationGuide: !!p.installationGuide,
    specsCount: Object.keys(p.specifications || {}).length,
  };
}

const allSeoData = products.map(buildProductSeo);
console.log(`Generated SEO data for ${allSeoData.length} products.`);

// Verify uniqueness of titles and meta descriptions
const titles = new Set();
const duplicateTitles = [];
allSeoData.forEach(d => {
  if (titles.has(d.seoTitle)) duplicateTitles.push(d.seoTitle);
  titles.add(d.seoTitle);
});

const descs = new Set();
const duplicateDescs = [];
allSeoData.forEach(d => {
  if (descs.has(d.metaDescription)) duplicateDescs.push(d.metaDescription);
  descs.add(d.metaDescription);
});

console.log(`Unique titles count: ${titles.size} / ${allSeoData.length}`);
console.log(`Duplicate titles:`, duplicateTitles);
console.log(`Unique descriptions count: ${descs.size} / ${allSeoData.length}`);
console.log(`Duplicate descriptions:`, duplicateDescs);

fs.writeFileSync('scripts/generated-seo-data.json', JSON.stringify(allSeoData, null, 2));
console.log('Saved to scripts/generated-seo-data.json');
