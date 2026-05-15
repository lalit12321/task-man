'use client';

import {
  createContext, useContext, useEffect, useState, ReactNode, useCallback,
} from 'react';
import { apiFetch } from '@/lib/api';
import { UserProfile } from '@/lib/types';
import type { TeamRole } from '@/lib/types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: TeamRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await apiFetch<{ user: UserProfile | null }>('/api/auth/me');
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string, role: TeamRole) => {
    const { user } = await apiFetch<{ user: UserProfile }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email, password, displayName, role,
      }),
    });
    setUser(user);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user } = await apiFetch<{ user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
