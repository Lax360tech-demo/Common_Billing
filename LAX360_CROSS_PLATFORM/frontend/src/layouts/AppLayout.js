import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { ToastContainer } from '../components/Toast';
import { ReceiptModal } from '../components/ReceiptModal';
import { UpdateNotification } from '../components/UpdateNotification';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

export const AppLayout = ({ children, activeRoute, onNavigate }) => {
  const { width } = useWindowDimensions();
  const { activeTheme } = useTheme();
  const { isSuccessOpen, setIsSuccessOpen, lastCompletedInvoice } = useCart();
  const colors = activeTheme.colors;

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isTablet);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgMain || '#F8FAFC' }]}>
      {/* Toast Messages */}
      <ToastContainer />

      {/* Auto-Update Notification Banner */}
      <UpdateNotification />

      {/* Global Invoice Receipt Modal */}
      <ReceiptModal
        visible={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        invoice={lastCompletedInvoice}
      />

      <View style={styles.mainContainer}>
        {/* Left Sidebar for Desktop and Tablets */}
        {(isDesktop || isTablet) && (
          <Sidebar
            activeRoute={activeRoute}
            onNavigate={onNavigate}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}

        {/* Content Pane */}
        <View style={styles.contentPane}>
          <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
          <View style={styles.pageBody}>{children}</View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden'
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%'
  },
  contentPane: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden'
  },
  pageBody: {
    flex: 1,
    overflow: 'auto'
  }
});
