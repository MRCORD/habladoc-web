// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
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
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

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