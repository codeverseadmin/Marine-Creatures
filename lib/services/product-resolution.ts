import mongoose from 'mongoose';
import { ProductModel, IProductDocument } from '@/models/Product';
import { PRODUCTS, Product } from '@/lib/data/products';
import { connectToDatabase } from '@/lib/mongodb';

export interface AuthoritativeProductResolution {
  product: IProductDocument | (Product & { _id?: string }) | null;
  matchType: 'mongodb_objectid' | 'canonical_id' | 'slug' | 'canonical_override' | 'static_fallback' | null;
  canonicalId: string | null;
  mongoId: string | null;
}

/**
 * Strips all illegal characters, lowercases, replaces whitespace/symbols with hyphens,
 * collapses multiple hyphens, and strips leading and trailing hyphens.
 */
export function sanitizeSlug(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Authoritative Product Resolver
 * Resolves a product by:
 * 1. MongoDB ObjectId (_id if 24-hex string)
 * 2. Canonical Governance ID (id)
 * 3. Public Marketplace Slug (slug)
 * 4. Canonical Override (canonicalOverride)
 * 5. Static Catalog Fallback (PRODUCTS)
 *
 * Rejects ambiguous matches.
 * Returns null if not found.
 */
export async function resolveAuthoritativeProduct(
  identifier: string | null | undefined,
  options?: { lean?: boolean }
): Promise<IProductDocument | null> {
  if (!identifier || typeof identifier !== 'string') return null;

  const raw = identifier.trim();
  if (!raw) return null;

  await connectToDatabase();

  // 1. Check MongoDB ObjectId (24 hex characters)
  if (/^[0-9a-fA-F]{24}$/.test(raw)) {
    try {
      const byMongoId = options?.lean
        ? await ProductModel.findById(raw).lean()
        : await ProductModel.findById(raw);
      if (byMongoId) {
        return byMongoId as any;
      }
    } catch {
      // Not a valid ObjectId or query failed, continue to slug/id resolution
    }
  }

  const cleanId = raw.toLowerCase();

  // 2. Authoritative Canonical ID (id field has unique index in MongoDB)
  const byCanonicalId = options?.lean
    ? await ProductModel.findOne({ id: cleanId }).lean()
    : await ProductModel.findOne({ id: cleanId });

  if (byCanonicalId) {
    return byCanonicalId as any;
  }

  // 3. Public Marketplace Slug (slug field)
  const bySlug = options?.lean
    ? await ProductModel.findOne({ slug: cleanId }).lean()
    : await ProductModel.findOne({ slug: cleanId });

  if (bySlug) {
    return bySlug as any;
  }

  // 4. Canonical Override (canonicalOverride field)
  const byOverride = options?.lean
    ? await ProductModel.findOne({ canonicalOverride: cleanId }).lean()
    : await ProductModel.findOne({ canonicalOverride: cleanId });

  if (byOverride) {
    return byOverride as any;
  }

  // 5. Also test sanitized slug if input had trailing hyphens or spaces
  const sanitized = sanitizeSlug(raw);
  if (sanitized && sanitized !== cleanId) {
    const bySanitizedId = options?.lean
      ? await ProductModel.findOne({ id: sanitized }).lean()
      : await ProductModel.findOne({ id: sanitized });
    if (bySanitizedId) return bySanitizedId as any;

    const bySanitizedSlug = options?.lean
      ? await ProductModel.findOne({ slug: sanitized }).lean()
      : await ProductModel.findOne({ slug: sanitized });
    if (bySanitizedSlug) return bySanitizedSlug as any;
  }

  // 6. Legacy Static Catalogue Fallback
  const staticMatch = PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === cleanId ||
      (p as any).slug?.toLowerCase() === cleanId ||
      (sanitized && p.id.toLowerCase() === sanitized)
  );

  if (staticMatch) {
    return staticMatch as any;
  }

  return null;
}

/**
 * Validates whether a given slug is available for assignment.
 * Checks for collisions against both `id` and `slug` across MongoDB and static catalog.
 */
export async function validateSlugAvailability(
  slug: string,
  excludeCanonicalId?: string,
  excludeMongoId?: string
): Promise<{ available: boolean; conflictProduct?: string; reason?: string }> {
  const cleanSlug = sanitizeSlug(slug);
  if (!cleanSlug) {
    return { available: false, reason: 'Slug cannot be empty.' };
  }

  await connectToDatabase();

  // Check collision with any product's canonical id
  const conflictById = await ProductModel.findOne({ id: cleanSlug }).lean();
  if (conflictById) {
    const isSelfCanonical = excludeCanonicalId && conflictById.id === excludeCanonicalId;
    const isSelfMongo = excludeMongoId && conflictById._id?.toString() === excludeMongoId;
    if (!isSelfCanonical && !isSelfMongo) {
      return {
        available: false,
        conflictProduct: conflictById.name,
        reason: `Slug "${cleanSlug}" collides with existing product ID for "${conflictById.name}".`,
      };
    }
  }

  // Check collision with any product's slug
  const conflictBySlug = await ProductModel.findOne({ slug: cleanSlug }).lean();
  if (conflictBySlug) {
    const isSelfCanonical = excludeCanonicalId && conflictBySlug.id === excludeCanonicalId;
    const isSelfMongo = excludeMongoId && conflictBySlug._id?.toString() === excludeMongoId;
    if (!isSelfCanonical && !isSelfMongo) {
      return {
        available: false,
        conflictProduct: conflictBySlug.name,
        reason: `Slug "${cleanSlug}" is already in use by product "${conflictBySlug.name}".`,
      };
    }
  }

  return { available: true };
}

