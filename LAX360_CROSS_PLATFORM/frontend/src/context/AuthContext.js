import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = await storage.getItem('texbill_token');
        const savedUserStr = await storage.getItem('texbill_user');
        if (savedToken && savedUserStr) {
          setToken(savedToken);
          setUser(JSON.parse(savedUserStr));
        }
      } catch (e) {
        console.warn('Failed to restore auth session:', e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.login(identifier, password);
    setToken(res.access_token);
    setUser(res.user);
    await storage.setItem('texbill_token', res.access_token);
    await storage.setItem('texbill_user', JSON.stringify(res.user));
    return res;
  };

  const register = async (payload) => {
    const res = await api.register(payload);
    setToken(res.access_token);
    setUser(res.user);
    await storage.setItem('texbill_token', res.access_token);
    await storage.setItem('texbill_user', JSON.stringify(res.user));
    return res;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await storage.removeItem('texbill_token');
    await storage.removeItem('texbill_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
