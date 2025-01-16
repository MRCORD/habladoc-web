// src/app/api/auth/[auth0]/route.ts
import { handleAuth } from '@auth0/nextjs-auth0';

const handler = handleAuth();
export const GET = handler;
export const POST = handler;