import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { calculateCartTotals, validatePayment } from '../utils/calculations';
import { api } from '../api/client';
import { useSettings } from './SettingsContext';

const CartContext = createContext(null);

const DEFAULT_WALKIN_CUSTOMER = {
  id: 'walk-in',
  name: 'Walk-in Customer',
  phone: '9840000000',
  city: 'Local',
  state: 'Tamil Nadu',
  gstin: '',
  address: ''
};

export const CartProvider = ({ children }) => {
  const { settings, showToast } = useSettings();
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState(DEFAULT_WALKIN_CUSTOMER);
  const [billDiscount, setBillDiscount] = useState({ type: 'fixed', value: 0 });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedFestival, setAppliedFestival] = useState(null);
  const [isCheckingFestival, setIsCheckingFestival] = useState(false);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastCompletedInvoice, setLastCompletedInvoice] = useState(null);

  // Auto-check active festival offer
  useEffect(() => {
    const checkFestival = async () => {
      try {
        setIsCheckingFestival(true);
        const res = await api.getActiveFestival();
        if (res && res.active && res.offer) {
          setAppliedFestival(res.offer);
        } else {
          setAppliedFestival(null);
        }
      } catch (e) {
        // silent
      } finally {
        setIsCheckingFestival(false);
      }
    };
    checkFestival();
  }, []);

  const isInclusive = (settings?.billing?.pricingMode || 'inclusive') === 'inclusive';

  const couponDiscountVal = appliedCoupon?.discount_amount || appliedCoupon?.discount_value || 0;
  const festivalDiscountVal = appliedFestival?.discount_value || 0;

  const cartTotals = useMemo(() => {
    return calculateCartTotals(
      cartItems,
      billDiscount,
      isInclusive,
      couponDiscountVal,
      festivalDiscountVal
    );
  }, [cartItems, billDiscount, isInclusive, couponDiscountVal, festivalDiscountVal]);

  const addToCart = (variant, product, quantity = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (it) => it.productId === product.id && it.variantId === variant.id
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const currentQty = next[existingIndex].quantity;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: currentQty + quantity
        };
        return next;
      }

      const newItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        category: product.category,
        fabric: product.fabric,
        brand: product.brand,
        size: variant.size,
        color: variant.color,
        hex: variant.hex,
        sku: variant.sku,
        barcode: variant.barcode,
        quantity: quantity,
        unitPrice: variant.price || product.price,
        mrp: variant.mrp || product.mrp,
        gstRate: product.gstRate || 5.0,
        discountType: 'fixed',
        discountValue: 0
      };

      return [...prev, newItem];
    });

    showToast(`Added ${product.name} (${variant.size}) to cart.`, 'info');
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, quantity: Number(quantity) } : it))
    );
  };

  const updateUnitPrice = (itemId, price) => {
    setCartItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, unitPrice: Number(price) } : it))
    );
  };

  const updateItemDiscount = (itemId, type, value) => {
    setCartItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, discountType: type, discountValue: Number(value) } : it
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
    setBillDiscount({ type: 'fixed', value: 0 });
    setAppliedCoupon(null);
    setCustomer(DEFAULT_WALKIN_CUSTOMER);
  };

  const applyCoupon = async (code) => {
    if (!code || !code.trim()) return;
    try {
      const res = await api.validateCoupon(
        code.trim(),
        cartTotals.grossSubtotal,
        customer.id,
        cartItems.map((i) => i.category)
      );
      if (res.valid) {
        setAppliedCoupon(res);
        showToast(`Coupon '${code.toUpperCase()}' applied: -₹${res.discount_amount}`, 'success');
      } else {
        showToast(res.message || 'Invalid coupon', 'error');
      }
    } catch (e) {
      showToast(e.message || 'Failed to validate coupon', 'error');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed.', 'info');
  };

  const completeCheckout = async (paymentMethod = 'Cash', paymentData = {}, notes = '') => {
    if (cartItems.length === 0) {
      showToast('Cannot checkout with an empty cart.', 'error');
      return { success: false, error: 'Empty cart' };
    }

    const payValidation = validatePayment(cartTotals.netPayable, paymentMethod, paymentData);
    if (!payValidation.valid) {
      showToast(payValidation.error, 'error');
      return { success: false, error: payValidation.error };
    }

    try {
      const payload = {
        customer,
        items: cartItems,
        billDiscount,
        coupon_code: appliedCoupon?.code,
        payment: {
          method: paymentMethod,
          reference: paymentData.reference || '',
          amountReceived: Number(paymentData.amountReceived) || cartTotals.netPayable,
          changeReturned: payValidation.changeReturned || 0,
          splitDetails: paymentData.splitDetails || null
        },
        notes
      };

      const invoice = await api.createInvoice(payload);
      setLastCompletedInvoice(invoice);
      clearCart();
      setIsCheckoutOpen(false);
      setIsSuccessOpen(true);
      showToast(`Invoice #${invoice.invoiceNumber} created successfully!`, 'success');
      return { success: true, invoice };
    } catch (e) {
      showToast(e.message || 'Failed to complete checkout', 'error');
      return { success: false, error: e.message };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        customer,
        setCustomer,
        billDiscount,
        setBillDiscount,
        appliedCoupon,
        appliedFestival,
        isCheckingFestival,
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
        setIsCheckoutOpen,
        isSuccessOpen,
        setIsSuccessOpen,
        lastCompletedInvoice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
