import { randomBytes, createHash, timingSafeEqual } from 'crypto';

export const INVOICE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface GeneratedInvoiceToken {
  rawToken: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Generates a cryptographically secure random token (256 bits of CSPRNG entropy).
 * Never logged or stored raw in database.
 */
export function generateInvoiceToken(): GeneratedInvoiceToken {
  // 32 bytes = 256 bits of entropy. Formatted as 64 hex characters.
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashInvoiceToken(rawToken);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + INVOICE_TOKEN_TTL_MS);

  return {
    rawToken,
    tokenHash,
    createdAt,
    expiresAt,
  };
}

/**
 * Computes SHA-256 hash of an invoice token.
 */
export function hashInvoiceToken(rawToken: string): string {
  return createHash('sha256').update(rawToken.trim()).digest('hex');
}

/**
 * Verifies a supplied raw token against a stored SHA-256 hash using timing-safe comparison.
 */
export function verifyInvoiceTokenHash(rawToken: string, storedHash: string): boolean {
  if (!rawToken || typeof rawToken !== 'string' || !storedHash || typeof storedHash !== 'string') {
    return false;
  }

  // Token must be a 64-char hex string
  const cleanToken = rawToken.trim();
  if (cleanToken.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(cleanToken)) {
    return false;
  }

  const computedHash = hashInvoiceToken(cleanToken);
  const computedBuffer = Buffer.from(computedHash, 'hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');

  if (computedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(computedBuffer, storedBuffer);
}

/**
 * Checks whether an invoice token has expired.
 */
export function isInvoiceTokenExpired(expiresAt?: Date | string | null): boolean {
  if (!expiresAt) return false; // If no expiration date set, token remains active until rotated
  const expiryTime = new Date(expiresAt).getTime();
  if (isNaN(expiryTime)) return false;
  return Date.now() > expiryTime;
}

/**
 * Sanitizes and serializes ONLY the fields required by the customer invoice page.
 * Strictly strips raw MongoDB fields, internal hashes, and unauthorized system state.
 */
export function serializeCustomerInvoice(order: any) {
  return {
    id: order.id,
    invoiceNumber: order.invoiceNumber || `INV-${order.id}`,
    customerName: order.customerName || 'Valued Client',
    phone: order.phone || '',
    address: order.address || '',
    city: order.city || '',
    pincode: order.pincode || '',
    orderNotes: order.orderNotes || '',
    courierName: order.courierName || 'Priority Air Cargo Express',
    awbNumber: order.awbNumber || null,
    estimatedDelivery: order.estimatedDelivery || 'Within 24-48 Hours',
    currentStep: order.currentStep || 'placed',
    isApproved: Boolean(order.isApproved),
    createdAt: order.createdAt,
    approvedAt: order.approvedAt || null,
    subtotal: order.subtotal ?? (order.totalAmount || 0),
    totalAmount: order.totalAmount || 0,
    items: Array.isArray(order.items)
      ? order.items.map((it: any) => ({
          product: {
            id: it.id || it.product?.id || 'item',
            name: it.name || it.product?.name || 'Marine Specimen',
            price: Number(it.price || it.product?.price || 0),
            categoryLabel: it.category || it.product?.categoryLabel || 'Marine Life',
          },
          quantity: Number(it.quantity || 1),
          warranty: it.warranty,
        }))
      : [],
  };
}
