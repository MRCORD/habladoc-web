// src/app/api/auth/token/route.ts
import { cookies } from 'next/headers';
import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 Getting access token...');
    
    // Await the cookies
    await cookies();
    
    const accessTokenResponse = await getAccessToken();
    const accessToken = accessTokenResponse?.accessToken;
    
    if (accessToken) {
      console.log('✅ Access token retrieved successfully');
      return NextResponse.json({ accessToken });
    } else {
      console.warn('⚠️ No access token available');
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    return NextResponse.json(
      { error: 'Failed to get access token' },
      { status: 500 }
    );
  }
}