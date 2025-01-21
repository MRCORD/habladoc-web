// src/pages/api/auth/login.ts
import { handleLogin } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await handleLogin(req, res, {
    authorizationParams: {
      scope: 'openid profile email', // Example scopes
    },
  });
}