import React, { createContext, useContext, useState, useEffect } from 'react';
import { portalApi, setPortalAccessToken } from '../services/portalApi';

export interface ClientUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  customerId: string;
  customerName?: string;
  customerTaxId?: string;
  allowedEntities?: Array<{ id: string; name: string }>;
}

interface PortalAuthContextType {
  clientUser: ClientUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (token: string, user: ClientUser) => void;
  refreshProfile: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export const PortalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await portalApi.post('/auth/refresh');
      setPortalAccessToken(res.data.data.accessToken);
      setClientUser(res.data.data.clientUser);
    } catch (err) {
      setPortalAccessToken(null);
      setClientUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await portalApi.post('/auth/login', { email, password });
    setPortalAccessToken(res.data.data.accessToken);
    setClientUser(res.data.data.clientUser);
  };

  const logout = async () => {
    try {
      await portalApi.post('/auth/logout');
    } finally {
      setPortalAccessToken(null);
      setClientUser(null);
    }
  };

  const setSession = (token: string, user: ClientUser) => {
    setPortalAccessToken(token);
    setClientUser(user);
  };

  const refreshProfile = async () => {
    try {
      const res = await portalApi.get('/auth/me');
      if (res.data.data) {
        setClientUser((prev) => ({
          ...prev!,
          fullName: res.data.data.fullName,
          phone: res.data.data.phone,
          customerName: res.data.data.customer?.legalName || prev?.customerName,
          allowedEntities: res.data.data.allowedEntities,
        }));
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  return (
    <PortalAuthContext.Provider value={{ clientUser, loading, login, logout, setSession, refreshProfile }}>
      {children}
    </PortalAuthContext.Provider>
  );
};

export const usePortalAuth = () => {
  const context = useContext(PortalAuthContext);
  if (!context) throw new Error('usePortalAuth debe ser utilizado dentro de PortalAuthProvider');
  return context;
};
