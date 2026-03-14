import axios from 'axios';

// Default to same-origin (empty string) if REACT_APP_BACKEND_URL is not set
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');
const API = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      
      // Only redirect for explicit auth actions (login/register failed won't trigger)
      // Never redirect automatically - let components handle their own auth state
      const authEndpoints = ['/auth/me'];
      const isAuthCheck = authEndpoints.some(ep => url.includes(ep));
      
      if (isAuthCheck) {
        localStorage.removeItem('session_token');
        localStorage.removeItem('user');
      }
      // Don't redirect to /login automatically - let ProtectedRoute handle it
    }
    return Promise.reject(error);
  }
);

export default api;