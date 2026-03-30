import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { authApi } from '@/api/auth';
import type { UserDto } from '@/types';

function extractMsg(e: unknown, fallback: string): string {
  if (isAxiosError(e)) {
    const data = e.response?.data as Record<string, unknown> | undefined;
    if (typeof data?.message === 'string') return data.message;
  }
  return e instanceof Error ? e.message : fallback;
}

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  async init() {
    const token = localStorage.getItem('solo_access_token');
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await authApi.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('solo_access_token');
      localStorage.removeItem('solo_refresh_token');
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  async login(email, password) {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login({ email, password });
      set({ user: res.user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (e: unknown) {
      set({ error: extractMsg(e, 'Login failed'), isLoading: false });
      return false;
    }
  },

  async register(body) {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(body);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (e: unknown) {
      set({ error: extractMsg(e, 'Registration failed'), isLoading: false });
      return false;
    }
  },

  async logout() {
    const token = localStorage.getItem('solo_access_token');
    localStorage.removeItem('solo_access_token');
    localStorage.removeItem('solo_refresh_token');
    set({ user: null, isAuthenticated: false, isLoading: false });
    if (token) {
      try {
        await authApi.logout();
      } catch {
        /* ignore */
      }
    }
  },

  async refreshUser() {
    if (!get().isAuthenticated) return;
    try {
      const user = await authApi.getCurrentUser();
      set({ user });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to refresh user';
      set({ error: msg });
    }
  },

  clearError() {
    set({ error: null });
  },
}));

// Listen for forced logout from the API interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}
