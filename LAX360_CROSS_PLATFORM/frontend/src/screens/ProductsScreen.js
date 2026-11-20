import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';

export const ProductsScreen = () => {
  const { activeTheme } = useTheme();
  const { showToast } = useSettings();
  const colors = activeTheme.colors;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Sarees',
    fabric: 'Kanchipuram Silk',
    brand: 'Lady Avenue',
    hsn: '5007',
    price: '',
    mrp: '',
    gstRate: '5',
    description: '',
    variants: [{ size: 'Free Size', color: 'Gold', hex: '#D4AF37', sku: '', barcode: '', price: '', mrp: '' }]
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts({ search, category: selectedCat });
      if (Array.isArray(data)) setProducts(data);
    } catch (e) {
      console.warn('Failed to load products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, selectedCat]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category: 'Sarees',
      fabric: 'Kanchipuram Silk',
      brand: 'Lady Avenue',
      hsn: '5007',
      price: '',
      mrp: '',
      gstRate: '5',
      description: '',
      variants: [{ size: 'Free Size', color: 'Gold', hex: '#D4AF37', sku: '', barcode: '', price: '', mrp: '' }]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      fabric: p.fabric || '',
      brand: p.brand || '',
      hsn: p.hsn || '',
      price: String(p.price),
      mrp: String(p.mrp),
      gstRate: String(p.gstRate || 5),
      description: p.description || '',
      variants: p.variants?.length
        ? p.variants.map((v) => ({ ...v, price: String(v.price || ''), mrp: String(v.mrp || '') }))
        : [{ size: 'Free Size', color: 'Standard', hex: '#000000', sku: '', barcode: '', price: '', mrp: '' }]
    });
    setIsModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { size: 'M', color: 'Classic', hex: '#4F46E5', sku: '', barcode: '', price: prev.price, mrp: prev.mrp }
      ]
    }));
  };

  const handleSaveProduct = async () => {
    if (!form.name || !form.price || !form.mrp) {
      showToast('Please provide name, price, and MRP.', 'error');
      return;
    }

    try {
      const payload = {
        name: form.name,
        category: form.category,
        fabric: form.fabric,
        brand: form.brand,
        hsn: form.hsn,
        price: Number(form.price),
        mrp: Number(form.mrp),
        gstRate: Number(form.gstRate) || 5,
        description: form.description,
        variants: form.variants.map((v, i) => ({
          ...v,
          id: v.id || `v-${Date.now()}-${i}`,
          price: Number(v.price) || Number(form.price),
          mrp: Number(v.mrp) || Number(form.mrp)
        }))
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        showToast('Product updated successfully.', 'success');
      } else {
        await api.createProduct(payload);
        showToast('New product added to catalog.', 'success');
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (e) {
      showToast(e.message || 'Error saving product', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.deleteProduct(id);
      showToast('Product deleted.', 'info');
      loadProducts();
    } catch (e) {
      showToast(e.message || 'Error deleting product', 'error');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgMain || '#F8FAFC' }]} contentContainerStyle={styles.content}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.textMain }]}>Products Catalogue</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Manage textile apparel, sarees, fabrics, barcodes, and sizes ({products.length} products)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenAdd}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>+ Add New Product</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { borderColor: colors.border, color: colors.textMain }]}
          placeholder="Search by product name, fabric, brand, or SKU..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Products Table */}
      <View style={[styles.tableCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border, backgroundColor: colors.bgMain }]}>
          <Text style={[styles.th, { flex: 3, color: colors.textMuted }]}>Product Name</Text>
          <Text style={[styles.th, { flex: 2, color: colors.textMuted }]}>Category & Fabric</Text>
          <Text style={[styles.th, { flex: 1.5, color: colors.textMuted }]}>Brand & HSN</Text>
          <Text style={[styles.th, { flex: 2, color: colors.textMuted }]}>Variants (Sizes/Colors)</Text>
          <Text style={[styles.th, { flex: 1.5, color: colors.textMuted, textAlign: 'right' }]}>Price / MRP</Text>
          <Text style={[styles.th, { flex: 1.5, color: colors.textMuted, textAlign: 'center' }]}>Actions</Text>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : products.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: colors.textMuted, fontStyle: 'italic' }}>
              Your Catalogue is Clean & Empty. Click 'Add New Product' to get started.
            </Text>
          </View>
        ) : (
          products.map((p) => (
            <View key={p.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 3 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMain }}>{p.name}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }} numberOfLines={1}>
                  {p.description}
                </Text>
              </View>

              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMain }}>{p.category}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{p.fabric}</Text>
              </View>

              <View style={{ flex: 1.5 }}>
                <Text style={{ fontSize: 12, color: colors.textMain }}>{p.brand}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>HSN: {p.hsn}</Text>
              </View>

              <View style={{ flex: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {p.variants?.slice(0, 3).map((v) => (
                  <View key={v.id} style={[styles.variantPill, { borderColor: colors.border }]}>
                    <View style={[styles.swatchDot, { backgroundColor: v.hex || '#CBD5E1' }]} />
                    <Text style={{ fontSize: 10, color: colors.textMain, fontWeight: '600' }}>
                      {v.size}
                    </Text>
                  </View>
                ))}
                {p.variants && p.variants.length > 3 && (
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>
                    +{p.variants.length - 3} more
                  </Text>
                )}
              </View>

              <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>₹{p.price}</Text>
                {p.mrp > p.price && (
                  <Text style={{ fontSize: 11, textDecorationLine: 'line-through', color: colors.textMuted }}>
                    ₹{p.mrp}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1.5, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <TouchableOpacity onPress={() => handleOpenEdit(p)} style={styles.actionIconBtn}>
                  <Text style={{ fontSize: 14 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteProduct(p.id)} style={styles.actionIconBtn}>
                  <Text style={{ fontSize: 14 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Add / Edit Product Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalCard, { backgroundColor: colors.bgCard || '#FFFFFF' }]} contentContainerStyle={{ padding: 24, gap: 14 }}>
            <Text style={[styles.modalTitle, { color: colors.textMain }]}>
              {editingProduct ? 'Edit Textile Product' : 'Add New Textile Product'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMain }]}>Product Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="e.g. Coimbatore Pure Cotton Temple Saree"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Category</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={form.category}
                  onChangeText={(v) => setForm((p) => ({ ...p, category: v }))}
                  placeholder="Sarees, Kurtis, etc."
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Fabric</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={form.fabric}
                  onChangeText={(v) => setForm((p) => ({ ...p, fabric: v }))}
                  placeholder="Silk, Cotton, Linen, etc."
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>Selling Price (₹) *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={form.price}
                  onChangeText={(v) => setForm((p) => ({ ...p, price: v }))}
                  keyboardType="numeric"
                  placeholder="1899"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>MRP (₹) *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={form.mrp}
                  onChangeText={(v) => setForm((p) => ({ ...p, mrp: v }))}
                  keyboardType="numeric"
                  placeholder="2499"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMain }]}>GST Rate (%)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain }]}
                  value={form.gstRate}
                  onChangeText={(v) => setForm((p) => ({ ...p, gstRate: v }))}
                  keyboardType="numeric"
                  placeholder="5"
                />
              </View>
            </View>

            {/* Variants Builder */}
            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.label, { color: colors.textMain }]}>Product Variants</Text>
                <TouchableOpacity onPress={handleAddVariantRow}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>+ Add Variant</Text>
                </TouchableOpacity>
              </View>

              {form.variants.map((v, idx) => (
                <View key={idx} style={[styles.variantEditRow, { borderColor: colors.border, backgroundColor: colors.bgMain }]}>
                  <TextInput
                    style={[styles.smallInput, { borderColor: colors.border, color: colors.textMain, flex: 1 }]}
                    placeholder="Size (e.g. M, L)"
                    value={v.size}
                    onChangeText={(val) => {
                      const updated = [...form.variants];
                      updated[idx].size = val;
                      setForm((p) => ({ ...p, variants: updated }));
                    }}
                  />
                  <TextInput
                    style={[styles.smallInput, { borderColor: colors.border, color: colors.textMain, flex: 1.5 }]}
                    placeholder="Color (e.g. Maroon)"
                    value={v.color}
                    onChangeText={(val) => {
                      const updated = [...form.variants];
                      updated[idx].color = val;
                      setForm((p) => ({ ...p, variants: updated }));
                    }}
                  />
                  <TextInput
                    style={[styles.smallInput, { borderColor: colors.border, color: colors.textMain, flex: 1 }]}
                    placeholder="Hex (#800000)"
                    value={v.hex}
                    onChangeText={(val) => {
                      const updated = [...form.variants];
                      updated[idx].hex = val;
                      setForm((p) => ({ ...p, variants: updated }));
                    }}
                  />
                </View>
              ))}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ fontWeight: '600', color: colors.textMain }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProduct}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Product</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  filterBar: { padding: 12, borderRadius: 12, borderWidth: 1 },
  searchInput: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13 },
  tableCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  th: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, alignItems: 'center' },
  variantPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
  swatchDot: { width: 8, height: 8, borderRadius: 4 },
  actionIconBtn: { padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 640, maxHeight: '90%', borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  inputGroup: { marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13 },
  row: { flexDirection: 'row', gap: 12 },
  variantEditRow: { flexDirection: 'row', gap: 8, padding: 8, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  smallInput: { height: 34, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, fontSize: 12 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }
});
