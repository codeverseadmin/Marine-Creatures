/**
 * Fulfillment and Shipment Domain Utilities
 * Marine Creatures Control OS & Invoice Engine
 * Reference: MC-POR-ADMIN-PRE-INVOICE-SETTLEMENT-NOV2026
 */

export type FulfillmentType = 'partner_shipment' | 'direct_delivery';

export interface OrderFulfillmentDetails {
  isShippedViaPartner?: boolean;
  fulfillmentType?: FulfillmentType | string;
  awbNumber?: string | null;
  courierName?: string | null;
  estimatedDelivery?: string | null;
}

/**
 * Determines authoritatively whether an order is routed via a third-party
 * cargo/courier logistics partner or via direct concierge / local handover.
 *
 * Rules:
 * 1. If `isShippedViaPartner` is explicitly boolean, that is authoritative.
 * 2. If `fulfillmentType` is set, `partner_shipment` = true, other values = false.
 * 3. Fallback for legacy orders: if `awbNumber` exists, is non-empty, and does NOT contain 'PENDING',
 *    it is treated as a partner shipment. Otherwise, it defaults to false (direct fulfillment).
 */
export function isPartnerShipmentOrder(order?: OrderFulfillmentDetails | null): boolean {
  if (!order) return false;

  // 1. Explicit boolean flag
  if (typeof order.isShippedViaPartner === 'boolean') {
    return order.isShippedViaPartner;
  }

  // 2. Explicit fulfillmentType enum
  if (
    order.fulfillmentType === 'direct_delivery' ||
    order.fulfillmentType === 'direct' ||
    order.fulfillmentType === 'pickup'
  ) {
    return false;
  }
  if (
    order.fulfillmentType === 'partner_shipment' ||
    order.fulfillmentType === 'shipment'
  ) {
    return true;
  }

  // 3. Fallback / legacy heuristics:
  // If an order has an actual non-pending AWB tracking number, treat as partner shipment
  const awb = typeof order.awbNumber === 'string' ? order.awbNumber.trim() : '';
  if (awb && !awb.toUpperCase().includes('PENDING') && awb.length > 0) {
    return true;
  }

  return false;
}

/**
 * Popular live cargo & express carrier partners for quick selection in admin interfaces.
 */
export const POPULAR_CARRIER_PARTNERS = [
  'Priority Air Cargo Express',
  'IndiGo CarGo Priority',
  'SpiceJet Cargo Express',
  'Air India Live Cargo Express',
  'BlueDart Apex Aviation',
  'DTDC Prime Air Cargo',
] as const;

/**
 * Default labels and descriptions for fulfillment modes
 */
export const FULFILLMENT_CONFIG = {
  direct_delivery: {
    label: 'Direct Local Delivery / Handover',
    shortLabel: 'Direct Handover',
    badge: '🚚 Direct Handover',
    description: 'Fulfilled directly by Marine Creatures team. No courier partner or shipment ID required on invoice.',
    invoiceSectionTitle: 'Fulfillment & Delivery Details',
    transitLabel: 'Direct Concierge Handover',
    defaultEta: 'Direct Concierge Handover',
  },
  partner_shipment: {
    label: 'Third-Party Partner Shipment',
    shortLabel: 'Partner Cargo',
    badge: '✈️ Partner Cargo',
    description: 'Consigned through third-party logistics partner. Generates Air Cargo manifest & tracking on invoice.',
    invoiceSectionTitle: 'Live Air Cargo Dispatch Details',
    transitLabel: 'Priority Air Cargo Transit',
    defaultCourier: 'Priority Air Cargo Express',
    defaultEta: 'Tomorrow via Priority Air Cargo',
  },
} as const;

