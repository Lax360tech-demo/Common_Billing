import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { THEME_CATEGORIES } from '../styles/themes';

export const SettingsScreen = () => {
  const { themes, currentThemeId, activeTheme, saveTheme, previewTheme, mode, toggleMode } = useTheme();
  const { settings, updateSettings, resetDemoData, showToast } = useSettings();
  const colors = activeTheme.colors;

  const [activeTab, setActiveTab] = useState('appearance');
  const [themeCategory, setThemeCategory] = useState('all');

  // Form States
  const [storeForm, setStoreForm] = useState(settings?.store || {});
  const [billingForm, setBillingForm] = useState(settings?.billing || {});

  const filteredThemes = themes.filter(
    (t) => themeCategory === 'all' || t.category === themeCategory
  );

  const handleSaveStore = async () => {
    try {
      await updateSettings({
        store: storeForm,
        billing: billingForm,
        appearance: { theme: currentThemeId, mode }
      });
    } catch (e) {
      // handled
    }
  };

  const handleResetData = async () => {
    try {
      await resetDemoData();
    } catch (e) {
      // handled
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgMain || '#F8FAFC' }]} contentContainerStyle={styles.content}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.textMain }]}>Showroom & POS Settings</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Configure store profile, thermal print formats, billing rules & select from 23 themes
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSaveStore}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>💾 Save Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Navigation Tabs */}
      <View style={[styles.tabsBar, { borderBottomColor: colors.border }]}>
        {[
          { id: 'appearance', label: '🎨 Appearance & Themes (23)' },
          { id: 'store', label: '🏪 Store Profile' },
          { id: 'billing', label: '🧾 Billing & Invoicing' },
          { id: 'demo', label: '⚡ Demo Data Management' }
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.tabBtn,
              activeTab === t.id && [styles.activeTabBtn, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => setActiveTab(t.id)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === t.id ? colors.primary : colors.textMuted }
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 1. APPEARANCE & THEMES (23) TAB */}
      {activeTab === 'appearance' && (
        <View style={styles.tabContent}>
          {/* Mode Switcher */}
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textMain }]}>Interface Mode</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                Currently in <Text style={{ fontWeight: '700', textTransform: 'capitalize' }}>{mode}</Text> mode
              </Text>
            </View>

            <TouchableOpacity
              onPress={toggleMode}
              style={[styles.modeToggleBtn, { backgroundColor: colors.bgMain, borderColor: colors.border }]}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>
                {mode === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Theme Categories Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {THEME_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catBtn,
                  {
                    backgroundColor:
                      themeCategory === cat.id ? colors.primary : colors.bgCard,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setThemeCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.catBtnText,
                    { color: themeCategory === cat.id ? '#FFFFFF' : colors.textMain }
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 23 Themes Grid */}
          <View style={styles.themesGrid}>
            {filteredThemes.map((thm) => {
              const isCurrent = currentThemeId === thm.id;
              const thmColors = mode === 'dark' && thm.dark ? thm.dark : thm.colors;

              return (
                <TouchableOpacity
                  key={thm.id}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: thmColors.bgCard || '#FFFFFF',
                      borderColor: isCurrent ? colors.primary : colors.border,
                      borderWidth: isCurrent ? 2 : 1
                    }
                  ]}
                  onPress={() => saveTheme(thm.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.themeCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.themeCardName, { color: thmColors.textMain }]}>
                        {thm.name}
                      </Text>
                      {thm.subtitle && (
                        <Text style={{ fontSize: 10, color: thmColors.textMuted }}>{thm.subtitle}</Text>
                      )}
                    </View>
                    {isCurrent && (
                      <View style={[styles.activePill, { backgroundColor: colors.primary }]}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF' }}>ACTIVE</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.themeCardDesc, { color: thmColors.textMuted }]} numberOfLines={2}>
                    {thm.description}
                  </Text>

                  {/* Swatches Bar */}
                  <View style={styles.swatchesRow}>
                    <View style={[styles.swatchItem, { backgroundColor: thmColors.primary }]} />
                    <View style={[styles.swatchItem, { backgroundColor: thmColors.accent || thmColors.primaryHover }]} />
                    <View style={[styles.swatchItem, { backgroundColor: thmColors.bgSidebar || '#0F172A' }]} />
                    <View style={[styles.swatchItem, { backgroundColor: thmColors.bgMain || '#F8FAFC' }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 2. STORE PROFILE TAB */}
      {activeTab === 'store' && (
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textMain }]}>Store Information & Legal Profile</Text>

          <View style={styles.formGrid}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMain }]}>Showroom Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                value={storeForm.storeName}
                onChangeText={(v) => setStoreForm((p) => ({ ...p, storeName: v }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMain }]}>Tagline / Banner</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                value={storeForm.tagline}
                onChangeText={(v) => setStoreForm((p) => ({ ...p, tagline: v }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMain }]}>Street Address</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                value={storeForm.address}
                onChangeText={(v) => setStoreForm((p) => ({ ...p, address: v }))}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>City</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={storeForm.city}
                  onChangeText={(v) => setStoreForm((p) => ({ ...p, city: v }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>State</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={storeForm.state}
                  onChangeText={(v) => setStoreForm((p) => ({ ...p, state: v }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Pincode</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={storeForm.pincode}
                  onChangeText={(v) => setStoreForm((p) => ({ ...p, pincode: v }))}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Phone</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={storeForm.phone}
                  onChangeText={(v) => setStoreForm((p) => ({ ...p, phone: v }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>GSTIN</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={storeForm.gstin}
                  onChangeText={(v) => setStoreForm((p) => ({ ...p, gstin: v }))}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 3. BILLING & INVOICE TEMPLATE TAB */}
      {activeTab === 'billing' && (
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textMain }]}>Billing & POS Configuration</Text>

          <View style={styles.formGrid}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Invoice Prefix</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={billingForm.invoicePrefix}
                  onChangeText={(v) => setBillingForm((p) => ({ ...p, invoicePrefix: v }))}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Next Sequence</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={String(billingForm.nextSequence || 1001)}
                  onChangeText={(v) => setBillingForm((p) => ({ ...p, nextSequence: Number(v) || 1001 }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Default Paper Size</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['80mm', 'A4', '58mm'].map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.toggleBtn,
                        {
                          backgroundColor: billingForm.defaultPaperSize === size ? colors.primary : colors.bgMain,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setBillingForm((p) => ({ ...p, defaultPaperSize: size }))}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: billingForm.defaultPaperSize === size ? '#FFFFFF' : colors.textMain }}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Pricing Mode</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['inclusive', 'exclusive'].map((modeOpt) => (
                    <TouchableOpacity
                      key={modeOpt}
                      style={[
                        styles.toggleBtn,
                        {
                          backgroundColor: billingForm.pricingMode === modeOpt ? colors.primary : colors.bgMain,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setBillingForm((p) => ({ ...p, pricingMode: modeOpt }))}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: billingForm.pricingMode === modeOpt ? '#FFFFFF' : colors.textMain, textTransform: 'capitalize' }}>
                        {modeOpt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMain }]}>Invoice Terms and Conditions</Text>
              <TextInput
                style={[styles.textArea, { borderColor: colors.border, color: colors.textMain }]}
                value={billingForm.termsAndConditions}
                onChangeText={(v) => setBillingForm((p) => ({ ...p, termsAndConditions: v }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>
      )}

      {/* 4. DEMO DATA TAB */}
      {activeTab === 'demo' && (
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textMain }]}>Factory Demo Data Reset</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginVertical: 8 }}>
            Restore the catalog with the full set of 40 pre-seeded authentic Indian textile products (Sarees, Silk Dhotis, Kurtas, Shirting, Linens) and default showroom configuration.
          </Text>

          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: '#DC2626' }]}
            onPress={handleResetData}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
              ⚡ Reset Catalog to 40 Factory Demo Products
            </Text>
          </TouchableOpacity>
        </View>
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
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  tabsBar: { flexDirection: 'row', borderBottomWidth: 1, gap: 16 },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 4 },
  activeTabBtn: { borderBottomWidth: 2 },
  tabText: { fontSize: 13, fontWeight: '700' },
  tabContent: { gap: 16 },
  card: { padding: 20, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  modeToggleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  catScroll: { flexDirection: 'row' },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  catBtnText: { fontSize: 12, fontWeight: '600' },
  themesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  themeCard: { width: '31%', minWidth: 220, padding: 14, borderRadius: 12 },
  themeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  themeCardName: { fontSize: 13, fontWeight: '800' },
  themeCardDesc: { fontSize: 11, marginVertical: 6 },
  activePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  swatchesRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  swatchItem: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#CBD5E1' },
  formGrid: { marginTop: 14, gap: 12 },
  inputGroup: { marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13 },
  textArea: { height: 72, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 12, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  toggleBtn: { flex: 1, height: 38, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resetBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, alignSelf: 'flex-start', marginTop: 10 }
});
