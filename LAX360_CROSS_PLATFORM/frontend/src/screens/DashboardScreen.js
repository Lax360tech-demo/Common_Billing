import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';

export const DashboardScreen = ({ onNavigate }) => {
  const { activeTheme } = useTheme();
  const { settings } = useSettings();
  const colors = activeTheme.colors;

  const [metrics, setMetrics] = useState({
    todaySales: 0.0,
    todayInvoiceCount: 0,
    avgBillValue: 0.0,
    cashCollection: 0.0,
    upiCollection: 0.0,
    cardCollection: 0.0,
    salesTrend: [],
    paymentBreakdown: [],
    topSellingProducts: [],
    recentInvoices: []
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardMetrics();
      if (data) setMetrics(data);
    } catch (e) {
      console.warn('Dashboard metrics fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgMain || '#F8FAFC' }]} contentContainerStyle={styles.content}>
      {/* Top Banner & Quick Action */}
      <View style={[styles.banner, { backgroundColor: colors.bgCard || '#FFFFFF', borderColor: colors.border }]}>
        <View>
          <Text style={[styles.storeTitle, { color: colors.textMain }]}>Store Overview</Text>
          <Text style={[styles.storeDetails, { color: colors.textMuted }]}>
            Terminal: {settings?.billing?.cashierName || 'Cashier 01'} • Pricing Mode:{' '}
            <Text style={{ fontWeight: '700', color: colors.primary }}>
              {settings?.billing?.pricingMode || 'inclusive'}
            </Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.posBtn, { backgroundColor: colors.primary }]}
          onPress={() => onNavigate('pos')}
          activeOpacity={0.8}
        >
          <Text style={styles.posBtnText}>⚡ New Billing (F2)</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.kpiTitle, { color: colors.textMuted }]}>Today's Net Sales</Text>
          <Text style={[styles.kpiValue, { color: colors.primary }]}>₹{metrics.todaySales}</Text>
          <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Net collected today</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.kpiTitle, { color: colors.textMuted }]}>Transactions</Text>
          <Text style={[styles.kpiValue, { color: colors.textMain }]}>{metrics.todayInvoiceCount}</Text>
          <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Completed bills today</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.kpiTitle, { color: colors.textMuted }]}>Avg Bill Value</Text>
          <Text style={[styles.kpiValue, { color: colors.accent || '#F59E0B' }]}>
            ₹{metrics.avgBillValue}
          </Text>
          <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Per customer basket</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.kpiTitle, { color: colors.textMuted }]}>Cash in Drawer</Text>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>₹{metrics.cashCollection}</Text>
          <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Liquid cash collected</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.kpiTitle, { color: colors.textMuted }]}>UPI / QR Sales</Text>
          <Text style={[styles.kpiValue, { color: '#6366F1' }]}>₹{metrics.upiCollection}</Text>
          <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Soundbox & digital</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.kpiTitle, { color: colors.textMuted }]}>Card Swipes</Text>
          <Text style={[styles.kpiValue, { color: '#38BDF8' }]}>₹{metrics.cardCollection}</Text>
          <Text style={[styles.kpiSub, { color: colors.textMuted }]}>POS tap & chip</Text>
        </View>
      </View>

      {/* Charts & Analytics Section */}
      <View style={styles.analyticsRow}>
        {/* 7-Day Trend */}
        <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.border, flex: 2 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>7-Day Sales Trend</Text>
          <View style={styles.trendBarsContainer}>
            {metrics.salesTrend?.map((item, idx) => {
              const maxSale = Math.max(...metrics.salesTrend.map((t) => t.sales), 100);
              const heightPct = Math.max(10, Math.round((item.sales / maxSale) * 100));

              return (
                <View key={idx} style={styles.barCol}>
                  <Text style={[styles.barAmt, { color: colors.textMuted }]}>
                    {item.sales > 0 ? `₹${item.sales}` : ''}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPct}%`, backgroundColor: colors.primary }
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDate, { color: colors.textMuted }]}>{item.date}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Payment Modes */}
        <View style={[styles.chartCard, { backgroundColor: colors.bgCard, borderColor: colors.border, flex: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Tender Breakdown</Text>
          <View style={styles.tenderList}>
            {metrics.paymentBreakdown?.map((p, idx) => (
              <View key={idx} style={styles.tenderItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.tenderDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.tenderName, { color: colors.textMain }]}>{p.name}</Text>
                </View>
                <Text style={[styles.tenderValue, { color: colors.textMain }]}>₹{p.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Top Products & Recent Invoices Tables */}
      <View style={styles.tablesRow}>
        {/* Top Selling Products */}
        <View style={[styles.tableCard, { backgroundColor: colors.bgCard, borderColor: colors.border, flex: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Top Selling Apparel</Text>
          {metrics.topSellingProducts?.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No items billed yet today.
            </Text>
          ) : (
            metrics.topSellingProducts.map((p, idx) => (
              <View key={idx} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prodName, { color: colors.textMain }]}>{p.name}</Text>
                  <Text style={[styles.prodFabric, { color: colors.textMuted }]}>{p.fabric}</Text>
                </View>
                <Text style={[styles.prodQty, { color: colors.textMain }]}>{p.quantity} pcs</Text>
                <Text style={[styles.prodRev, { color: colors.primary }]}>₹{p.sales}</Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Invoices */}
        <View style={[styles.tableCard, { backgroundColor: colors.bgCard, borderColor: colors.border, flex: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Recent Invoices</Text>
          {metrics.recentInvoices?.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No invoices generated yet today.
            </Text>
          ) : (
            metrics.recentInvoices.map((inv, idx) => (
              <View key={idx} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.invNum, { color: colors.textMain }]}>{inv.invoiceNumber}</Text>
                  <Text style={[styles.invCust, { color: colors.textMuted }]}>
                    {inv.customer?.name || 'Walk-in'}
                  </Text>
                </View>
                <Text style={[styles.invPay, { color: colors.textMuted }]}>
                  {inv.payment?.method}
                </Text>
                <Text style={[styles.invTotal, { color: colors.primary }]}>
                  ₹{inv.summary?.netPayable}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 20 },
  banner: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  storeTitle: { fontSize: 20, fontWeight: '800' },
  storeDetails: { fontSize: 13, marginTop: 4 },
  posBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  posBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1
  },
  kpiTitle: { fontSize: 12, fontWeight: '600' },
  kpiValue: { fontSize: 24, fontWeight: '800', marginVertical: 6 },
  kpiSub: { fontSize: 11 },
  analyticsRow: {
    flexDirection: 'row',
    gap: 16
  },
  chartCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  trendBarsContainer: {
    height: 180,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 20
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end'
  },
  barAmt: { fontSize: 10, marginBottom: 4 },
  barTrack: {
    width: 24,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },
  barFill: {
    width: '100%',
    borderRadius: 6
  },
  barDate: { fontSize: 11, marginTop: 6, fontWeight: '600' },
  tenderList: { gap: 14 },
  tenderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tenderDot: { width: 10, height: 10, borderRadius: 5 },
  tenderName: { fontSize: 14, fontWeight: '600' },
  tenderValue: { fontSize: 15, fontWeight: '700' },
  tablesRow: { flexDirection: 'row', gap: 16 },
  tableCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  emptyText: { fontSize: 13, fontStyle: 'italic', paddingVertical: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  prodName: { fontSize: 13, fontWeight: '600' },
  prodFabric: { fontSize: 11 },
  prodQty: { fontSize: 12, fontWeight: '600', marginHorizontal: 12 },
  prodRev: { fontSize: 13, fontWeight: '700' },
  invNum: { fontSize: 13, fontWeight: '700' },
  invCust: { fontSize: 11 },
  invPay: { fontSize: 12, marginHorizontal: 12 },
  invTotal: { fontSize: 14, fontWeight: '800' }
});
