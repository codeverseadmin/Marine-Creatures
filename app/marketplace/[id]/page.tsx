import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PRODUCTS, Product } from '@/lib/data/products';
import { ProductDetailView } from '@/components/marketplace/ProductDetailView';
import { SITE_CONFIG } from '@/lib/config';
import {
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
} from '@/lib/seo/structuredData';

interface Props {
  params: Promise<{ id: string }>;
}

// Dedicated high-intent semantic aliases for the Nemo product cluster
const NEMO_ALIASES: Record<
  string,
  { parentId: string; variantId: string; title: string; metaDesc: string }
> = {
  'nemo-e450': {
    parentId: 'nemo-extreme-led',
    variantId: 'e450',
    title: 'Nemo E450 Aquarium Light — 24W App-Controlled Marine LED (45–60 cm)',
    metaDesc:
      'Official Nemo E450 smart marine aquarium LED light for 45–60 cm tanks. 24W output, 4-channel Bluetooth app control, sunrise/sunset scheduling, and coral fluorescence.',
  },
  'nemo-e600': {
    parentId: 'nemo-extreme-led',
    variantId: 'e600',
    title: 'Nemo E600 Aquarium Light — 36W App-Controlled Marine LED (60–80 cm)',
    metaDesc:
      'Official Nemo E600 marine aquarium light for 60–80 cm tanks. 36W power, aircraft-grade aluminum heatsink, sliding brackets, and 4-channel spectrum control.',
  },
  'nemo-e900': {
    parentId: 'nemo-extreme-led',
    variantId: 'e900',
    title: 'Nemo E900 Aquarium Light — 60W App-Controlled Marine LED (90–110 cm)',
    metaDesc:
      'High-PAR Nemo E900 marine reef light for 90–110 cm aquariums. 60W output, independent UV/Royal Blue/Deep Blue channels, and 24h IoT light cycle automation.',
  },
  'nemo-e1200': {
    parentId: 'nemo-extreme-led',
    variantId: 'e1200',
    title: 'Nemo E1200 Aquarium Light — 72W App-Controlled Marine LED (120–140 cm)',
    metaDesc:
      'Full 4-foot reef coverage with Nemo E1200 smart LED light for 120–140 cm aquariums. 72W power, anodized aluminum body, and precision smartphone app control.',
  },
};

function resolveProductAndVariant(id: string): {
  product: Product | undefined;
  variantId?: string;
  customTitle?: string;
  customDesc?: string;
  canonicalSlug: string;
} {
  const alias = NEMO_ALIASES[id.toLowerCase()];
  if (alias) {
    const parent = PRODUCTS.find((p) => p.id === alias.parentId);
    return {
      product: parent,
      variantId: alias.variantId,
      customTitle: alias.title,
      customDesc: alias.metaDesc,
      canonicalSlug: id.toLowerCase(),
    };
  }

  const directProduct = PRODUCTS.find((p) => p.id === id);
  return {
    product: directProduct,
    canonicalSlug: directProduct ? directProduct.id : id,
  };
}

export async function generateStaticParams() {
  const baseParams = PRODUCTS.map((p) => ({ id: p.id }));
  const aliasParams = Object.keys(NEMO_ALIASES).map((id) => ({ id }));
  return [...baseParams, ...aliasParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { product, customTitle, customDesc, canonicalSlug } =
    resolveProductAndVariant(id);

  if (!product) return {};

  const title =
    customTitle ||
    `${product.name} — ${product.categoryLabel || 'Marine Equipment'}`;
  const description =
    customDesc ||
    `${product.shortDesc} Inquire directly for verified specifications, tank pairing, and live dispatch at Marine Creatures.`;

  const canonicalUrl = `${SITE_CONFIG.url}/marketplace/${canonicalSlug}`;
  const primaryImage =
    product.images?.[0] && product.images[0].startsWith('http')
      ? product.images[0]
      : `${SITE_CONFIG.url}${product.images?.[0] || '/og-image.jpg'}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [primaryImage],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const { product, variantId, customTitle, canonicalSlug } =
    resolveProductAndVariant(id);

  if (!product) notFound();

  const canonicalUrl = `${SITE_CONFIG.url}/marketplace/${canonicalSlug}`;

  // Structured Data (Product + Breadcrumbs)
  const productJsonLd = generateProductJsonLd(product, canonicalUrl, variantId);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Marketplace', url: '/marketplace' },
  ];

  if (product.category === 'lighting-tech') {
    breadcrumbs.push({
      name: 'Aquarium Lighting',
      url: '/marketplace/lighting',
    });
  } else if (product.categoryLabel) {
    breadcrumbs.push({
      name: product.categoryLabel,
      url: `/marketplace?category=${product.category}`,
    });
  }

  breadcrumbs.push({
    name: customTitle || product.name,
    url: `/marketplace/${canonicalSlug}`,
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  // Related products
  const relatedProducts = PRODUCTS.filter(
    (p) =>
      p.id !== product.id &&
      (product.recommendedPairings?.includes(p.id) ||
        p.category === product.category)
  ).slice(0, 4);

  return (
    <>
      {/* 1. Server-Rendered JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* 2. Visual Breadcrumbs (Server-Rendered for Crawlability & UX) */}
      <nav
        aria-label="Breadcrumb"
        className="container-max pt-24 sm:pt-28 pb-2 text-xs text-slate-400 flex items-center gap-2 flex-wrap"
      >
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.url} className="flex items-center gap-2">
            {index < breadcrumbs.length - 1 ? (
              <>
                <Link
                  href={crumb.url}
                  className="hover:text-cyan-400 transition-colors"
                >
                  {crumb.name}
                </Link>
                <span className="opacity-40">/</span>
              </>
            ) : (
              <span
                className="text-cyan-400 font-medium truncate max-w-[280px] sm:max-w-none"
                aria-current="page"
              >
                {crumb.name}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* 3. Server-Rendered Crawler Summary (Accessible SSR content) */}
      <div className="sr-only" aria-hidden="false">
        <h1>{customTitle || product.name}</h1>
        <p>{product.description || product.shortDesc}</p>
        {product.brand && <p>Brand: {product.brand}</p>}
        {product.specifications && (
          <ul>
            {Object.entries(product.specifications).map(([key, val]) => (
              <li key={key}>
                {key}: {val}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 4. Client Interactive Experience */}
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
        initialVariantId={variantId}
      />
    </>
  );
}
