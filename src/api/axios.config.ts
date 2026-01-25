import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

/**
 * Default retry configuration
 */
const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000, // Start with 1 second
  retryCondition: (error: AxiosError) => {
    // Retry on network errors, timeouts, and 5xx errors
    if (!error.response) {
      // Network error or timeout
      return true;
    }
    const status = error.response.status;
    // Retry on 5xx server errors, but not on 4xx client errors
    return status >= 500 && status < 600;
  },
};

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number, baseDelay: number): number => {
  return baseDelay * Math.pow(2, attempt);
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Create axios instance with interceptors
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Get token from localStorage
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request in development
      if (import.meta.env.DEV) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
          data: config.data,
          params: config.params,
        });
      }

      return config;
    },
    (error: AxiosError) => {
      if (import.meta.env.DEV) {
        console.error('[API Request Error]', error);
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle errors and retry logic
  instance.interceptors.response.use(
    (response) => {
      // Log response in development
      if (import.meta.env.DEV) {
        console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: response.data,
        });
      }

      // Handle backend response format
      if (response.data && typeof response.data === 'object') {
        // If backend returns { success: true, data: {...} }, extract data
        if (response.data.success === true && response.data.data !== undefined) {
          return { ...response, data: response.data.data };
        }
        // If backend returns { success: false, error: {...} }, throw error
        if (response.data.success === false) {
          const error = new Error(response.data.error?.message || 'An error occurred');
          (error as any).code = response.data.error?.code;
          (error as any).requiresVerification = response.data.requiresVerification;
          throw error;
        }
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

      // Don't retry if request was cancelled or if retry flag is set to false
      if (axios.isCancel(error) || originalRequest._retry === false) {
        return Promise.reject(error);
      }

      // Initialize retry count
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      // Get retry config from request or use default
      const retryConfig: RetryConfig = (originalRequest as any).retryConfig || defaultRetryConfig;

      // Check if we should retry
      const shouldRetry =
        originalRequest._retryCount < retryConfig.retries &&
        (retryConfig.retryCondition ? retryConfig.retryCondition(error) : true);

      if (shouldRetry) {
        originalRequest._retryCount += 1;
        originalRequest._retry = true;

        // Calculate delay with exponential backoff
        const delay = getRetryDelay(originalRequest._retryCount - 1, retryConfig.retryDelay);

        if (import.meta.env.DEV) {
          console.warn(
            `[API Retry] Attempt ${originalRequest._retryCount}/${retryConfig.retries} after ${delay}ms`,
            error.message
          );
        }

        // Wait before retrying
        await sleep(delay);

        // Retry the request
        return instance(originalRequest);
      }

      // Handle 401 Unauthorized - Token refresh logic can be added here
      if (error.response?.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken && !originalRequest._retry) {
          // TODO: Implement token refresh logic
          // For now, clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (window.location.pathname !== '/signin' && window.location.pathname !== '/login') {
            window.location.href = '/signin';
          }
        }
      }

      // Log error in development
      if (import.meta.env.DEV) {
        console.error('[API Error]', {
          url: originalRequest.url,
          method: originalRequest.method,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });
      }

      // Format error for consistent handling
      const apiError = new Error(
        (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'An error occurred'
      );
      (apiError as any).code = (error.response?.data as any)?.error?.code;
      (apiError as any).requiresVerification = (error.response?.data as any)?.requiresVerification;
      (apiError as any).status = error.response?.status;
      (apiError as any).response = error.response;

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// Export the configured axios instance
export const apiClient = createAxiosInstance();

/**
 * Make an API request with retry configuration
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: AxiosRequestConfig & { retryConfig?: RetryConfig } = {}
): Promise<T> => {
  const { retryConfig, ...axiosConfig } = options;

  // Add retry config to request
  if (retryConfig) {
    (axiosConfig as any).retryConfig = retryConfig;
  }

  const response = await apiClient.request<T>({
    url: endpoint,
    ...axiosConfig,
  });

  return response.data;
};

/**
 * Helper methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig & { retryConfig?: RetryConfig }) =>
    apiRequest<T>(url, { ...config, method: 'GET' }),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig & { retryConfig?: RetryConfig }) =>
    apiRequest<T>(url, { ...config, method: 'POST', data }),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig & { retryConfig?: RetryConfig }) =>
    apiRequest<T>(url, { ...config, method: 'PUT', data }),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig & { retryConfig?: RetryConfig }) =>
    apiRequest<T>(url, { ...config, method: 'PATCH', data }),
  delete: <T = any>(url: string, config?: AxiosRequestConfig & { retryConfig?: RetryConfig }) =>
    apiRequest<T>(url, { ...config, method: 'DELETE' }),
};

export default apiClient;
