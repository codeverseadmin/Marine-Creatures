import { SITE_CONFIG } from '@/lib/config';
import { Product } from '@/lib/data/products';

/**
 * Generates schema.org/Product structured data compliant with Google guidelines.
 * CRITICAL RULE: "Price on Request" products NEVER emit fake price, ₹0, or fabricated ratings.
 */
export function generateProductJsonLd(
  product: Product,
  canonicalUrl: string,
  variantId?: string,
  relatedUrls?: string[]
) {
  const selectedVariant = variantId
    ? product.variants?.find((v) => v.id.toLowerCase() === variantId.toLowerCase())
    : undefined;

  const productName = selectedVariant
    ? `${product.name} — ${selectedVariant.name}`
    : product.name;

  const productDescription = product.description || product.shortDesc;

  // Build absolute image URLs
  const imageUrls = (product.images && product.images.length > 0
    ? product.images
    : ['/og-image.jpg']
  ).map((img) => (img.startsWith('http') ? img : `${SITE_CONFIG.url}${img}`));

  // Structured properties from product specifications
  const additionalProperties = product.specifications
    ? Object.entries(product.specifications).map(([key, value]) => ({
        '@type': 'PropertyValue',
        name: key,
        value: String(value),
      }))
    : [];

  // Add variant specs if selected
  if (selectedVariant?.specs) {
    Object.entries(selectedVariant.specs).map(([key, value]) => {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: key,
        value: String(value),
      });
    });
  }

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: productDescription,
    image: imageUrls,
    url: canonicalUrl,
    category: product.categoryLabel || product.category,
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_CONFIG.name,
    },
    sku: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'INR',
      ...(product.priceOnRequest
        ? {
            priceSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: 'INR',
              description: 'Price on Request via Direct Marine Concierge Quotation',
            },
          }
        : {
            price: selectedVariant?.price !== undefined ? selectedVariant.price : product.price,
          }),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
      },
    },
  };

  if (additionalProperties.length > 0) {
    jsonLd.additionalProperty = additionalProperties;
  }

  // Machine-readable compatibility and related equipment links for REO
  if (relatedUrls && relatedUrls.length > 0) {
    jsonLd.isRelatedTo = relatedUrls.map((url) => ({
      '@type': 'Product',
      url: url.startsWith('http') ? url : `${SITE_CONFIG.url}${url}`,
    }));
  }

  // Authoritative Warranty Structured Data (MC-FEATURE-PRODUCT-WARRANTY-V1)
  const effectiveWarranty = selectedVariant?.warranty && selectedVariant.warranty.enabled !== undefined
    ? selectedVariant.warranty
    : product.warranty;

  if (effectiveWarranty && effectiveWarranty.enabled) {
    const unitCode = effectiveWarranty.durationUnit === 'years' ? 'ANN' : effectiveWarranty.durationUnit === 'months' ? 'MON' : 'DAY';
    jsonLd.warranty = {
      '@type': 'WarrantyPromise',
      durationOfWarranty: {
        '@type': 'QuantitativeValue',
        value: effectiveWarranty.durationValue || 1,
        unitCode,
      },
      warrantyScope: effectiveWarranty.terms || `${effectiveWarranty.durationValue} ${effectiveWarranty.durationUnit} ${effectiveWarranty.provider} warranty`,
    };
  }

  return jsonLd;
}

/**
 * Generates schema.org/BreadcrumbList structured data for rich SERP breadcrumbs.
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

/**
 * Generates schema.org/Service structured data for specialized marine services.
 * Accurately includes confirmed starting prices (Installation: ₹35,000, Renovation: ₹15,000).
 */
export function generateServiceJsonLd(service: {
  name: string;
  description: string;
  url: string;
  serviceType?: string;
  startingPrice?: number;
  priceCurrency?: string;
  priceDescription?: string;
}) {
  const serviceUrl = service.url.startsWith('http')
    ? service.url
    : `${SITE_CONFIG.url}${service.url}`;

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    serviceType: service.serviceType || service.name,
    url: serviceUrl,
    provider: {
      '@type': 'LocalBusiness',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      telephone: SITE_CONFIG.phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kolkata',
        addressRegion: 'West Bengal',
        addressCountry: 'IN',
      },
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Kolkata',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'West Bengal',
      },
      {
        '@type': 'Country',
        name: 'India',
      },
    ],
  };

  if (service.startingPrice && service.startingPrice > 0) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: service.startingPrice,
      priceCurrency: service.priceCurrency || 'INR',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: service.startingPrice,
        priceCurrency: service.priceCurrency || 'INR',
        description: service.priceDescription || `Starting baseline price for ${service.name}`,
      },
      availability: 'https://schema.org/InStock',
    };
  }

  return jsonLd;
}

/**
 * Generates schema.org/FAQPage structured data for high-intent Answer Engine Optimization (AEO).
 * Enables direct answers and citations in Google AI Overviews, Perplexity, and Copilot.
 */
export function generateFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generates schema.org/Article structured data for educational buying and care guides.
 */
export function generateArticleJsonLd(article: {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  images?: string[];
}) {
  const articleUrl = article.url.startsWith('http')
    ? article.url
    : `${SITE_CONFIG.url}${article.url}`;

  const images = (article.images && article.images.length > 0
    ? article.images
    : ['/og-image.jpg']
  ).map((img) => (img.startsWith('http') ? img : `${SITE_CONFIG.url}${img}`));

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: articleUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    image: images,
    author: {
      '@type': 'Person',
      name: article.authorName || SITE_CONFIG.founder,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
    datePublished: article.datePublished || '2026-11-01',
    dateModified: article.dateModified || '2026-11-15',
  };
}

/**
 * Generates authoritative LocalBusiness / Organization graph for root layout.
 */
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    alternateName: 'MARINE CREATURES',
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    image: `${SITE_CONFIG.url}/og-image.jpg`,
    description: SITE_CONFIG.description,
    slogan: SITE_CONFIG.slogan,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    founder: {
      '@type': 'Person',
      name: SITE_CONFIG.founder,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Marine Creatures Aquaculture Studio',
      addressLocality: 'Kolkata',
      addressRegion: 'West Bengal',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 22.5726,
      longitude: 88.3639,
    },
    areaServed: [
      { '@type': 'City', name: 'Kolkata' },
      { '@type': 'AdministrativeArea', name: 'West Bengal' },
      { '@type': 'Country', name: 'India' },
    ],
    priceRange: '₹₹₹₹',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        opens: '10:00',
        closes: '20:00',
      },
    ],
    makesOffer: [
      {
        '@type': 'Offer',
        name: 'Turnkey Marine Aquarium Installation & Commissioning',
        description:
          'Complete bespoke architectural reef aquarium design, Schedule 80 plumbing, and biological commissioning.',
        price: 35000,
        priceCurrency: 'INR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: 35000,
          priceCurrency: 'INR',
          description: 'Starting baseline price for turnkey marine aquarium installation',
        },
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Aquarium Renovation & Biological Restoration',
        description:
          'Turn troubled or cloudy marine tanks into thriving living centerpieces with optical glass polishing and zero-livestock-loss holding.',
        price: 15000,
        priceCurrency: 'INR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: 15000,
          priceCurrency: 'INR',
          description: 'Starting baseline price for marine aquarium renovation',
        },
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'White-Glove Marine Concierge Maintenance',
        description:
          'Ongoing scheduled biological maintenance, ICP-tested water balancing, and 24/7 emergency response.',
        price: 18500,
        priceCurrency: 'INR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: 18500,
          priceCurrency: 'INR',
          unitText: 'MONTH',
          description: 'Monthly concierge care subscription',
        },
        availability: 'https://schema.org/InStock',
      },
    ],
    sameAs: [SITE_CONFIG.facebook, SITE_CONFIG.googleMaps].filter(Boolean),
  };
}
