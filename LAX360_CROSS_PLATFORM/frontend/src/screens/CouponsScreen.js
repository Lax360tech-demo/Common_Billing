import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';

export const CouponsScreen = () => {
  const { activeTheme } = useTheme();
  const { showToast } = useSettings();
  const colors = activeTheme.colors;

  const [activeTab, setActiveTab] = useState('coupons');
  const [coupons, setCoupons] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isFestivalModalOpen, setIsFestivalModalOpen] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percent',
    discount_value: '10',
    min_purchase: '1000',
    max_discount: '500',
    expiry_date: '2026-12-31'
  });

  const [festivalForm, setFestivalForm] = useState({
    festival_name: '',
    description: '',
    discount_type: 'percent',
    discount_value: '15',
    min_bill_amount: '2000',
    max_discount: '1000',
    start_date: '2026-10-01',
    end_date: '2026-11-30'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cpns, fests] = await Promise.all([api.getCoupons(), api.getFestivalOffers()]);
      if (Array.isArray(cpns)) setCoupons(cpns);
      if (Array.isArray(fests)) setFestivals(fests);
    } catch (e) {
      console.warn('Failed to load coupons/offers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCoupon = async () => {
    if (!couponForm.code || !couponForm.discount_value) {
      showToast('Coupon code and discount value are required.', 'error');
      return;
    }
    try {
      await api.createCoupon({
        code: couponForm.code.toUpperCase().trim(),
        name: couponForm.name || `Coupon ${couponForm.code.toUpperCase()}`,
        description: couponForm.description,
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value),
        min_purchase: Number(couponForm.min_purchase) || 0,
        max_discount: Number(couponForm.max_discount) || 0,
        expiry_date: couponForm.expiry_date
      });
      showToast(`Coupon ${couponForm.code.toUpperCase()} created.`, 'success');
      setIsCouponModalOpen(false);
      loadData();
    } catch (e) {
      showToast(e.message || 'Error creating coupon', 'error');
    }
  };

  const handleSaveFestival = async () => {
    if (!festivalForm.festival_name || !festivalForm.discount_value) {
      showToast('Festival name and discount value are required.', 'error');
      return;
    }
    try {
      await api.createFestivalOffer({
        festival_name: festivalForm.festival_name,
        description: festivalForm.description,
        discount_type: festivalForm.discount_type,
        discount_value: Number(festivalForm.discount_value),
        min_bill_amount: Number(festivalForm.min_bill_amount) || 0,
        max_discount: Number(festivalForm.max_discount) || 0,
        start_date: festivalForm.start_date,
        end_date: festivalForm.end_date
      });
      showToast(`Festival offer '${festivalForm.festival_name}' created.`, 'success');
      setIsFestivalModalOpen(false);
      loadData();
    } catch (e) {
      showToast(e.message || 'Error creating festival offer', 'error');
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await api.deleteCoupon(id);
      showToast('Coupon deleted.', 'info');
      loadData();
    } catch (e) {
      showToast(e.message || 'Error deleting coupon', 'error');
    }
  };

  const handleDeleteFestival = async (id) => {
    try {
      await api.deleteFestivalOffer(id);
      showToast('Festival offer deleted.', 'info');
      loadData();
    } catch (e) {
      showToast(e.message || 'Error deleting offer', 'error');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgMain || '#F8FAFC' }]} contentContainerStyle={styles.content}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.textMain }]}>Coupons & Promotional Offers</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Create promotional discount codes and active seasonal festival campaigns
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => (activeTab === 'coupons' ? setIsCouponModalOpen(true) : setIsFestivalModalOpen(true))}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
            + {activeTab === 'coupons' ? 'Create Coupon' : 'Create Festival Offer'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'coupons' && [styles.activeTabBtn, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('coupons')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'coupons' ? colors.primary : colors.textMuted }
            ]}
          >
            🎟️ Store Coupons ({coupons.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === 'festivals' && [styles.activeTabBtn, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('festivals')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'festivals' ? colors.primary : colors.textMuted }
            ]}
          >
            🎉 Festival Offers ({festivals.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Grid */}
      {loading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : activeTab === 'coupons' ? (
        <View style={styles.grid}>
          {coupons.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No coupons created yet. Click 'Create Coupon' to add your first promotion.
            </Text>
          ) : (
            coupons.map((c) => (
              <View key={c.id} style={[styles.couponCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.codeBadge, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Text style={styles.codeText}>{c.code}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteCoupon(c.id)}>
                    <Text style={{ color: '#EF4444', fontSize: 13 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.cardTitle, { color: colors.textMain }]}>{c.name}</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{c.description}</Text>

                <View style={[styles.detailBox, { backgroundColor: colors.bgMain, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 12, color: colors.textMain, fontWeight: '700' }}>
                    Discount: {c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Min Bill: ₹{c.min_purchase} • Max Cap: ₹{c.max_discount || 'None'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Valid until: {c.expiry_date} • Used: {c.times_used || 0} times
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={styles.grid}>
          {festivals.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No festival offers active. Click 'Create Festival Offer' to schedule a campaign.
            </Text>
          ) : (
            festivals.map((f) => (
              <View key={f.id} style={[styles.couponCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.codeBadge, { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' }]}>
                    <Text style={[styles.codeText, { color: '#6D28D9' }]}>{f.festival_name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteFestival(f.id)}>
                    <Text style={{ color: '#EF4444', fontSize: 13 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.cardDesc, { color: colors.textMuted, marginTop: 6 }]}>
                  {f.description}
                </Text>

                <View style={[styles.detailBox, { backgroundColor: colors.bgMain, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 12, color: colors.textMain, fontWeight: '700' }}>
                    Campaign Discount: {f.discount_type === 'percent' ? `${f.discount_value}%` : `₹${f.discount_value}`}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Min Bill: ₹{f.min_bill_amount} • Max Cap: ₹{f.max_discount || 'None'}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    Period: {f.start_date} to {f.end_date}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Create Coupon Modal */}
      <Modal visible={isCouponModalOpen} transparent animationType="fade" onRequestClose={() => setIsCouponModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgCard || '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.textMain }]}>Create Promotional Coupon</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Coupon Code *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={couponForm.code}
                  onChangeText={(v) => setCouponForm((p) => ({ ...p, code: v }))}
                  placeholder="e.g. SILK15"
                  autoCapitalize="characters"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Discount Type</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['percent', 'fixed'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.toggleBtn,
                        {
                          backgroundColor: couponForm.discount_type === t ? colors.primary : colors.bgMain,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setCouponForm((p) => ({ ...p, discount_type: t }))}
                    >
                      <Text style={{ color: couponForm.discount_type === t ? '#FFFFFF' : colors.textMain, fontSize: 11, fontWeight: '700' }}>
                        {t === 'percent' ? 'Percentage (%)' : 'Fixed (₹)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Discount Value *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={couponForm.discount_value}
                  onChangeText={(v) => setCouponForm((p) => ({ ...p, discount_value: v }))}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Min Purchase (₹)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={couponForm.min_purchase}
                  onChangeText={(v) => setCouponForm((p) => ({ ...p, min_purchase: v }))}
                  keyboardType="numeric"
                  placeholder="1000"
                />
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={() => setIsCouponModalOpen(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ fontWeight: '600', color: colors.textMain }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveCoupon} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Coupon</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Festival Modal */}
      <Modal visible={isFestivalModalOpen} transparent animationType="fade" onRequestClose={() => setIsFestivalModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgCard || '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.textMain }]}>Create Festival Campaign</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMain }]}>Festival Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                value={festivalForm.festival_name}
                onChangeText={(v) => setFestivalForm((p) => ({ ...p, festival_name: v }))}
                placeholder="e.g. Deepavali Silk Carnival"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Discount Value (%) *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={festivalForm.discount_value}
                  onChangeText={(v) => setFestivalForm((p) => ({ ...p, discount_value: v }))}
                  keyboardType="numeric"
                  placeholder="15"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Min Bill Amount (₹)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={festivalForm.min_bill_amount}
                  onChangeText={(v) => setFestivalForm((p) => ({ ...p, min_bill_amount: v }))}
                  keyboardType="numeric"
                  placeholder="2000"
                />
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={() => setIsFestivalModalOpen(false)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={{ fontWeight: '600', color: colors.textMain }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveFestival} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Festival Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, gap: 16 },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 4 },
  activeTabBtn: { borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  couponCard: { width: '48%', minWidth: 260, padding: 16, borderRadius: 14, borderWidth: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  codeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  codeText: { fontSize: 14, fontWeight: '900', color: '#B45309' },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  cardDesc: { fontSize: 12, marginVertical: 4 },
  detailBox: { padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 8, gap: 4 },
  emptyText: { fontStyle: 'italic', paddingVertical: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 520, padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13 },
  row: { flexDirection: 'row', gap: 12 },
  toggleBtn: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }
});
