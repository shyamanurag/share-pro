import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory store for rate limiting
// In production, use Redis or another distributed store
const rateLimit = new Map<string, { count: number; timestamp: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute
const AUTH_RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes for auth endpoints
const AUTH_MAX_REQUESTS_PER_WINDOW = 10; // 10 auth requests per 5 minutes

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Get client IP
  const ip = request.ip || 'unknown';
  const path = request.nextUrl.pathname;
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Apply stricter rate limits to auth endpoints
  const isAuthEndpoint = path.includes('/api/auth') || 
                         path === '/login' || 
                         path === '/signup' || 
                         path === '/forgot-password' || 
                         path === '/reset-password';
  
  const window = isAuthEndpoint ? AUTH_RATE_LIMIT_WINDOW : RATE_LIMIT_WINDOW;
  const maxRequests = isAuthEndpoint ? AUTH_MAX_REQUESTS_PER_WINDOW : MAX_REQUESTS_PER_WINDOW;
  const key = `${ip}:${isAuthEndpoint ? 'auth' : 'standard'}`;
  
  // Check rate limit
  const now = Date.now();
  const rateData = rateLimit.get(key) || { count: 0, timestamp: now };
  
  // Reset count if outside window
  if (now - rateData.timestamp > window) {
    rateData.count = 0;
    rateData.timestamp = now;
  }
  
  rateData.count++;
  rateLimit.set(key, rateData);
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - rateData.count).toString());
  response.headers.set('X-RateLimit-Reset', (rateData.timestamp + window).toString());
  
  // Block if rate limit exceeded
  if (rateData.count > maxRequests) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests', 
        message: 'Please try again later' 
      }),
      { 
        status: 429, 
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(window / 1000).toString()
        }
      }
    );
  }
  
  // Log API usage for monitoring
  if (path.startsWith('/api/')) {
    // In a production app, this would write to a database or logging service
    console.info(`API Request: ${request.method} ${path} from ${ip}`);
  }
  
  return response;
}

// Configure which paths should be processed by the middleware
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to auth pages
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    // Apply to sensitive pages
    '/dashboard',
    '/profile',
    '/portfolio',
    '/watchlist',
  ],
};