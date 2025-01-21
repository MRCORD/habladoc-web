// src/lib/api.ts
import axios from 'axios';

// Token management
let currentToken: string | null = null;
let tokenExpirationTime: number | null = null;

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Token management
export const getCurrentToken = () => {
  if (!currentToken || !tokenExpirationTime || Date.now() >= tokenExpirationTime) {
    return null;
  }
  return currentToken;
};

// Request interceptor
api.interceptors.request.use(async (config) => {
  try {
    console.log('🔄 Making API request:', {
      url: config.url,
      method: config.method
    });

    // Check if token is expired or missing
    if (!currentToken || !tokenExpirationTime || Date.now() >= tokenExpirationTime) {
      const response = await fetch('/api/auth/token');
      const data = await response.json();
      
      if (data.accessToken) {
        console.log('✅ Got access token from Auth0');
        currentToken = data.accessToken;
        // Set expiration to 1 hour from now
        tokenExpirationTime = Date.now() + (60 * 60 * 1000);
        config.headers.Authorization = `Bearer ${data.accessToken}`;
      }
    } else {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    
    return config;
  } catch (error) {
    console.error('❌ Error in request interceptor:', error);
    return Promise.reject(error);
  }
});

// Response interceptor for successful responses
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      console.error('❌ Network Error:', {
        url: error.config?.url,
        message: error.message,
        error
      });
    }
    return Promise.reject(error);
  }
);

// Retry interceptor for failed requests
api.interceptors.response.use(undefined, async (error) => {
  const shouldRetry = 
    error.code === 'ERR_NETWORK' || 
    error.response?.status === 429 ||
    error.response?.status === 401;

  if (shouldRetry && !error.config._retry) {
    error.config._retry = true;

    // Clear token on authentication errors
    if (error.response?.status === 401) {
      currentToken = null;
      tokenExpirationTime = null;
    }

    // Retry the request
    try {
      return await api(error.config);
    } catch (retryError) {
      console.error('❌ Retry failed:', retryError);
      return Promise.reject(retryError);
    }
  }

  return Promise.reject(error);
});

// Utility functions
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