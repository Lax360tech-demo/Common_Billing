import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err) {
      console.warn('Settings load error:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <AppContext.Provider
      value={{
        settings,
        refreshSettings: fetchSettings,
        toast,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
