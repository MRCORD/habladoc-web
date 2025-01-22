// src/middleware.ts
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

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