import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from './mongodb';
import { RateLimitModel } from '@/models/RateLimit';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  current: number;
}

// In-memory fallback map to catch tight micro-bursts before DB round-trips
const inMemoryCache = new Map<string, { count: number; resetAt: number }>();

function cleanOldMemoryEntries() {
  const now = Date.now();
  for (const [key, data] of inMemoryCache.entries()) {
    if (data.resetAt <= now) {
      inMemoryCache.delete(key);
    }
  }
}

/**
 * Extracts verified client IP address safely.
 * Prioritizes platform-authenticated headers (Vercel) over user-controllable headers.
 * Validates against IP address format to prevent header injection or spoofing.
 */
export function getClientIp(req: NextRequest): string {
  // 1. Vercel edge proxy authenticated header (cannot be spoofed by clients on Vercel)
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const candidate = vercelIp.split(',')[0].trim();
    if (isValidIp(candidate)) return candidate;
  }

  // 2. Standard x-real-ip
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    const candidate = realIp.trim();
    if (isValidIp(candidate)) return candidate;
  }

  // 3. Standard x-forwarded-for (take leftmost address, but validate syntax)
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const candidate = xff.split(',')[0].trim();
    if (isValidIp(candidate)) return candidate;
  }

  // Fallback for local development or non-proxy requests
  return '127.0.0.1';
}

function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string' || ip.length > 45) return false;
  // IPv4 or IPv6
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Enforces rate limiting backed by persistent MongoDB collection (with TTL index).
 * Persists counts across serverless function instances and container lifecycles.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;

  // 1. In-memory check for immediate burst clamping
  cleanOldMemoryEntries();
  const memEntry = inMemoryCache.get(key);
  if (memEntry && memEntry.resetAt > now) {
    memEntry.count += 1;
    if (memEntry.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((memEntry.resetAt - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
        current: memEntry.count,
      };
    }
  } else {
    inMemoryCache.set(key, { count: 1, resetAt });
  }

  // 2. Persistent distributed check via MongoDB
  try {
    await connectToDatabase();
    const expiresAt = new Date(resetAt);

    // Atomic increment or insert
    const record = await RateLimitModel.findOneAndUpdate(
      { key },
      {
        $inc: { points: 1 },
        $setOnInsert: { expiresAt },
      },
      { upsert: true, new: true }
    );

    const points = record.points;
    const expiresMs = record.expiresAt ? record.expiresAt.getTime() : resetAt;
    const retryAfter = Math.max(1, Math.ceil((expiresMs - now) / 1000));

    if (points > limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
        current: points,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - points),
      retryAfter,
      current: points,
    };
  } catch (error) {
    // If MongoDB is momentarily unreachable, rely on the in-memory cache
    console.warn(`[RateLimit] MongoDB check error for ${key}, falling back to memory:`, error);
    const count = memEntry ? memEntry.count : 1;
    if (count > limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: windowSeconds,
        current: count,
      };
    }
    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      retryAfter: windowSeconds,
      current: count,
    };
  }
}

/**
 * Generates standard HTTP 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitResponse(retryAfter: number, customMessage?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: customMessage || 'Too many requests. Please slow down and try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + retryAfter),
      },
    }
  );
}
