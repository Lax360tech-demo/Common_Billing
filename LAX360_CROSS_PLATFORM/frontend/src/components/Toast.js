import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useSettings();

  if (!toasts || toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => {
        let bg = '#1E293B';
        let textCol = '#FFFFFF';
        if (toast.type === 'success') bg = '#059669';
        if (toast.type === 'error') bg = '#DC2626';
        if (toast.type === 'warning') bg = '#D97706';

        return (
          <TouchableOpacity
            key={toast.id}
            style={[styles.toast, { backgroundColor: bg }]}
            onPress={() => removeToast(toast.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.text, { color: textCol }]}>{toast.message}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 9999,
    maxWidth: 360,
    gap: 8
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6
  },
  text: {
    fontSize: 14,
    fontWeight: '600'
  }
});
