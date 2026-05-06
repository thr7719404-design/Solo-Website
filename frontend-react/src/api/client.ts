import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Cache-busting for admin pages: ensure GET requests always hit the server with fresh data.
  // The backend strips `_t` from query before DTO validation (see main.ts middleware),
  // but the unique URL produces a CacheInterceptor cache miss so we get fresh data.
  try {
    const method = (config.method || 'get').toLowerCase();
    const isAdminContext =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    if (method === 'get' && isAdminContext) {
      config.params = { ...(config.params || {}), _t: Date.now() };
      if (config.headers) {
        config.headers['Cache-Control'] = 'no-cache';
        config.headers['Pragma'] = 'no-cache';
      }
    }
  } catch { /* ignore */ }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

function redirectToLoginIfNeeded() {
  if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/account')) {
    window.location.href = '/login?session=expired';
  }
}

function queueWhileRefreshing(originalRequest: any) {
  return new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  }).then((token) => {
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api(originalRequest);
  });
}

async function attemptTokenRefresh(originalRequest: any, refreshToken: string) {
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  const newAccess = data.accessToken || data.tokens?.accessToken;
  const newRefresh = data.refreshToken || data.tokens?.refreshToken;
  if (newAccess) {
    setTokens(newAccess, newRefresh || refreshToken);
    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
    processQueue(null, newAccess);
    return api(originalRequest);
  }
  return null;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) {
      throw error as Error;
    }
    if (isRefreshing) {
      return queueWhileRefreshing(originalRequest);
    }
    originalRequest._retry = true;
    isRefreshing = true;
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      isRefreshing = false;
      redirectToLoginIfNeeded();
      throw error as Error;
    }
    try {
      const result = await attemptTokenRefresh(originalRequest, refreshToken);
      if (result) return result;
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      redirectToLoginIfNeeded();
      throw refreshError as Error;
    } finally {
      isRefreshing = false;
    }
    throw error as Error;
  }
);

export default api;
