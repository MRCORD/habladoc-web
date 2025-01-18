// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  try {
    console.log('🔄 Making API request:', {
      url: config.url,
      method: config.method
    });

    const response = await fetch('/api/auth/token');
    const data = await response.json();
    
    if (data.accessToken) {
      console.log('✅ Got access token from Auth0');
      config.headers.Authorization = `Bearer ${data.accessToken}`;
    }
    
    return config;
  } catch (error) {
    console.error('❌ Error in request interceptor:', error);
    return Promise.reject(error);
  }
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      headers: response.headers,
      data: response.data  // Add this to see the response data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else {
      console.error('❌ Network Error:', {
        url: error.config?.url,
        message: error.message,
        error: error  // Add full error object
      });
    }
    return Promise.reject(error);
  }
);

// Add retry logic for failed requests
api.interceptors.response.use(undefined, async (error) => {
  if (error.code === 'ERR_NETWORK' || error.response?.status === 429) {
    const config = error.config;
    
    // Only retry once
    if (!config._retry) {
      config._retry = true;
      return api(config);
    }
  }
  return Promise.reject(error);
});

export async function verifyOrCreateUser() {
  try {
    console.log('🔄 Attempting to verify/create user...');
    const response = await api.post('/api/v1/users/auth/verify');
    console.log('✅ Verify user response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error verifying user:', error);
    throw error;
  }
}

export default api;