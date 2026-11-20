import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';
import { round2 } from '../utils/calculations';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import QRCode from 'qrcode';

const CATEGORIES = [
  'All',
  'Sarees',
  "Men's Ethnic",
  "Men's Casual",
  "Women's Kurtis",
  'Salwar Sets',
  'Kids Wear',
  'Dhotis & Veshtis',
  'Fabrics & Matching',
  'Home Textiles'
];

export const POSScreen = () => {
  const { activeTheme } = useTheme();
  const { settings, showToast } = useSettings();
  const colors = activeTheme.colors;

  const {
    cartItems,
    customer,
    setCustomer,
    billDiscount,
    setBillDiscount,
    appliedCoupon,
    appliedFestival,
    cartTotals,
    addToCart,
    updateQuantity,
    updateUnitPrice,
    updateItemDiscount,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    completeCheckout,
    isCheckoutOpen,
    setIsCheckoutOpen
  } = useCart();

  // Catalog State
  const [products, setProducts] = useState([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Variant Modal
  const [variantModalProduct, setVariantModalProduct] = useState(null);

  // Customer Select Modal (F4)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customersList, setCustomersList] = useState([]);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Coupon Input State
  const [couponCodeInput, setCouponCodeInput] = useState('');

  // Checkout Payment Form State
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [tenderedAmount, setTenderedAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [splitDetails, setSplitDetails] = useState({ cash: 0, upi: 0, card: 0 });
  const [notes, setNotes] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [upiQrUrl, setUpiQrUrl] = useState('');

  // Generate Real-Time Dynamic UPI QR Code
  useEffect(() => {
    if (isCheckoutOpen && paymentMethod === 'UPI' && cartTotals.netPayable > 0) {
      const upiId = settings?.store?.upiId || `${settings?.store?.phone || '9876543210'}@upi`;
      const storeName = settings?.store?.storeName || 'Textile Showroom';
      const upiPayload = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeName)}&am=${cartTotals.netPayable}&cu=INR&tn=${encodeURIComponent('Bill ' + cartTotals.netPayable)}`;

      QRCode.toDataURL(upiPayload, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      })
        .then((url) => setUpiQrUrl(url))
        .catch((err) => console.warn('QR Code generation failed:', err));
    }
  }, [isCheckoutOpen, paymentMethod, cartTotals.netPayable, settings]);

  // Load Products
  const loadCatalog = async () => {
    try {
      setLoadingProds(true);
      const data = await api.getProducts();
      if (Array.isArray(data)) setProducts(data);
    } catch (e) {
      console.warn('Failed to load products:', e);
    } finally {
      setLoadingProds(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Barcode Scanner Modal (F3)
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Keyboard Shortcuts (F3, F4, F8)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setIsScannerOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cartItems.length > 0) {
          setIsCheckoutOpen(true);
        } else {
          showToast('Cannot checkout with an empty cart.', 'error');
        }
      }
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [cartItems.length, showToast, setIsCheckoutOpen]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const catMatch = selectedCategory === 'All' || p.category === selectedCategory;
      if (!q) return catMatch;
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const fabricMatch = (p.fabric || '').toLowerCase().includes(q);
      const brandMatch = (p.brand || '').toLowerCase().includes(q);
      const variantMatch = (p.variants || []).some(
        (v) => (v.sku || '').toLowerCase().includes(q) || (v.barcode || '').toLowerCase().includes(q)
      );
      return catMatch && (nameMatch || fabricMatch || brandMatch || variantMatch);
    });
  }, [products, selectedCategory, searchQuery]);

  // Product Click Handler
  const handleProductClick = (prod) => {
    if (prod.variants && prod.variants.length > 1) {
      setVariantModalProduct(prod);
    } else if (prod.variants && prod.variants.length === 1) {
      addToCart(prod.variants[0], prod, 1);
    } else {
      addToCart(
        {
          id: `v-${prod.id}`,
          size: 'Standard',
          color: 'Standard',
          hex: '#000000',
          price: prod.price,
          mrp: prod.mrp
        },
        prod,
        1
      );
    }
  };

  // Search Customers for F4 modal
  const handleSearchCustomers = async (query) => {
    setCustomerSearch(query);
    if (!query) {
      setCustomersList([]);
      return;
    }
    try {
      const res = await api.getCustomers(query);
      if (Array.isArray(res)) setCustomersList(res);
    } catch (e) {
      // silent
    }
  };

  // Add Walk-in / New Customer inline
  const handleRegisterInlineCustomer = async () => {
    if (!newCustPhone.trim()) {
      showToast('Please provide a mobile number.', 'error');
      return;
    }
    try {
      const created = await api.createCustomer({
        name: newCustName.trim() || 'Valued Customer',
        phone: newCustPhone.trim(),
        city: 'Local',
        state: 'Tamil Nadu'
      });
      setCustomer(created);
      setIsCustomerModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      showToast(`Customer ${created.name} selected.`, 'success');
    } catch (e) {
      showToast(e.message || 'Error registering customer', 'error');
    }
  };

  // Submit Order
  const handleExecuteCheckout = async () => {
    setProcessingOrder(true);
    try {
      const res = await completeCheckout(
        paymentMethod,
        {
          amountReceived: Number(tenderedAmount) || cartTotals.netPayable,
          reference: paymentRef,
          splitDetails
        },
        notes
      );
      if (res.success) {
        setTenderedAmount('');
        setPaymentRef('');
        setNotes('');
      }
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* LEFT PANE: PRODUCT CATALOG */}
      <View
        style={[
          styles.catalogPane,
          {
            backgroundColor: colors.bgMain || '#F8FAFC',
            borderRightColor: colors.border || '#E2E8F0'
          }
        ]}
      >
        {/* Search & Category Filter Header */}
        <View style={[styles.catalogHeader, { backgroundColor: colors.bgCard || '#FFFFFF' }]}>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.searchInput, { borderColor: colors.border, color: colors.textMain }]}
              placeholder="Search products by name, brand, fabric, or SKU..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              style={[styles.scanBarcodeBtn, { backgroundColor: colors.primary }]}
              onPress={() => setIsScannerOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.scanBarcodeBtnText}>📷 Scan Barcode (F3)</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === cat ? colors.primary : colors.bgMain || '#F1F5F9',
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: selectedCategory === cat ? '#FFFFFF' : colors.textMain }
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product Cards Grid */}
        {loadingProds ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.prodGrid}>
            {filteredProducts.map((prod) => (
              <TouchableOpacity
                key={prod.id}
                style={[
                  styles.prodCard,
                  { backgroundColor: colors.bgCard || '#FFFFFF', borderColor: colors.border }
                ]}
                onPress={() => handleProductClick(prod)}
                activeOpacity={0.7}
              >
                <View style={[styles.cardTag, { backgroundColor: colors.primaryLight || '#EEF2FF' }]}>
                  <Text style={[styles.cardTagText, { color: colors.primary }]}>{prod.fabric || prod.category}</Text>
                </View>

                <Text style={[styles.prodTitle, { color: colors.textMain }]} numberOfLines={2}>
                  {prod.name}
                </Text>

                <Text style={[styles.prodBrand, { color: colors.textMuted }]}>
                  {prod.brand} • GST {prod.gstRate}%
                </Text>

                <View style={styles.priceRow}>
                  <Text style={[styles.sellingPrice, { color: colors.primary }]}>₹{prod.price}</Text>
                  {prod.mrp > prod.price && (
                    <Text style={[styles.mrpPrice, { color: colors.textMuted }]}>₹{prod.mrp}</Text>
                  )}
                </View>

                {prod.variants && prod.variants.length > 1 && (
                  <View style={styles.variantNotice}>
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
                      {prod.variants.length} Variants Available ➔
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* RIGHT PANE: ACTIVE CART & TOTALS */}
      <View style={[styles.cartPane, { backgroundColor: colors.bgCard || '#FFFFFF' }]}>
        {/* Customer Assigned Banner (F4) */}
        <TouchableOpacity
          style={[styles.customerBar, { backgroundColor: colors.bgMain, borderColor: colors.border }]}
          onPress={() => setIsCustomerModalOpen(true)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13 }}>👤</Text>
              <Text style={[styles.customerName, { color: colors.textMain }]}>{customer.name}</Text>
              <Text style={[styles.f4Tag, { color: colors.primary }]}>[F4 Change]</Text>
            </View>
            <Text style={[styles.customerPhone, { color: colors.textMuted }]}>
              {customer.phone} • {customer.city}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Cart Line Items */}
        <ScrollView style={styles.cartItemsScroll} contentContainerStyle={{ padding: 12, gap: 10 }}>
          {cartItems.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <Text style={{ fontSize: 36 }}>🛒</Text>
              <Text style={[styles.emptyCartTitle, { color: colors.textMain }]}>Cart is Empty</Text>
              <Text style={[styles.emptyCartSub, { color: colors.textMuted }]}>
                Click any textile item on the left or scan a barcode to begin billing.
              </Text>
            </View>
          ) : (
            cartItems.map((item) => (
              <View
                key={item.id}
                style={[styles.cartItemRow, { backgroundColor: colors.bgMain, borderColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cartItemName, { color: colors.textMain }]}>{item.name}</Text>
                  <Text style={[styles.cartItemSub, { color: colors.textMuted }]}>
                    Size: {item.size} • Color: {item.color} • GST: {item.gstRate}%
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>Price: ₹</Text>
                    <TextInput
                      style={[styles.priceInput, { borderColor: colors.border, color: colors.textMain }]}
                      value={String(item.unitPrice)}
                      onChangeText={(val) => updateUnitPrice(item.id, val)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Quantity Controls */}
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textMain }}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.qtyNum, { color: colors.textMain }]}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textMain }}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Line Total & Remove */}
                <View style={{ alignItems: 'flex-end', minWidth: 60 }}>
                  <Text style={[styles.lineTotalText, { color: colors.primary }]}>
                    ₹{round2(item.quantity * item.unitPrice)}
                  </Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ marginTop: 6 }}>
                    <Text style={{ color: '#EF4444', fontSize: 13 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Cart Calculation Breakdown & Checkout Controls */}
        <View style={[styles.cartFooter, { borderTopColor: colors.border, backgroundColor: colors.bgCard }]}>
          {/* Coupon Row */}
          <View style={styles.couponRow}>
            {appliedCoupon ? (
              <View style={[styles.appliedCouponBadge, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309' }}>
                  🎟️ {appliedCoupon.code} (-₹{appliedCoupon.discount_amount || appliedCoupon.discount_value})
                </Text>
                <TouchableOpacity onPress={removeCoupon} style={{ marginLeft: 8 }}>
                  <Text style={{ color: '#DC2626', fontWeight: '800' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flex: 1, gap: 6 }}>
                <TextInput
                  style={[styles.couponInput, { borderColor: colors.border, color: colors.textMain }]}
                  placeholder="Coupon Code"
                  placeholderTextColor={colors.textMuted}
                  value={couponCodeInput}
                  onChangeText={setCouponCodeInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.couponBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    applyCoupon(couponCodeInput);
                    setCouponCodeInput('');
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}

            {appliedFestival && (
              <View style={[styles.festBadge, { backgroundColor: '#EDE9FE' }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#6D28D9' }}>
                  🎉 {appliedFestival.festival_name}
                </Text>
              </View>
            )}
          </View>

          {/* Totals Table */}
          <View style={styles.totalsTable}>
            <View style={styles.totalLine}>
              <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
                Gross Subtotal ({cartTotals.totalQuantity} items):
              </Text>
              <Text style={[styles.totalVal, { color: colors.textMain }]}>₹{cartTotals.grossSubtotal}</Text>
            </View>

            {cartTotals.totalDiscount > 0 && (
              <View style={styles.totalLine}>
                <Text style={[styles.totalLabel, { color: '#059669' }]}>Total Discounts:</Text>
                <Text style={[styles.totalVal, { color: '#059669' }]}>-₹{cartTotals.totalDiscount}</Text>
              </View>
            )}

            <View style={styles.totalLine}>
              <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Taxable Amount:</Text>
              <Text style={[styles.totalVal, { color: colors.textMain }]}>₹{cartTotals.taxableSubtotal}</Text>
            </View>

            <View style={styles.totalLine}>
              <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
                GST Total (CGST + SGST):
              </Text>
              <Text style={[styles.totalVal, { color: colors.textMain }]}>₹{cartTotals.totalTax}</Text>
            </View>

            {cartTotals.roundOff !== 0 && (
              <View style={styles.totalLine}>
                <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Round Off:</Text>
                <Text style={[styles.totalVal, { color: colors.textMain }]}>
                  {cartTotals.roundOff > 0 ? `+₹${cartTotals.roundOff}` : `-₹${Math.abs(cartTotals.roundOff)}`}
                </Text>
              </View>
            )}

            <View style={[styles.netLine, { borderTopColor: colors.border }]}>
              <Text style={[styles.netLabel, { color: colors.textMain }]}>NET PAYABLE:</Text>
              <Text style={[styles.netVal, { color: colors.primary }]}>₹{cartTotals.netPayable}</Text>
            </View>
          </View>

          {/* Checkout & Clear Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={clearCart} style={[styles.clearBtn, { borderColor: colors.border }]}>
              <Text style={{ color: '#EF4444', fontWeight: '700' }}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.checkoutBtn,
                {
                  backgroundColor: cartItems.length > 0 ? colors.primary : '#94A3B8'
                }
              ]}
              disabled={cartItems.length === 0}
              onPress={() => setIsCheckoutOpen(true)}
            >
              <Text style={styles.checkoutBtnText}>Checkout (F8) ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* MULTI-VARIANT SELECTION MODAL */}
      {variantModalProduct && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setVariantModalProduct(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: colors.bgCard || '#FFFFFF' }]}>
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                Select Variant • {variantModalProduct.name}
              </Text>
              <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                Choose size and color swatch to add to cart
              </Text>

              <ScrollView style={{ maxHeight: 300, marginVertical: 14 }}>
                {variantModalProduct.variants?.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.variantRow, { borderColor: colors.border, backgroundColor: colors.bgMain }]}
                    onPress={() => {
                      addToCart(v, variantModalProduct, 1);
                      setVariantModalProduct(null);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.colorCircle, { backgroundColor: v.hex || '#000000' }]} />
                      <View>
                        <Text style={[styles.variantSize, { color: colors.textMain }]}>
                          {v.size} • {v.color}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>SKU: {v.sku}</Text>
                      </View>
                    </View>
                    <Text style={[styles.variantPrice, { color: colors.primary }]}>
                      ₹{v.price || variantModalProduct.price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setVariantModalProduct(null)}
                style={[styles.closeModalBtn, { backgroundColor: colors.bgMain }]}
              >
                <Text style={{ color: colors.textMain, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* CUSTOMER SELECTION MODAL (F4) */}
      <Modal visible={isCustomerModalOpen} transparent animationType="fade" onRequestClose={() => setIsCustomerModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.bgCard || '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.textMain }]}>Select / Register Customer</Text>

            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.textMain }]}
              placeholder="Search by customer mobile, name, or GSTIN..."
              placeholderTextColor={colors.textMuted}
              value={customerSearch}
              onChangeText={handleSearchCustomers}
            />

            {/* Quick Set to Walk-in */}
            <TouchableOpacity
              style={[styles.walkinBtn, { borderColor: colors.border }]}
              onPress={() => {
                setCustomer({
                  id: 'walk-in',
                  name: 'Walk-in Customer',
                  phone: '9840000000',
                  city: 'Local',
                  state: 'Tamil Nadu',
                  gstin: '',
                  address: ''
                });
                setIsCustomerModalOpen(false);
              }}
            >
              <Text style={{ fontWeight: '700', color: colors.primary }}>
                🏷️ Set to Walk-in Customer (9840000000)
              </Text>
            </TouchableOpacity>

            {/* Results List */}
            {customersList.length > 0 && (
              <ScrollView style={{ maxHeight: 180, marginVertical: 8 }}>
                {customersList.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.custResultRow, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setCustomer(c);
                      setIsCustomerModalOpen(false);
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: colors.textMain }}>{c.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{c.phone} • {c.city}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Quick Register New Customer */}
            <View style={[styles.newCustBox, { borderColor: colors.border, backgroundColor: colors.bgMain }]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMain, marginBottom: 8 }}>
                Or Register New Customer:
              </Text>
              <TextInput
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textMain, marginBottom: 8 }]}
                placeholder="Full Name"
                value={newCustName}
                onChangeText={setNewCustName}
              />
              <TextInput
                style={[styles.modalInput, { borderColor: colors.border, color: colors.textMain, marginBottom: 8 }]}
                placeholder="Mobile Number"
                value={newCustPhone}
                onChangeText={setNewCustPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[styles.inlineAddBtn, { backgroundColor: colors.primary }]}
                onPress={handleRegisterInlineCustomer}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save & Assign Customer</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setIsCustomerModalOpen(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CHECKOUT MODAL (F8) */}
      <Modal visible={isCheckoutOpen} transparent animationType="fade" onRequestClose={() => setIsCheckoutOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.checkoutModalBox, { backgroundColor: colors.bgCard || '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.textMain }]}>Finalize Payment & Checkout</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Net Payable: <Text style={{ fontWeight: '900', color: colors.primary }}>₹{cartTotals.netPayable}</Text>
            </Text>

            {/* Payment Method Selector Tabs */}
            <View style={styles.paymentTabs}>
              {['Cash', 'UPI', 'Card', 'Split'].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.payTabBtn,
                    {
                      backgroundColor: paymentMethod === m ? colors.primary : colors.bgMain,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setPaymentMethod(m)}
                >
                  <Text
                    style={[
                      styles.payTabBtnText,
                      { color: paymentMethod === m ? '#FFFFFF' : colors.textMain }
                    ]}
                  >
                    {m === 'Cash' ? '💵 Cash' : m === 'UPI' ? '📱 UPI / QR' : m === 'Card' ? '💳 Card' : '⚖️ Split'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Method Specific Form */}
            {paymentMethod === 'Cash' && (
              <View style={styles.payForm}>
                <Text style={[styles.payLabel, { color: colors.textMain }]}>Cash Tendered by Customer (₹)</Text>
                <TextInput
                  style={[styles.payInput, { borderColor: colors.border, color: colors.textMain }]}
                  placeholder={`e.g. ${cartTotals.netPayable}`}
                  value={tenderedAmount}
                  onChangeText={setTenderedAmount}
                  keyboardType="numeric"
                />
                {Number(tenderedAmount) > cartTotals.netPayable && (
                  <View style={styles.changeBanner}>
                    <Text style={{ color: '#059669', fontWeight: '700' }}>
                      Change to Return: ₹{round2(Number(tenderedAmount) - cartTotals.netPayable)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {paymentMethod === 'UPI' && (
              <View style={styles.payForm}>
                <View style={[styles.qrContainer, { backgroundColor: colors.bgMain, borderColor: colors.border }]}>
                  {/* Store Attribution */}
                  <View style={styles.qrHeader}>
                    <Text style={[styles.qrStoreName, { color: colors.textMain }]}>
                      {settings?.store?.storeName || 'Lady Avenue Showroom'}
                    </Text>
                    <Text style={[styles.qrAmount, { color: colors.primary }]}>
                      Scan to Pay: ₹{cartTotals.netPayable}
                    </Text>
                  </View>

                  {/* Real-time Dynamic QR Code */}
                  <View style={styles.qrImageWrapper}>
                    {upiQrUrl ? (
                      <img
                        src={upiQrUrl}
                        alt="UPI QR Code"
                        style={{ width: 170, height: 170, display: 'block', borderRadius: 8 }}
                      />
                    ) : (
                      <View style={{ width: 170, height: 170, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="small" color={colors.primary} />
                      </View>
                    )}
                  </View>

                  {/* Accepted UPI Apps */}
                  <View style={styles.upiBadgesRow}>
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
                      ⚡ Accepted on: GPay • PhonePe • Paytm • BHIM • Any UPI App
                    </Text>
                  </View>

                  <Text style={[styles.upiIdTag, { color: colors.textMuted }]}>
                    UPI ID: {settings?.store?.upiId || `${settings?.store?.phone || '9876543210'}@upi`}
                  </Text>
                </View>

                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.payLabel, { color: colors.textMain }]}>UPI / Soundbox Reference / UTR</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.payInput, { flex: 1, borderColor: colors.border, color: colors.textMain }]}
                      placeholder="Enter 12-digit UTR / Ref / Soundbox code"
                      placeholderTextColor={colors.textMuted}
                      value={paymentRef}
                      onChangeText={setPaymentRef}
                    />
                    <TouchableOpacity
                      onPress={() => setPaymentRef(`UPI${Date.now().toString().slice(-8)}`)}
                      style={[styles.autoRefBtn, { borderColor: colors.border, backgroundColor: colors.bgMain }]}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>⚡ Auto Ref</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {paymentMethod === 'Card' && (
              <View style={styles.payForm}>
                <Text style={[styles.payLabel, { color: colors.textMain }]}>Card Auth / Approval Code</Text>
                <TextInput
                  style={[styles.payInput, { borderColor: colors.border, color: colors.textMain }]}
                  placeholder="Approval code from POS swipe machine"
                  placeholderTextColor={colors.textMuted}
                  value={paymentRef}
                  onChangeText={setPaymentRef}
                />
              </View>
            )}

            {paymentMethod === 'Split' && (
              <View style={styles.payForm}>
                <Text style={[styles.payLabel, { color: colors.textMain }]}>Split Payment Breakdown</Text>
                <View style={styles.splitRow}>
                  <View style={styles.splitCol}>
                    <Text style={[styles.splitColLabel, { color: colors.textMain }]}>💵 Cash (₹)</Text>
                    <TextInput
                      style={[styles.payInput, styles.splitInput, { borderColor: colors.border, color: colors.textMain }]}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={splitDetails.cash ? String(splitDetails.cash) : ''}
                      onChangeText={(v) => setSplitDetails((p) => ({ ...p, cash: Number(v) || 0 }))}
                    />
                  </View>
                  <View style={styles.splitCol}>
                    <Text style={[styles.splitColLabel, { color: colors.textMain }]}>📱 UPI (₹)</Text>
                    <TextInput
                      style={[styles.payInput, styles.splitInput, { borderColor: colors.border, color: colors.textMain }]}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={splitDetails.upi ? String(splitDetails.upi) : ''}
                      onChangeText={(v) => setSplitDetails((p) => ({ ...p, upi: Number(v) || 0 }))}
                    />
                  </View>
                  <View style={styles.splitCol}>
                    <Text style={[styles.splitColLabel, { color: colors.textMain }]}>💳 Card (₹)</Text>
                    <TextInput
                      style={[styles.payInput, styles.splitInput, { borderColor: colors.border, color: colors.textMain }]}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={splitDetails.card ? String(splitDetails.card) : ''}
                      onChangeText={(v) => setSplitDetails((p) => ({ ...p, card: Number(v) || 0 }))}
                    />
                  </View>
                </View>

                {(() => {
                  const totalSplit = round2(
                    (Number(splitDetails.cash) || 0) +
                    (Number(splitDetails.upi) || 0) +
                    (Number(splitDetails.card) || 0)
                  );
                  const diff = round2(cartTotals.netPayable - totalSplit);
                  const isBalanced = Math.abs(diff) < 0.01;
                  return (
                    <View
                      style={[
                        styles.splitSummaryBanner,
                        {
                          backgroundColor: isBalanced ? '#ECFDF5' : '#FEF2F2',
                          borderColor: isBalanced ? '#A7F3D0' : '#FECACA'
                        }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: isBalanced ? '#065F46' : '#991B1B'
                          }}
                        >
                          {isBalanced
                            ? `✅ Split Total Matches: ₹${totalSplit}`
                            : diff > 0
                            ? `⚠️ Balance to Allocate: ₹${diff}`
                            : `⚠️ Allocated exceeds Net by: ₹${Math.abs(diff)}`}
                        </Text>
                      </View>
                      {!isBalanced && diff > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            const curWithoutCard = (Number(splitDetails.cash) || 0) + (Number(splitDetails.upi) || 0);
                            const rem = Math.max(0, round2(cartTotals.netPayable - curWithoutCard));
                            setSplitDetails((p) => ({ ...p, card: rem }));
                          }}
                          style={[styles.autoFillBtn, { backgroundColor: colors.primaryLight || '#EEF2FF' }]}
                        >
                          <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
                            Auto-Fill Card (₹{diff})
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })()}
              </View>
            )}

            <TextInput
              style={[styles.notesInput, { borderColor: colors.border, color: colors.textMain }]}
              placeholder="Invoice Notes (Optional)"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />

            {/* Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setIsCheckoutOpen(false)}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={{ fontWeight: '600', color: colors.textMain }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExecuteCheckout}
                disabled={processingOrder}
                style={[styles.completeOrderBtn, { backgroundColor: colors.primary }]}
              >
                {processingOrder ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
                    Complete Sale & Print
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* REAL-TIME BARCODE SCANNER MODAL */}
      <BarcodeScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeScanned={(variant, product, qty) => {
          addToCart(variant, product, qty);
        }}
        products={products}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  catalogPane: { flex: 3, borderRightWidth: 1 },
  catalogHeader: { padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  scanBarcodeBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  scanBarcodeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  categoryScroll: { flexDirection: 'row' },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  categoryText: { fontSize: 12, fontWeight: '600' },
  prodGrid: { padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  prodCard: {
    width: '31%',
    minWidth: 160,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  cardTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  cardTagText: { fontSize: 10, fontWeight: '700' },
  prodTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  prodBrand: { fontSize: 11, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sellingPrice: { fontSize: 15, fontWeight: '800' },
  mrpPrice: { fontSize: 12, textDecorationLine: 'line-through' },
  variantNotice: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cartPane: { flex: 2, display: 'flex', flexDirection: 'column' },
  customerBar: { padding: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  customerName: { fontSize: 13, fontWeight: '700' },
  f4Tag: { fontSize: 11, fontWeight: '700' },
  customerPhone: { fontSize: 11 },
  cartItemsScroll: { flex: 1 },
  emptyCartBox: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyCartTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyCartSub: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  cartItemRow: { padding: 10, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartItemName: { fontSize: 12, fontWeight: '700' },
  cartItemSub: { fontSize: 10 },
  priceInput: { width: 64, height: 24, borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, fontSize: 11 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { width: 26, height: 26, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 13, fontWeight: '700', minWidth: 16, textAlign: 'center' },
  lineTotalText: { fontSize: 14, fontWeight: '800' },
  cartFooter: { padding: 14, borderTopWidth: 1 },
  couponRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  couponInput: { flex: 1, height: 32, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, fontSize: 12 },
  couponBtn: { paddingHorizontal: 12, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  appliedCouponBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  festBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  totalsTable: { gap: 4 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 12 },
  totalVal: { fontSize: 12, fontWeight: '600' },
  netLine: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 8, marginTop: 4, alignItems: 'center' },
  netLabel: { fontSize: 14, fontWeight: '800' },
  netVal: { fontSize: 20, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  clearBtn: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderRadius: 8, alignItems: 'center' },
  checkoutBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkoutBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox: { width: '100%', maxWidth: 440, padding: 20, borderRadius: 16 },
  checkoutModalBox: { width: '100%', maxWidth: 540, padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 14 },
  variantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  colorCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#CBD5E1' },
  variantSize: { fontSize: 13, fontWeight: '700' },
  variantPrice: { fontSize: 14, fontWeight: '800' },
  closeModalBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modalInput: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13 },
  walkinBtn: { paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', marginVertical: 8 },
  custResultRow: { paddingVertical: 10, borderBottomWidth: 1 },
  newCustBox: { padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  inlineAddBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  paymentTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  payTabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  payTabBtnText: { fontSize: 12, fontWeight: '700' },
  payForm: { marginBottom: 14 },
  payLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  payInput: { height: 42, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  changeBanner: { backgroundColor: '#ECFDF5', padding: 8, borderRadius: 6, marginTop: 6 },
  qrContainer: { padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center', marginBottom: 10 },
  qrHeader: { alignItems: 'center', marginBottom: 10 },
  qrStoreName: { fontSize: 14, fontWeight: '700' },
  qrAmount: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  qrImageWrapper: { padding: 8, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  upiBadgesRow: { marginTop: 10, alignItems: 'center' },
  upiIdTag: { fontSize: 11, marginTop: 4 },
  autoRefBtn: { paddingHorizontal: 12, height: 42, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  splitRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 8 },
  splitCol: { flex: 1, minWidth: 0 },
  splitColLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  splitInput: { width: '100%', minWidth: 0 },
  splitSummaryBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 4 },
  autoFillBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  notesInput: { height: 38, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 12, marginBottom: 16 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  completeOrderBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }
});
