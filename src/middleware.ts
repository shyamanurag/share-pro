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
  
  // Get client IP and path
  const ip = request.ip || 'unknown';
  const path = request.nextUrl.pathname;
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Determine if this is an auth endpoint
  const isAuthEndpoint = path.includes('/api/auth') || 
                         path === '/login' || 
                         path === '/signup' || 
                         path === '/forgot-password' || 
                         path === '/reset-password';
  
  // Log API usage for monitoring
  if (path.startsWith('/api/')) {
    console.info(`API Request: ${request.method} ${path} from ${ip}`);
  }
  
  return response;
}

// Configure middleware to run on important routes but not all routes
export const config = {
  matcher: [
    // Apply to auth pages
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    // Apply to important API routes
    '/api/portfolio/:path*',
    '/api/watchlist/:path*',
    '/api/watchlists/:path*',
    '/api/user/:path*',
  ],
};