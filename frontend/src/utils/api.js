import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API,
  withCredentials: true,
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
      // Don't redirect if the request has a custom flag to skip redirect
      // or if it's a request that doesn't require auth (e.g., checking availability)
      const skipRedirect = error.config?.skipAuthRedirect;
      const url = error.config?.url || '';
      
      // Skip redirect for public endpoints being queried without auth
      const publicEndpoints = ['/bookings', '/favorites/check'];
      const isPublicQuery = publicEndpoints.some(ep => url.includes(ep));
      
      if (!skipRedirect && !isPublicQuery) {
        localStorage.removeItem('session_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;