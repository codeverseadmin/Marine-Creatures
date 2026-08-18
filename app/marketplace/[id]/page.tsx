import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PRODUCTS } from '@/lib/data/products';
import { ProductDetailView } from '@/components/marketplace/ProductDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return {};
  return {
    title: `${product.name} — Marine Creatures Marketplace`,
    description: product.shortDesc,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) notFound();

  // Related products
  const relatedProducts = PRODUCTS.filter(
    (p) => p.id !== product.id && (product.recommendedPairings?.includes(p.id) || p.category === product.category)
  ).slice(0, 4);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
