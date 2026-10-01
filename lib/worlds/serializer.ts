/**
 * Worlds Public Serializer & Privacy Firewall
 *
 * CRITICAL SECURITY INVARIANT:
 * ClientProject records and sensitive client private data
 * (names, emails, phones, private addresses, internal budgets, internal notes)
 * MUST NEVER BE EXPOSED TO PUBLIC APIs OR CLIENT BUNDLES.
 */

export interface PublicCaseStudyDTO {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  headline?: string;
  space: string;
  clientContext?: string;
  scale: string;
  aquariumVolume?: string;
  aquariumType?: string;
  biome?: string;
  image: string;
  gallery: Array<{
    url: string;
    caption?: string;
    alt?: string;
  }>;
  beforeAfter?: {
    beforeImage?: string;
    afterImage?: string;
    beforeLabel?: string;
    afterLabel?: string;
    caption?: string;
  };
  imageStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'FALLBACK';
  designIntent: string;
  result: string;
  materials: string[];
  engineering: string[];
  marineWorld: {
    biome: string;
    livestock: string;
    corals: string;
  };
  introduction?: string;
  challenge?: string;
  concept?: string;
  architecture?: string;
  execution?: string;
  transformation?: string;
  conclusion?: string;
  publishedAt?: string;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  canonicalOverride?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

/**
 * Transforms an internal MongoDB CaseStudy document into an audited,
 * whitelisted PublicCaseStudyDTO.
 *
 * Rejects ClientProject records and strips all unapproved fields.
 */
export function serializePublicCaseStudy(doc: any): PublicCaseStudyDTO | null {
  if (!doc) return null;

  // Security guard: If accidentally passed a ClientProject or unapproved entity, reject
  if (doc.clientPhone || doc.clientEmail || doc.privateAddress || doc.internalNotes || doc.estimatedBudget) {
    console.error('[SECURITY_VIOLATION_BLOCKED] Attempted to serialize a document containing private client data!');
    // Strip and reject to guarantee zero data leakage
    return null;
  }

  // Ensure published status
  if (doc.published !== true || doc.isArchived === true) {
    return null;
  }

  return {
    id: String(doc.id || doc.slug || ''),
    slug: String(doc.slug || doc.id || ''),
    title: String(doc.title || ''),
    subtitle: doc.subtitle ? String(doc.subtitle) : undefined,
    eyebrow: doc.eyebrow ? String(doc.eyebrow) : undefined,
    headline: doc.subtitle || doc.eyebrow ? String(doc.subtitle || doc.eyebrow) : undefined,
    space: String(doc.space || ''),
    clientContext: doc.clientContext ? String(doc.clientContext) : undefined,
    scale: String(doc.scale || ''),
    aquariumVolume: doc.aquariumVolume ? String(doc.aquariumVolume) : undefined,
    aquariumType: doc.aquariumType ? String(doc.aquariumType) : undefined,
    biome: doc.biome ? String(doc.biome) : undefined,
    image: String(doc.image || ''),
    gallery: Array.isArray(doc.gallery)
      ? doc.gallery.map((g: any) => ({
          url: String(g.url || ''),
          caption: g.caption ? String(g.caption) : undefined,
          alt: g.alt ? String(g.alt) : undefined,
        }))
      : [],
    beforeAfter: doc.beforeAfter
      ? {
          beforeImage: doc.beforeAfter.beforeImage ? String(doc.beforeAfter.beforeImage) : undefined,
          afterImage: doc.beforeAfter.afterImage ? String(doc.beforeAfter.afterImage) : undefined,
          beforeLabel: doc.beforeAfter.beforeLabel ? String(doc.beforeAfter.beforeLabel) : undefined,
          afterLabel: doc.beforeAfter.afterLabel ? String(doc.beforeAfter.afterLabel) : undefined,
          caption: doc.beforeAfter.caption ? String(doc.beforeAfter.caption) : undefined,
        }
      : undefined,
    imageStatus: doc.imageStatus === 'FALLBACK' || doc.imageStatus === 'NEEDS_REVIEW' ? doc.imageStatus : 'VERIFIED',
    designIntent: String(doc.designIntent || ''),
    result: String(doc.result || ''),
    materials: Array.isArray(doc.materials) ? doc.materials.map((m: any) => String(m)) : [],
    engineering: Array.isArray(doc.engineering) ? doc.engineering.map((e: any) => String(e)) : [],
    marineWorld: {
      biome: String(doc.marineWorld?.biome || doc.biome || ''),
      livestock: String(doc.marineWorld?.livestock || ''),
      corals: String(doc.marineWorld?.corals || ''),
    },
    introduction: doc.introduction ? String(doc.introduction) : undefined,
    challenge: doc.challenge ? String(doc.challenge) : undefined,
    concept: doc.concept ? String(doc.concept) : undefined,
    architecture: doc.architecture ? String(doc.architecture) : undefined,
    execution: doc.execution ? String(doc.execution) : undefined,
    transformation: doc.transformation ? String(doc.transformation) : undefined,
    conclusion: doc.conclusion ? String(doc.conclusion) : undefined,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
    featured: Boolean(doc.featured),
    seoTitle: doc.seoTitle ? String(doc.seoTitle) : undefined,
    seoDescription: doc.seoDescription ? String(doc.seoDescription) : undefined,
    canonicalOverride: doc.canonicalOverride ? String(doc.canonicalOverride) : undefined,
    ogTitle: doc.ogTitle ? String(doc.ogTitle) : undefined,
    ogDescription: doc.ogDescription ? String(doc.ogDescription) : undefined,
    ogImage: doc.ogImage ? String(doc.ogImage) : undefined,
    noIndex: Boolean(doc.noIndex),
  };
}

/**
 * Whitelist serializer for admin preview of a draft/unpublished CaseStudy.
 * Disallows client private information while allowing preview of draft content.
 */
export function serializePreviewCaseStudy(doc: any): PublicCaseStudyDTO | null {
  if (!doc) return null;

  if (doc.clientPhone || doc.clientEmail || doc.privateAddress || doc.internalNotes || doc.estimatedBudget) {
    console.error('[SECURITY_VIOLATION_BLOCKED] Attempted to preview a document containing private client data!');
    return null;
  }

  return {
    id: String(doc.id || doc.slug || ''),
    slug: String(doc.slug || doc.id || ''),
    title: String(doc.title || ''),
    subtitle: doc.subtitle ? String(doc.subtitle) : undefined,
    eyebrow: doc.eyebrow ? String(doc.eyebrow) : undefined,
    headline: doc.subtitle || doc.eyebrow ? String(doc.subtitle || doc.eyebrow) : undefined,
    space: String(doc.space || ''),
    clientContext: doc.clientContext ? String(doc.clientContext) : undefined,
    scale: String(doc.scale || ''),
    aquariumVolume: doc.aquariumVolume ? String(doc.aquariumVolume) : undefined,
    aquariumType: doc.aquariumType ? String(doc.aquariumType) : undefined,
    biome: doc.biome ? String(doc.biome) : undefined,
    image: String(doc.image || ''),
    gallery: Array.isArray(doc.gallery)
      ? doc.gallery.map((g: any) => ({
          url: String(g.url || ''),
          caption: g.caption ? String(g.caption) : undefined,
          alt: g.alt ? String(g.alt) : undefined,
        }))
      : [],
    beforeAfter: doc.beforeAfter
      ? {
          beforeImage: doc.beforeAfter.beforeImage ? String(doc.beforeAfter.beforeImage) : undefined,
          afterImage: doc.beforeAfter.afterImage ? String(doc.beforeAfter.afterImage) : undefined,
          beforeLabel: doc.beforeAfter.beforeLabel ? String(doc.beforeAfter.beforeLabel) : undefined,
          afterLabel: doc.beforeAfter.afterLabel ? String(doc.beforeAfter.afterLabel) : undefined,
          caption: doc.beforeAfter.caption ? String(doc.beforeAfter.caption) : undefined,
        }
      : undefined,
    imageStatus: doc.imageStatus === 'FALLBACK' || doc.imageStatus === 'NEEDS_REVIEW' ? doc.imageStatus : 'VERIFIED',
    designIntent: String(doc.designIntent || ''),
    result: String(doc.result || ''),
    materials: Array.isArray(doc.materials) ? doc.materials.map((m: any) => String(m)) : [],
    engineering: Array.isArray(doc.engineering) ? doc.engineering.map((e: any) => String(e)) : [],
    marineWorld: {
      biome: String(doc.marineWorld?.biome || doc.biome || ''),
      livestock: String(doc.marineWorld?.livestock || ''),
      corals: String(doc.marineWorld?.corals || ''),
    },
    introduction: doc.introduction ? String(doc.introduction) : undefined,
    challenge: doc.challenge ? String(doc.challenge) : undefined,
    concept: doc.concept ? String(doc.concept) : undefined,
    architecture: doc.architecture ? String(doc.architecture) : undefined,
    execution: doc.execution ? String(doc.execution) : undefined,
    transformation: doc.transformation ? String(doc.transformation) : undefined,
    conclusion: doc.conclusion ? String(doc.conclusion) : undefined,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
    featured: Boolean(doc.featured),
    seoTitle: doc.seoTitle ? String(doc.seoTitle) : undefined,
    seoDescription: doc.seoDescription ? String(doc.seoDescription) : undefined,
    canonicalOverride: doc.canonicalOverride ? String(doc.canonicalOverride) : undefined,
    ogTitle: doc.ogTitle ? String(doc.ogTitle) : undefined,
    ogDescription: doc.ogDescription ? String(doc.ogDescription) : undefined,
    ogImage: doc.ogImage ? String(doc.ogImage) : undefined,
    noIndex: true, // ALWAYS noindex for previews
  };
}
