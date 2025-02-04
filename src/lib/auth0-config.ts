// src/lib/auth0-config.ts
import { ConfigParameters } from '@auth0/nextjs-auth0';

export const auth0Config: ConfigParameters = {
  auth0Logout: true,
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  routes: {
    callback: '/api/auth/callback',
    login: '/api/auth/login',
    postLogoutRedirect: '/api/auth/logout'  // Updated from 'logout' to 'postLogoutRedirect'
  },
  session: {
    rollingDuration: 60 * 60 * 24, // 24 hours
    absoluteDuration: 60 * 60 * 24 * 7, // 7 days
  },
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email'
  }
};