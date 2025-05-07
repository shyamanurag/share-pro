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
  // Create the response object
  const response = NextResponse.next();
  
  // Get client IP and path
  const ip = request.ip || 'unknown';
  const path = request.nextUrl.pathname;
  
  // Add basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Determine if this is an auth endpoint
  const isAuthEndpoint = path.includes('/api/auth') || 
                         path === '/login' || 
                         path === '/signup' || 
                         path === '/forgot-password' || 
                         path === '/reset-password';
  
  // Set rate limit parameters based on endpoint type
  const window = isAuthEndpoint ? AUTH_RATE_LIMIT_WINDOW : RATE_LIMIT_WINDOW;
  const maxRequests = isAuthEndpoint ? AUTH_MAX_REQUESTS_PER_WINDOW : MAX_REQUESTS_PER_WINDOW;
  const key = `${ip}:${isAuthEndpoint ? 'auth' : 'standard'}`;
  
  // Get current rate data or initialize new
  const now = Date.now();
  const rateData = rateLimit.get(key) || { count: 0, timestamp: now };
  
  // Reset count if outside window
  if (now - rateData.timestamp > window) {
    rateData.count = 0;
    rateData.timestamp = now;
  }
  
  // Increment request count
  rateData.count++;
  rateLimit.set(key, rateData);
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - rateData.count).toString());
  
  // Only block if significantly over rate limit (give some buffer)
  if (rateData.count > maxRequests * 2) {
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
  
  return response;
}

// Configure which paths should be processed by the middleware
export const config = {
  matcher: [
    // Apply only to specific API routes that need protection
    '/api/portfolio/:path*',
    '/api/watchlist/:path*',
    '/api/watchlists/:path*',
    '/api/user/:path*',
    '/api/transactions/:path*',
    // Apply to auth pages
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],
};