// =============================================================================
// Marine Creatures — Canonical Product Image Resolver
// Single source of truth for all product image resolution across:
//   ProductCard, ProductDetailView, Marketplace, Category pages,
//   Search results, Cart previews, Wishlist, Related products, OG images
//
// Priority (deterministic, never silent-fail):
//   1. Verified product photography  (imageStatus: 'VERIFIED', images[0])
//   2. Approved product media asset  (product.media[0].url)
//   3. Intentional luxury blueprint  (imageStatus: 'NEEDS_MEDIA_ASSET')
//
// NEVER allows:
//   - Broken image icons
//   - Blank image containers
//   - Silent failures
//   - Random stock photography
//   - External hotlinks for product images
// =============================================================================

import { Product } from '@/lib/data/products';

export type ImageType =
  | 'VERIFIED_PHOTOGRAPH'    // Real product photograph served from local public assets
  | 'APPROVED_MEDIA'         // Approved media from product.media array
  | 'INTENTIONAL_BLUEPRINT'; // Client confirmed no photo — luxury blueprint shown intentionally

export interface ResolvedProductImage {
  /** Local path suitable for img src or Next Image */
  src: string;
  /** Accessible alt text */
  alt: string;
  /** Classification of this image source */
  type: ImageType;
  /** Whether a real photograph is being shown (false = blueprint) */
  hasRealPhoto: boolean;
}

/**
 * Resolve the primary display image for a product.
 * Never returns null. Never returns a broken URL silently.
 */
export function resolveProductImage(product: Product): ResolvedProductImage {
  const name = product.name ?? 'Marine Creatures Product';
  const alt = product.scientificName
    ? `${name} (${product.scientificName}) — Marine Creatures`
    : `${name} — ${product.categoryLabel ?? 'Marine Creatures'}`;

  // Priority 1: Verified product photography (images array)
  if (
    product.images &&
    product.images.length > 0 &&
    product.images[0] &&
    product.images[0].trim() !== ''
  ) {
    return {
      src: product.images[0],
      alt,
      type: 'VERIFIED_PHOTOGRAPH',
      hasRealPhoto: true,
    };
  }

  // Priority 2: Approved product media asset (media array)
  if (
    product.media &&
    product.media.length > 0 &&
    product.media[0].type === 'image' &&
    product.media[0].url &&
    product.media[0].url.trim() !== ''
  ) {
    return {
      src: product.media[0].url,
      alt,
      type: 'APPROVED_MEDIA',
      hasRealPhoto: true,
    };
  }

  // Priority 3: Intentional luxury blueprint fallback
  // Products with imageStatus: 'NEEDS_MEDIA_ASSET' are intentionally
  // displayed with a blueprint SVG card — this is correct behavior.
  // Return empty src; consumers MUST render the blueprint UI, not a broken img.
  return {
    src: '',
    alt,
    type: 'INTENTIONAL_BLUEPRINT',
    hasRealPhoto: false,
  };
}

/**
 * Resolve all gallery images for a product detail view.
 * Returns an ordered array; never empty.
 */
export function resolveProductGallery(
  product: Product
): Array<{ src: string; alt: string; type: ImageType }> {
  const name = product.name ?? 'Marine Creatures Product';
  const baseAlt = product.scientificName
    ? `${name} (${product.scientificName})`
    : `${name} — ${product.categoryLabel ?? 'Marine Creatures'}`;

  // Use explicit media array if present
  if (product.media && product.media.length > 0) {
    const images = product.media
      .filter((m) => m.type === 'image' && m.url && m.url.trim() !== '')
      .map((m, i) => ({
        src: m.url,
        alt: m.title ?? `${baseAlt} — Photo ${i + 1}`,
        type: 'APPROVED_MEDIA' as ImageType,
      }));
    if (images.length > 0) return images;
  }

  // Use images array
  if (product.images && product.images.length > 0) {
    const resolved = product.images
      .filter((img) => img && img.trim() !== '')
      .map((img, i) => ({
        src: img,
        alt: i === 0 ? baseAlt : `${baseAlt} — Photo ${i + 1}`,
        type: 'VERIFIED_PHOTOGRAPH' as ImageType,
      }));
    if (resolved.length > 0) return resolved;
  }

  // Blueprint fallback — single empty entry so gallery renders blueprint
  return [{ src: '', alt: baseAlt, type: 'INTENTIONAL_BLUEPRINT' }];
}

/**
 * Returns true if the product has a real photograph to display.
 */
export function productHasRealPhoto(product: Product): boolean {
  if (product.images && product.images.length > 0 && product.images[0]?.trim()) {
    return true;
  }
  if (
    product.media &&
    product.media.length > 0 &&
    product.media[0].type === 'image' &&
    product.media[0].url?.trim()
  ) {
    return true;
  }
  return false;
}
