import { NextResponse, type NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window rate limiter per IP for sensitive routes
const loginRateLimitMap = new Map<string, RateLimitRecord>();

const MAX_LOGIN_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

function cleanupExpiredRecords(now: number) {
  if (loginRateLimitMap.size > 500) {
    for (const [ip, record] of loginRateLimitMap.entries()) {
      if (now > record.resetAt) {
        loginRateLimitMap.delete(ip);
      }
    }
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit /api/admin/login to prevent brute-force attacks (P0-2)
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous_client';
    const now = Date.now();

    cleanupExpiredRecords(now);

    const record = loginRateLimitMap.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + WINDOW_MS;
    }

    record.count++;
    loginRateLimitMap.set(ip, record);

    if (record.count > MAX_LOGIN_ATTEMPTS) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: `Too many login attempts. Please try again in ${retryAfterSeconds} seconds.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

// Also export middleware for backwards compatibility
export const middleware = proxy;

export const config = {
  matcher: ['/api/admin/login', '/admin/:path*'],
};
