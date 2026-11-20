import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';
import { downloadInvoicePdf } from '../utils/invoiceDownloader';

export const InvoicesScreen = () => {
  const { activeTheme } = useTheme();
  const { settings } = useSettings();
  const { setLastCompletedInvoice, setIsSuccessOpen } = useCart();
  const colors = activeTheme.colors;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [search, setSearch] = useState('');

  const handleDownload = (inv) => {
    downloadInvoicePdf(inv, settings);
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoices(period, search);
      if (Array.isArray(data)) setInvoices(data);
    } catch (e) {
      console.warn('Failed to load invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [period, search]);

  const handleOpenReceipt = (inv) => {
    setLastCompletedInvoice(inv);
    setIsSuccessOpen(true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgMain || '#F8FAFC' }]} contentContainerStyle={styles.content}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.textMain }]}>All Invoices & Receipts</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Search, inspect, and reprint showroom tax invoices
          </Text>
        </View>

        {/* Date Filter Tabs */}
        <View style={styles.periodTabs}>
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: '7 Days' },
            { id: 'month', label: 'Month' },
            { id: 'all', label: 'All Invoices' }
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.periodBtn,
                {
                  backgroundColor: period === t.id ? colors.primary : colors.bgCard || '#FFFFFF',
                  borderColor: colors.border
                }
              ]}
              onPress={() => setPeriod(t.id)}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  { color: period === t.id ? '#FFFFFF' : colors.textMain }
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search Input */}
      <View style={[styles.filterBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { borderColor: colors.border, color: colors.textMain }]}
          placeholder="Search by invoice number (e.g. TEX-2026-1001), customer name, or mobile..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Invoices Table */}
      <View style={[styles.tableCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        {/* Table Header */}
        <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border, backgroundColor: colors.bgMain }]}>
          <Text style={[styles.th, { flex: 2, color: colors.textMuted }]}>Invoice #</Text>
          <Text style={[styles.th, { flex: 2, color: colors.textMuted }]}>Date & Time</Text>
          <Text style={[styles.th, { flex: 2.5, color: colors.textMuted }]}>Customer Name</Text>
          <Text style={[styles.th, { flex: 1.5, color: colors.textMuted, textAlign: 'center' }]}>Items</Text>
          <Text style={[styles.th, { flex: 1.5, color: colors.textMuted, textAlign: 'center' }]}>Method</Text>
          <Text style={[styles.th, { flex: 2, color: colors.textMuted, textAlign: 'right' }]}>Net Amount</Text>
          <Text style={[styles.th, { flex: 2.4, color: colors.textMuted, textAlign: 'center' }]}>Actions</Text>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : invoices.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.textMuted, fontStyle: 'italic' }}>
              No invoices found matching current criteria.
            </Text>
          </View>
        ) : (
          invoices.map((inv) => (
            <View key={inv.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.td, { flex: 2, fontWeight: '700', color: colors.primary }]}>
                {inv.invoiceNumber}
              </Text>
              <Text style={[styles.td, { flex: 2, color: colors.textMuted, fontSize: 11 }]}>
                {inv.date ? new Date(inv.date).toLocaleString() : ''}
              </Text>
              <View style={{ flex: 2.5 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMain }}>
                  {inv.customer?.name || 'Walk-in'}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{inv.customer?.phone}</Text>
              </View>
              <Text style={[styles.td, { flex: 1.5, textAlign: 'center', color: colors.textMain }]}>
                {inv.summary?.totalQuantity || inv.items?.length} pcs
              </Text>
              <View style={{ flex: 1.5, alignItems: 'center' }}>
                <View style={[styles.methodBadge, { backgroundColor: colors.bgMain, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMain }}>
                    {inv.payment?.method || 'Cash'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.td, { flex: 2, textAlign: 'right', fontWeight: '800', color: colors.textMain }]}>
                ₹{inv.summary?.netPayable}
              </Text>
              <View style={{ flex: 2.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {/* 1. Download Button */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => handleDownload(inv)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>📥 Download</Text>
                </TouchableOpacity>

                {/* 2. Separate View Purchase Details Option */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleOpenReceipt(inv)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>👁️ View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '800' },
  pageSubtitle: { fontSize: 13, marginTop: 4 },
  periodTabs: { flexDirection: 'row', gap: 6 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  periodBtnText: { fontSize: 12, fontWeight: '700' },
  filterBar: { padding: 12, borderRadius: 12, borderWidth: 1 },
  searchInput: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13 },
  tableCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  th: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, alignItems: 'center' },
  td: { fontSize: 13 },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' }
});
