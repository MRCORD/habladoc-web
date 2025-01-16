// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge';

// Protected middleware for routes that require authentication
export default withMiddlewareAuthRequired();

// Configure which routes use the middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/api/private/:path*',
  ]
};