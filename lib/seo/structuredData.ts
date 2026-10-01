import { SITE_CONFIG } from '@/lib/config';
import { Product } from '@/lib/data/products';

/**
 * Generates schema.org/Product structured data compliant with Google guidelines.
 * CRITICAL RULE: "Price on Request" products NEVER emit fake price, ₹0, or fabricated ratings.
 */
export function generateProductJsonLd(
  product: Product,
  canonicalUrl: string,
  variantId?: string
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
    : ['/images/products/placeholder-spec.jpg']
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
            price: product.price,
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
      item: item.url.startsWith('http') ? item : `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

/**
 * Generates schema.org/Service structured data for specialized marine services.
 */
export function generateServiceJsonLd(service: {
  name: string;
  description: string;
  url: string;
  serviceType?: string;
}) {
  const serviceUrl = service.url.startsWith('http')
    ? service.url
    : `${SITE_CONFIG.url}${service.url}`;

  return {
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
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Kolkata, West Bengal, India',
    },
  };
}
