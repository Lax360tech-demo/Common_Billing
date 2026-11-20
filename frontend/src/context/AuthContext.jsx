import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { getCategoryConfig } from '../utils/businessCategories';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lax360_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [business, setBusiness] = useState(() => {
    try {
      const saved = localStorage.getItem('lax360_business');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [categoryConfig, setCategoryConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lax360_category_config');
      return saved ? JSON.parse(saved) : getCategoryConfig('retail_store');
    } catch {
      return getCategoryConfig('retail_store');
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('lax360_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setBusiness(res.data.business);
      const catCfg = res.data.category_config || getCategoryConfig(res.data.business?.category || 'retail_store');
      setCategoryConfig(catCfg);
      localStorage.setItem('lax360_user', JSON.stringify(res.data.user));
      localStorage.setItem('lax360_business', JSON.stringify(res.data.business));
      localStorage.setItem('lax360_category_config', JSON.stringify(catCfg));
    } catch (err) {
      console.warn('Session check note:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { access_token, user: userData, business: bizData, category_config: catCfg } = res.data;
    localStorage.setItem('lax360_access_token', access_token);
    localStorage.setItem('lax360_user', JSON.stringify(userData));
    localStorage.setItem('lax360_business', JSON.stringify(bizData));
    const finalCatCfg = catCfg || getCategoryConfig(bizData?.category || 'retail_store');
    localStorage.setItem('lax360_category_config', JSON.stringify(finalCatCfg));

    setUser(userData);
    setBusiness(bizData);
    setCategoryConfig(finalCatCfg);
    return res.data;
  };

  const register = async (registrationData) => {
    const res = await api.post('/auth/register', registrationData);
    const { access_token, user: userData, business: bizData, category_config: catCfg } = res.data;
    localStorage.setItem('lax360_access_token', access_token);
    localStorage.setItem('lax360_user', JSON.stringify(userData));
    localStorage.setItem('lax360_business', JSON.stringify(bizData));
    const finalCatCfg = catCfg || getCategoryConfig(bizData?.category || 'retail_store');
    localStorage.setItem('lax360_category_config', JSON.stringify(finalCatCfg));

    setUser(userData);
    setBusiness(bizData);
    setCategoryConfig(finalCatCfg);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('lax360_access_token');
    localStorage.removeItem('lax360_user');
    localStorage.removeItem('lax360_business');
    localStorage.removeItem('lax360_category_config');
    setUser(null);
    setBusiness(null);
  };

  const updateBusinessState = (updatedBiz) => {
    setBusiness(updatedBiz);
    localStorage.setItem('lax360_business', JSON.stringify(updatedBiz));
    if (updatedBiz.category) {
      const cfg = getCategoryConfig(updatedBiz.category);
      setCategoryConfig(cfg);
      localStorage.setItem('lax360_category_config', JSON.stringify(cfg));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        categoryConfig,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateBusinessState,
        refreshSession: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
