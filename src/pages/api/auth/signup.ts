// src/pages/api/auth/signup.ts
import { handleLogin } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await handleLogin(req, res, {
    authorizationParams: {
      screen_hint: 'signup', // Direct the user to the signup screen
    },
  });
}



