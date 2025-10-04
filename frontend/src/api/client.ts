import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from '../types';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token when available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status || 500,
      details: error.response?.data,
    };

    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      apiError.message = 'Authentication required. Please log in.';
    } else if (error.response?.status === 403) {
      apiError.message = 'You do not have permission to perform this action.';
    } else if (error.response?.status === 404) {
      apiError.message = 'The requested resource was not found.';
    } else if (error.response?.status === 422) {
      apiError.message = 'Invalid data provided. Please check your input.';
    } else if (error.response?.status >= 500) {
      apiError.message = 'Server error. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      apiError.message = 'Request timeout. Please try again.';
    } else if (!error.response) {
      apiError.message = 'Network error. Please check your connection.';
    } else if (error.response?.data?.detail) {
      // Extract FastAPI error details
      if (typeof error.response.data.detail === 'string') {
        apiError.message = error.response.data.detail;
      } else if (Array.isArray(error.response.data.detail)) {
        apiError.message = error.response.data.detail
          .map((err: any) => err.msg || err.message || err)
          .join(', ');
      } else if (error.response.data.detail.message) {
        apiError.message = error.response.data.detail.message;
      }
    }

    return Promise.reject(apiError);
  }
);

// Helper function for handling API responses
export const handleApiResponse = <T>(response: AxiosResponse<T>): T => {
  return response.data;
};

// Helper function for handling API errors
export const handleApiError = (error: ApiError): never => {
  console.error('API Error:', error);
  throw error;
};

// Generic API request methods
export const api = {
  get: <T>(url: string, params?: any): Promise<T> =>
    apiClient.get(url, { params }).then(handleApiResponse),

  post: <T>(url: string, data?: any): Promise<T> =>
    apiClient.post(url, data).then(handleApiResponse),

  put: <T>(url: string, data?: any): Promise<T> =>
    apiClient.put(url, data).then(handleApiResponse),

  patch: <T>(url: string, data?: any): Promise<T> =>
    apiClient.patch(url, data).then(handleApiResponse),

  delete: <T>(url: string): Promise<T> =>
    apiClient.delete(url).then(handleApiResponse),
};

export default apiClient;