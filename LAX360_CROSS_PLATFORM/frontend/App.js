import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { CartProvider } from './src/context/CartContext';
import { AppLayout } from './src/layouts/AppLayout';
import { ErrorBoundary } from './src/components/ErrorBoundary';

import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { POSScreen } from './src/screens/POSScreen';
import { InvoicesScreen } from './src/screens/InvoicesScreen';
import { ProductsScreen } from './src/screens/ProductsScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { CouponsScreen } from './src/screens/CouponsScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const MainNavigation = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activeRoute, setActiveRoute] = useState('dashboard');

  // Global Keyboard Shortcuts (e.g. F2 for New Bill / POS)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveRoute('pos');
      }
    };
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Unauthenticated Flow
  if (!user) {
    return <LoginScreen />;
  }

  // Authenticated Screen Switcher
  const renderScreen = () => {
    switch (activeRoute) {
      case 'dashboard':
        return <DashboardScreen onNavigate={setActiveRoute} />;
      case 'pos':
        return <POSScreen />;
      case 'invoices':
        return <InvoicesScreen />;
      case 'products':
        return <ProductsScreen />;
      case 'customers':
        return <CustomersScreen />;
      case 'coupons':
        return <CouponsScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen onNavigate={setActiveRoute} />;
    }
  };

  return (
    <AppLayout activeRoute={activeRoute} onNavigate={setActiveRoute}>
      {renderScreen()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <ThemeProvider>
            <CartProvider>
              <MainNavigation />
            </CartProvider>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A'
  }
});
