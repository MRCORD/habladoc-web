// src/app/api/auth/token/route.ts
import { cookies, headers } from 'next/headers';
import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 Getting access token...');
    
    // Get a new headers instance
    const headersList = headers();
    
    const accessTokenResponse = await getAccessToken();
    const accessToken = accessTokenResponse?.accessToken;
    
    if (accessToken) {
      console.log('✅ Access token retrieved successfully');
      return new NextResponse(
        JSON.stringify({ accessToken }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Custom-Header': 'CustomHeaderValue',
            'X-Another-Header': 'AnotherHeaderValue'
          },
        }
      );
    } else {
      console.warn('⚠️ No access token available');
      return new NextResponse(
        JSON.stringify({ error: 'No access token available' }),
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to get access token' }),
      { status: 500 }
    );
  }
}