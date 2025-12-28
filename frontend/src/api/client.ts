import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { ApiError } from '../types';
import { performanceMonitor } from '../services/performance';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000, // 30 seconds - increased for operations like payouts that send notifications
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
export const retryConfig = {
  retries: 3, // Retry up to 3 times
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff: 100ms, 200ms, 400ms
  retryCondition: (error: any) => {
    // Retry on network errors or 5xx server errors
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status !== undefined && error.response.status >= 500)
    );
  },
  shouldResetTimeout: true, // Reset timeout on each retry
  onRetry: (retryCount: number, error: any, requestConfig: any) => {
    console.log(`Retrying request (${retryCount}/3):`, requestConfig.url);
  },
};

// Configure axios-retry for automatic retries on network/server errors
axiosRetry(apiClient, retryConfig);

// Request interceptor to add auth token and start performance tracking
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Start performance tracking
    const requestId = performanceMonitor.startApiRequest(
      config.method?.toUpperCase() || 'GET',
      config.url || ''
    );
    (config as any).__performanceId = requestId;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling and performance tracking
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // End performance tracking on success
    const requestId = (response.config as any).__performanceId;
    if (requestId) {
      performanceMonitor.endApiRequest(requestId, response.status);
    }

    return response;
  },
  (error: AxiosError) => {
    // End performance tracking on error
    const requestId = error.config ? (error.config as any).__performanceId : undefined;
    if (requestId) {
      performanceMonitor.endApiRequest(requestId, error.response?.status || 0);
    }

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