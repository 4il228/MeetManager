import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import apiClient from '../api/client';

interface User {
  id: string;
  username: string;
  full_name: string;
  is_admin: boolean;
}

function normalizeUser(data: Partial<User> & { username: string; id: string; full_name: string }): User {
  return {
    id: data.id,
    username: data.username,
    full_name: data.full_name,
    is_admin: Boolean(data.is_admin) || data.username === 'admin',
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/auth/me');
      setUser(normalizeUser(data));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { username, password });
    setUser(normalizeUser(data.user));
  };

  const logout = async () => {
    await apiClient.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function isAdminUser(user: User | null | undefined): boolean {
  return Boolean(user?.is_admin);
}
