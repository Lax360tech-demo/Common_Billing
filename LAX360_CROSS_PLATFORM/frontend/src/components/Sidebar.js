import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

export const NAV_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', icon: '📊', hotkey: '' },
  { id: 'pos', name: 'New Bill / POS', icon: '⚡', highlight: true, hotkey: 'F2' },
  { id: 'invoices', name: 'All Invoices', icon: '🧾', hotkey: '' },
  { id: 'products', name: 'Products', icon: '👗', hotkey: '' },
  { id: 'customers', name: 'Customers', icon: '👥', hotkey: '' },
  { id: 'coupons', name: 'Coupons & Offers', icon: '🎟️', hotkey: '' },
  { id: 'reports', name: 'Sales Reports', icon: '📈', hotkey: '' },
  { id: 'settings', name: 'Settings', icon: '⚙️', hotkey: '' }
];

export const Sidebar = ({ activeRoute, onNavigate, isCollapsed, onToggleCollapse }) => {
  const { activeTheme } = useTheme();
  const { cartItems } = useCart();
  const colors = activeTheme.colors;

  return (
    <View
      style={[
        styles.container,
        {
          width: isCollapsed ? 76 : 240,
          backgroundColor: colors.bgSidebar || '#0F172A',
          borderRightColor: colors.sidebarBorder || '#1E293B'
        }
      ]}
    >
      {/* Brand Header */}
      <View style={[styles.brandHeader, { borderBottomColor: colors.sidebarBorder || '#1E293B' }]}>
        <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
          <Text style={{ fontSize: 18, color: '#FFFFFF', fontWeight: '800' }}>360</Text>
        </View>
        {!isCollapsed && (
          <View style={styles.brandTextContainer}>
            <Text style={[styles.brandTitle, { color: '#FFFFFF' }]}>LAX360</Text>
            <Text style={[styles.brandSubtitle, { color: colors.sidebarText || '#94A3B8' }]}>
              Textile POS & ERP
            </Text>
          </View>
        )}
      </View>

      {/* Navigation Links */}
      <ScrollView style={styles.navScroll} contentContainerStyle={styles.navContent}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeRoute === item.id;
          const isHighlight = item.highlight;

          let btnBg = 'transparent';
          let textColor = colors.sidebarText || '#94A3B8';
          let iconBg = 'transparent';

          if (isActive) {
            btnBg = colors.sidebarActive || colors.primary;
            textColor = '#FFFFFF';
          } else if (isHighlight) {
            btnBg = 'rgba(79, 70, 229, 0.15)';
            textColor = '#818CF8';
          }

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navBtn,
                { backgroundColor: btnBg },
                isCollapsed && styles.navBtnCollapsed
              ]}
              onPress={() => onNavigate(item.id)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              {!isCollapsed && (
                <View style={styles.navLabelContainer}>
                  <Text style={[styles.navLabel, { color: textColor }]}>{item.name}</Text>
                  {item.id === 'pos' && cartItems.length > 0 && (
                    <View style={[styles.cartBadge, { backgroundColor: colors.accent || '#F59E0B' }]}>
                      <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                    </View>
                  )}
                  {item.hotkey ? (
                    <Text style={[styles.hotkeyTag, { color: colors.sidebarText }]}>
                      {item.hotkey}
                    </Text>
                  ) : null}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Collapse Toggle Footer */}
      <View style={[styles.footer, { borderTopColor: colors.sidebarBorder || '#1E293B' }]}>
        <TouchableOpacity
          onPress={onToggleCollapse}
          style={styles.collapseBtn}
          activeOpacity={0.7}
        >
          <Text style={{ color: colors.sidebarText || '#94A3B8', fontSize: 13, fontWeight: '600' }}>
            {isCollapsed ? '➡' : '⬅ Collapse Sidebar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 20
  },
  brandHeader: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  brandTextContainer: {
    flex: 1
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500'
  },
  navScroll: {
    flex: 1
  },
  navContent: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 4
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12
  },
  navBtnCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0
  },
  navLabelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '600'
  },
  cartBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  cartBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800'
  },
  hotkeyTag: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.7
  },
  footer: {
    padding: 12,
    borderTopWidth: 1
  },
  collapseBtn: {
    alignItems: 'center',
    paddingVertical: 8
  }
});
