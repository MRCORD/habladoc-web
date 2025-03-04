// src/app/api/icd/token/route.ts
import { NextResponse } from 'next/server';

// This is a server-side API route that won't expose credentials in client code
export async function GET() {
  try {
    // Client credentials should ideally be stored in environment variables
    const clientId = process.env.ICD_CLIENT_ID || 'f7574d19-c342-4d4a-ad9c-5c6c8dda6cb2_d2ee6484-98a6-4975-b1ca-131893a734a6';
    const clientSecret = process.env.ICD_CLIENT_SECRET || 'kaLbknTsSH76516QJ/4FNJDva5pkD7IaD9UwxkVai4g=';
    
    // Encode credentials for Basic Auth
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Request token from WHO API
    const response = await fetch('https://icdaccessmanagement.who.int/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: 'grant_type=client_credentials&scope=icdapi_access'
    });
    
    if (!response.ok) {
      console.error('Failed to get ICD token:', await response.text());
      return NextResponse.json({ error: 'Failed to get ICD token' }, { status: 500 });
    }
    
    const data = await response.json();
    
    // Return only the access token to the client
    return NextResponse.json({ 
      token: data.access_token,
      // Optionally include expiration time to help with client-side caching
      expiresIn: data.expires_in 
    });
  } catch (error) {
    console.error('Error fetching ICD token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}