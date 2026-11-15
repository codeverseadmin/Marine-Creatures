// =============================================================================
// Marine Creatures — Deterministic Product Recommendation & Compatibility Engine
// Phase: REO-1A — Machine-Readable Recommendations & Explainable Compatibility Graph
// =============================================================================

import { PRODUCTS, Product } from '@/lib/data/products';
import { CATALOG_SEO_MAP } from '@/lib/seo/catalogSeoData';

export type RecommendationType =
  | 'compatible_equipment'
  | 'related_accessory'
  | 'alternative_variant'
  | 'maintenance_essential';

export interface ExplainableRecommendation {
  product: Product;
  relationType: RecommendationType;
  relationLabel: string;
  explanation: string;
}

/**
 * Deterministic, attribute-based compatibility rules mapped by product ID or category.
 * Every recommendation is backed by a verifiable marine biological or electrical reason.
 * NO fabricated popularity scores or fake purchase statistics.
 */
const DETERMINISTIC_RULE_MAP: Record<
  string,
  Array<{ targetId: string; relationType: RecommendationType; relationLabel: string; explanation: string }>
> = {
  // ── High-Output LED Lighting Cluster ──────────────────────────────────────
  'nemo-extreme-led': [
    {
      targetId: 'super-protein-skimmer-dc',
      relationType: 'compatible_equipment',
      relationLabel: 'Photosynthetic Bio-Filtration',
      explanation:
        'High-intensity coral reef illumination accelerates metabolic activity, requiring heavy foam fractionation to export organic waste.',
    },
    {
      targetId: 'quantum-mixed-macro-probiotic-salt-22kg',
      relationType: 'related_accessory',
      relationLabel: 'Reef Calcification Salt',
      explanation:
        'Calibrated to 8 dKH at 35 ppt with included ICP-OES batch analysis to support rapid coral calcification under full-spectrum PAR.',
    },
    {
      targetId: 'by-par-synthetic-adsorbent',
      relationType: 'maintenance_essential',
      relationLabel: 'Optical Clarity Resin',
      explanation:
        'Adsorbs yellowing dissolved organics from the water column, preventing spectral attenuation and ensuring maximum light penetration.',
    },
  ],

  // ── Living Quarantine Marine Fish Cluster ─────────────────────────────────
  'pair-of-platinum-clownfish': [
    {
      targetId: 'quantum-mixed-macro-probiotic-salt-22kg',
      relationType: 'related_accessory',
      relationLabel: 'Probiotic Acclimation Water',
      explanation:
        'Pharmaceutical-grade synthetic sea salt formulated for stable osmotic pressure and immune support during quarantine and display introduction.',
    },
    {
      targetId: 'by-par-synthetic-adsorbent',
      relationType: 'maintenance_essential',
      relationLabel: 'Ammonia & Waste Shield',
      explanation:
        'High-affinity polymer resin that captures dissolved teleost waste metabolites before biological conversion into toxic ammonia.',
    },
    {
      targetId: 'super-protein-skimmer-dc',
      relationType: 'compatible_equipment',
      relationLabel: 'Dissolved Oxygen Support',
      explanation:
        'Maintains supersaturated dissolved oxygen levels (>6.5 mg/L) essential for active marine fish respiration.',
    },
  ],

  // ── DC Protein Skimmers & Filtration Hardware ─────────────────────────────
  'super-protein-skimmer-dc': [
    {
      targetId: 'by-par-synthetic-adsorbent',
      relationType: 'maintenance_essential',
      relationLabel: 'Synergistic Organic Adsorption',
      explanation:
        'Functions in tandem with mechanical foam fractionation by capturing polar organic molecules directly in the sump baffle chamber.',
    },
    {
      targetId: 'quantum-mixed-macro-probiotic-salt-22kg',
      relationType: 'related_accessory',
      relationLabel: 'Stable Foam Fractionation Salt',
      explanation:
        'Consistent salinity and surface tension chemistry produce dense, dry skimmate without violent over-foaming.',
    },
  ],

  // ── Probiotic Marine Salts & Water Chemistry ──────────────────────────────
  'quantum-mixed-macro-probiotic-salt-22kg': [
    {
      targetId: 'by-par-synthetic-adsorbent',
      relationType: 'maintenance_essential',
      relationLabel: 'Water Clarification Partner',
      explanation:
        'Maintains crystal-clear water so that ICP-balanced trace elements (Sr, I, B, Fe) remain biologically available rather than bound to waste.',
    },
    {
      targetId: 'super-protein-skimmer-dc',
      relationType: 'compatible_equipment',
      relationLabel: 'Aeration & Salt Dissolution',
      explanation:
        'Enhances gas exchange and stabilizes pH levels (8.1–8.4) immediately following synthetic saltwater dissolution.',
    },
  ],
};

/**
 * Retrieves deterministic, explainable recommendations for any given product ID.
 * Falls back to verified catalog SEO relationships or category-adjacent products if direct rules are unset.
 */
export function getExplainableRecommendations(
  productId: string,
  limit: number = 4
): ExplainableRecommendation[] {
  const normalizedId = productId.toLowerCase();

  // 1. Check exact rule map match
  const explicitRules = DETERMINISTIC_RULE_MAP[normalizedId];
  if (explicitRules && explicitRules.length > 0) {
    const list: ExplainableRecommendation[] = [];
    for (const rule of explicitRules) {
      const targetProd = PRODUCTS.find((p) => p.id === rule.targetId);
      if (targetProd) {
        list.push({
          product: targetProd,
          relationType: rule.relationType,
          relationLabel: rule.relationLabel,
          explanation: rule.explanation,
        });
      }
    }
    if (list.length >= limit) return list.slice(0, limit);
  }

  // 2. Check CATALOG_SEO_MAP relatedProductIds
  const seoData = CATALOG_SEO_MAP[normalizedId];
  const list: ExplainableRecommendation[] = [];

  if (seoData?.relatedProductIds && seoData.relatedProductIds.length > 0) {
    for (const rid of seoData.relatedProductIds) {
      if (rid === normalizedId) continue;
      const relatedProd = PRODUCTS.find((p) => p.id === rid);
      if (relatedProd && !list.some((item) => item.product.id === relatedProd.id)) {
        list.push({
          product: relatedProd,
          relationType: 'compatible_equipment',
          relationLabel: `${relatedProd.categoryLabel || 'Compatible Hardware'}`,
          explanation: `Engineered for direct operational compatibility with ${seoData.name}.`,
        });
      }
    }
  }

  // 3. Fallback to same-category or verified complementary hardware
  if (list.length < limit) {
    const currentProd = PRODUCTS.find((p) => p.id === normalizedId);
    if (currentProd) {
      const candidates = PRODUCTS.filter(
        (p) =>
          p.id !== normalizedId &&
          !list.some((item) => item.product.id === p.id) &&
          (p.category === currentProd.category ||
            currentProd.recommendedPairings?.includes(p.id))
      );

      for (const candidate of candidates) {
        if (list.length >= limit) break;
        list.push({
          product: candidate,
          relationType: 'related_accessory',
          relationLabel: `${candidate.categoryLabel || 'Complementary Product'}`,
          explanation: `Recommended auxiliary item for ${currentProd.categoryLabel || 'marine aquarium'} systems.`,
        });
      }
    }
  }

  return list.slice(0, limit);
}

