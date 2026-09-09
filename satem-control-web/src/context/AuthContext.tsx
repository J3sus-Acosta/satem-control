import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken } from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'OPERATIONS' | 'ACCOUNTING' | 'TECHNICIAN' | 'VIEWER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await api.post('/auth/refresh');
      setAccessToken(res.data.data.accessToken);
      setUser(res.data.data.user);
    } catch (err) {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.data.accessToken);
    setUser(res.data.data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser utilizado dentro de AuthProvider');
  return context;
};
