// app/api/auth/token/route.ts
import { cookies } from 'next/headers';
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 Getting access token...');
    
    // Get the session directly using getSession
    const session = await getSession();
    
    if (!session?.accessToken) {
      console.warn('⚠️ No access token available');
      return new NextResponse(
        JSON.stringify({ error: 'No access token available' }),
        { status: 401 }
      );
    }

    console.log('✅ Access token retrieved successfully');
    return new NextResponse(
      JSON.stringify({ accessToken: session.accessToken }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        },
      }
    );
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to get access token' }),
      { status: 500 }
    );
  }
}