import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

export const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { activeTheme, mode, toggleMode } = useTheme();
  const { settings } = useSettings();
  const colors = activeTheme.colors;
  const [appVersion, setAppVersion] = useState('1.0.1');

  useEffect(() => {
    if (window.electronUpdater?.getAppVersion) {
      window.electronUpdater.getAppVersion()
        .then((ver) => {
          if (ver) setAppVersion(ver);
        })
        .catch(() => {});
    }
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgCard || '#FFFFFF',
          borderBottomColor: colors.border || '#E2E8F0'
        }
      ]}
    >
      <View style={styles.left}>
        {onToggleSidebar && (
          <TouchableOpacity onPress={onToggleSidebar} style={styles.menuBtn}>
            <Text style={{ fontSize: 20, color: colors.textMain }}>☰</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={[styles.storeTitle, { color: colors.textMain }]}>
            {settings?.store?.storeName || 'Lady Avenue Showroom'}
          </Text>
          <Text style={[styles.storeSubtitle, { color: colors.textMuted }]}>
            {settings?.store?.city || 'Salem'}, {settings?.store?.state || 'Tamil Nadu'} • GSTIN: {settings?.store?.gstin || '33AABCS8899K1ZM'}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {/* Version Badge */}
        <View style={[styles.versionBadge, { borderColor: colors.border, backgroundColor: colors.bgMain }]}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            v{appVersion}
          </Text>
        </View>

        {/* Active Theme Badge */}
        <View style={[styles.themeBadge, { borderColor: colors.border, backgroundColor: colors.bgMain }]}>
          <View style={[styles.colorDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.themeText, { color: colors.textMuted }]}>
            {activeTheme.name}
          </Text>
        </View>

        {/* Mode Toggle Button */}
        <TouchableOpacity
          onPress={toggleMode}
          style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.bgMain }]}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 16 }}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>

        {/* Cashier Badge */}
        <View style={[styles.cashierBadge, { backgroundColor: colors.primaryLight || '#EEF2FF' }]}>
          <Text style={[styles.cashierText, { color: colors.primary }]}>
            👤 {settings?.billing?.cashierName || user?.name || 'Cashier 01'}
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={logout}
          style={[styles.logoutBtn, { borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoutText, { color: '#EF4444' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  menuBtn: {
    padding: 6,
    borderRadius: 6
  },
  storeTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  storeSubtitle: {
    fontSize: 12,
    fontWeight: '500'
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  themeText: {
    fontSize: 11,
    fontWeight: '600'
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cashierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  cashierText: {
    fontSize: 12,
    fontWeight: '700'
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600'
  },
  versionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700'
  }
});
