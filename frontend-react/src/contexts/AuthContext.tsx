import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { UserDto } from '../types';
import { authApi } from '../api/auth';
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from '../api/client';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isAdmin: false,
  });

  const restoreSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }
    try {
      const user = await authApi.me();
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN',
      });
    } catch {
      clearTokens();
      setState({ user: null, isAuthenticated: false, isLoading: false, error: null, isAdmin: false });
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await authApi.login(email, password);
      setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      setState({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isAdmin: res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN',
      });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      setState(s => ({ ...s, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await authApi.register(data);
      setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      setState({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isAdmin: res.user.role === 'ADMIN' || res.user.role === 'SUPER_ADMIN',
      });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      setState(s => ({ ...s, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      clearTokens();
      setState({ user: null, isAuthenticated: false, isLoading: false, error: null, isAdmin: false });
    }
  }, []);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, loading: state.isLoading, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
