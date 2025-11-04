// src/config/api.js
import axios from 'axios';
import { toast } from 'react-toastify';

// Use environment variable or fallback to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle global API errors and session management
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized: clear user/session, show error, redirect
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      toast.error('Session expired. Please log in again.');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else if (error.response) {
      // Other API errors (4xx, 5xx)
      const message = error.response.data?.message || 'An API error occurred';
      toast.error(message);
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Network/connection errors
      toast.error('Network error. Please check your connection.');
      console.error('Network Error:', error.request);
    } else {
      // Unknown errors
      toast.error('An unexpected error occurred.');
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
