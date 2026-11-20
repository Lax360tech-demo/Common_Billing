import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';

export const CustomersScreen = () => {
  const { activeTheme } = useTheme();
  const { showToast } = useSettings();
  const colors = activeTheme.colors;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Register Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Local',
    state: 'Tamil Nadu',
    address: '',
    gstin: '',
    type: 'Retail'
  });

  // Purchase History Modal
  const [historyCust, setHistoryCust] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers(search);
      if (Array.isArray(data)) setCustomers(data);
    } catch (e) {
      console.warn('Failed to load customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleSaveCustomer = async () => {
    if (!form.name || !form.phone) {
      showToast('Name and phone are required.', 'error');
      return;
    }
    try {
      await api.createCustomer(form);
      showToast('Customer registered successfully.', 'success');
      setIsModalOpen(false);
      loadCustomers();
    } catch (e) {
      showToast(e.message || 'Error saving customer', 'error');
    }
  };

  const handleOpenHistory = async (cust) => {
    setHistoryCust(cust);
    setLoadingHistory(true);
    try {
      const data = await api.getCustomerHistory(cust.id || cust.phone);
      setHistoryData(data);
    } catch (e) {
      showToast('Failed to load purchase history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) => typeFilter === 'All' || c.type === typeFilter
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgMain || '#F8FAFC' }]} contentContainerStyle={styles.content}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.textMain }]}>Customer Directory</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Maintain retail shoppers, B2B wholesale buyers, GST details & purchase histories
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setIsModalOpen(true)}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>+ Register Customer</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { borderColor: colors.border, color: colors.textMain }]}
          placeholder="Search by name, mobile, city, or GSTIN..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <View style={styles.typeTabs}>
          {['All', 'Retail', 'B2B / Wholesale'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeBtn,
                {
                  backgroundColor: typeFilter === t ? colors.primary : colors.bgMain,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setTypeFilter(t)}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  { color: typeFilter === t ? '#FFFFFF' : colors.textMain }
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Customers Table */}
      <View style={[styles.tableCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border, backgroundColor: colors.bgMain }]}>
          <Text style={[styles.th, { flex: 2.5, color: colors.textMuted }]}>Customer Name</Text>
          <Text style={[styles.th, { flex: 2, color: colors.textMuted }]}>Contact Details</Text>
          <Text style={[styles.th, { flex: 2, color: colors.textMuted }]}>Location</Text>
          <Text style={[styles.th, { flex: 1.5, color: colors.textMuted }]}>Type / GSTIN</Text>
          <Text style={[styles.th, { flex: 1, color: colors.textMuted, textAlign: 'center' }]}>Bills</Text>
          <Text style={[styles.th, { flex: 1.5, color: colors.textMuted, textAlign: 'right' }]}>Lifetime Spend</Text>
          <Text style={[styles.th, { flex: 1.5, color: colors.textMuted, textAlign: 'center' }]}>Actions</Text>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.textMuted, fontStyle: 'italic' }}>
              No customers found. Click 'Register Customer' to add your first customer.
            </Text>
          </View>
        ) : (
          filteredCustomers.map((c) => (
            <View key={c.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 2.5 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>{c.name}</Text>
                {c.lastPurchaseDate && (
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>
                    Last visit: {new Date(c.lastPurchaseDate).toLocaleDateString()}
                  </Text>
                )}
              </View>

              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMain }}>{c.phone}</Text>
                {c.email ? <Text style={{ fontSize: 11, color: colors.textMuted }}>{c.email}</Text> : null}
              </View>

              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 12, color: colors.textMain }}>{c.city}, {c.state}</Text>
                {c.address ? (
                  <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>{c.address}</Text>
                ) : null}
              </View>

              <View style={{ flex: 1.5 }}>
                <View style={[styles.typeBadge, { backgroundColor: c.type === 'Retail' ? '#ECFDF5' : '#EEF2FF' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: c.type === 'Retail' ? '#059669' : '#4F46E5' }}>
                    {c.type}
                  </Text>
                </View>
                {c.gstin ? (
                  <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{c.gstin}</Text>
                ) : null}
              </View>

              <Text style={[styles.td, { flex: 1, textAlign: 'center', fontWeight: '700', color: colors.textMain }]}>
                {c.totalBills || 0}
              </Text>

              <Text style={[styles.td, { flex: 1.5, textAlign: 'right', fontWeight: '800', color: colors.primary }]}>
                ₹{c.totalPurchases || 0}
              </Text>

              <View style={{ flex: 1.5, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.historyBtn, { borderColor: colors.border }]}
                  onPress={() => handleOpenHistory(c)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMain }}>History ➔</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Register Customer Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgCard || '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.textMain }]}>Register Customer</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMain }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="Customer Name"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Mobile Number *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={form.phone}
                  onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Email Address</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={form.email}
                  onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
                  placeholder="customer@email.com"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>City</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={form.city}
                  onChangeText={(v) => setForm((p) => ({ ...p, city: v }))}
                  placeholder="Salem"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>GSTIN (Optional)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={form.gstin}
                  onChangeText={(v) => setForm((p) => ({ ...p, gstin: v }))}
                  placeholder="GSTIN"
                />
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ fontWeight: '600', color: colors.textMain }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveCustomer} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Customer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Purchase History Modal */}
      {historyCust && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setHistoryCust(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.bgCard || '#FFFFFF' }]}>
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                Purchase History • {historyCust.name}
              </Text>
              <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
                Mobile: {historyCust.phone} • Lifetime Bills: {historyData?.totalBills || 0} • Total Spend: ₹{historyData?.totalSpent || 0}
              </Text>

              {loadingHistory ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 300, marginVertical: 14 }}>
                  {historyData?.invoices?.length === 0 ? (
                    <Text style={{ fontStyle: 'italic', color: colors.textMuted, padding: 10 }}>
                      No bills found for this customer.
                    </Text>
                  ) : (
                    historyData?.invoices?.map((inv) => (
                      <View key={inv.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                        <View>
                          <Text style={{ fontWeight: '700', color: colors.textMain }}>{inv.invoiceNumber}</Text>
                          <Text style={{ fontSize: 11, color: colors.textMuted }}>
                            {new Date(inv.date).toLocaleDateString()} • {inv.payment?.method}
                          </Text>
                        </View>
                        <Text style={{ fontWeight: '800', color: colors.primary, fontSize: 14 }}>
                          ₹{inv.summary?.netPayable}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              )}

              <TouchableOpacity onPress={() => setHistoryCust(null)} style={[styles.cancelBtn, { borderColor: colors.border, alignSelf: 'flex-end' }]}>
                <Text style={{ fontWeight: '600', color: colors.textMain }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '800' },
  pageSubtitle: { fontSize: 13, marginTop: 4 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  filterBar: { padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  searchInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13 },
  typeTabs: { flexDirection: 'row', gap: 6 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  typeBtnText: { fontSize: 12, fontWeight: '700' },
  tableCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  th: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, alignItems: 'center' },
  td: { fontSize: 13 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  historyBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 540, padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13 },
  row: { flexDirection: 'row', gap: 12 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 }
});
