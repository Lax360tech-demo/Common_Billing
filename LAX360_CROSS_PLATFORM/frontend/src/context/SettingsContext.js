import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { token } = useAuth();
  const [settings, setSettings] = useState({
    store: {
      storeName: 'Lady Avenue Showroom',
      tagline: 'Authentic Textile & Apparel Store',
      address: '124, Usman Road, T. Nagar',
      city: 'Salem',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: '600017',
      phone: '9876543210',
      email: 'admin@gmail.com',
      gstin: '33AABCS8899K1ZM',
      pan: ''
    },
    billing: {
      invoicePrefix: 'TEX-2026-',
      nextSequence: 1001,
      defaultGSTRate: 5.0,
      pricingMode: 'inclusive',
      defaultPaperSize: '80mm',
      defaultPaymentMethod: 'Cash',
      enableRounding: true,
      cashierName: 'Admin Manager',
      enableAutoCoupons: true,
      autoCouponThreshold: 2000.0,
      autoCouponDiscount: 100.0,
      autoCouponMinPurchase: 1000.0,
      termsAndConditions:
        '1. Goods once sold can be exchanged within 7 days with original bill.\n2. Cut-length fabrics & pure silk sarees are non-returnable.\nThank you for shopping with us!'
    },
    appearance: {
      theme: 'default',
      mode: 'light'
    }
  });

  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data && data.store) {
        setSettings(data);
      }
    } catch (e) {
      console.warn('Failed to load settings from backend:', e);
    }
  };

  useEffect(() => {
    if (token) {
      loadSettings();
    }
  }, [token]);

  const updateSettings = async (newSettings) => {
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
      showToast('Store & Billing Settings saved.', 'success');
      return updated;
    } catch (e) {
      showToast(e.message || 'Failed to update settings', 'error');
      throw e;
    }
  };

  const resetDemoData = async () => {
    try {
      const res = await api.resetDemoData();
      await loadSettings();
      showToast('Catalog restored to factory demo state (40 items).', 'success');
      return res;
    } catch (e) {
      showToast(e.message || 'Failed to reset demo data', 'error');
      throw e;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loadSettings,
        updateSettings,
        resetDemoData,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
