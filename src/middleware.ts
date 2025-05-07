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
  // Simply pass through all requests with minimal headers
  const response = NextResponse.next();
  
  // Add only the most basic security header
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

// Configure middleware to only run on auth-related pages
// This is a minimal configuration to avoid any potential issues
export const config = {
  matcher: [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],
};