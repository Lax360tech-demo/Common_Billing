import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import api from '../api/client';
import { useApp } from './AppContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { showToast } = useApp();
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState({ name: 'Walk-in Customer', phone: '', gstin: '', address: '' });
  const [pricingMode, setPricingMode] = useState('inclusive'); // inclusive | exclusive
  const [cartDiscountPercent, setCartDiscountPercent] = useState(0);
  const [cartDiscountAmount, setCartDiscountAmount] = useState(0);
  const [roundOff, setRoundOff] = useState(0);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastCompletedInvoice, setLastCompletedInvoice] = useState(null);

  const addToCart = useCallback((product, qty = 1, unit = null, attributes = null) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (it) => it.product_id === product.id && it.unit === (unit || product.unit || 'pcs')
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += Number(qty);
        return next;
      }

      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          code: product.code || '',
          barcode: product.barcode || '',
          unit: unit || product.unit || 'pcs',
          unit_price: Number(product.selling_price) || 0,
          quantity: Number(qty),
          discount_percent: 0,
          tax_rate: Number(product.tax_rate) || 0,
          hsn: product.hsn || '',
          attributes: attributes || product.attributes || {}
        }
      ];
    });
  }, []);

  const updateQuantity = useCallback((index, newQty) => {
    setCartItems((prev) => {
      const next = [...prev];
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index].quantity = Number(newQty);
      return next;
    });
  }, []);

  const updateItemUnit = useCallback((index, newUnit) => {
    setCartItems((prev) => {
      const next = [...prev];
      next[index].unit = newUnit;
      return next;
    });
  }, []);

  const updateItemDiscount = useCallback((index, discountPct) => {
    setCartItems((prev) => {
      const next = [...prev];
      next[index].discount_percent = Number(discountPct) || 0;
      return next;
    });
  }, []);

  const updateItemPrice = useCallback((index, newPrice) => {
    setCartItems((prev) => {
      const next = [...prev];
      next[index].unit_price = Number(newPrice) || 0;
      return next;
    });
  }, []);

  const removeFromCart = useCallback((index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCustomer({ name: 'Walk-in Customer', phone: '', gstin: '', address: '' });
    setCartDiscountPercent(0);
    setCartDiscountAmount(0);
    setRoundOff(0);
  }, []);

  // Compute Cart Totals dynamically
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let itemsDiscount = 0;

    cartItems.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const discPct = Number(item.discount_percent) || 0;
      const taxPct = Number(item.tax_rate) || 0;

      const gross = qty * price;
      const discAmt = gross * (discPct / 100);
      const taxable = gross - discAmt;

      let lineTax = 0;
      let lineNetTaxable = taxable;

      if (pricingMode === 'inclusive') {
        lineTax = taxable - taxable / (1 + taxPct / 100);
        lineNetTaxable = taxable - lineTax;
      } else {
        lineTax = taxable * (taxPct / 100);
      }

      const cgst = lineTax / 2;
      const sgst = lineTax / 2;

      subtotal += lineNetTaxable;
      totalTax += lineTax;
      totalCgst += cgst;
      totalSgst += sgst;
      itemsDiscount += discAmt;
    });

    let overallDiscount = itemsDiscount + Number(cartDiscountAmount);
    if (cartDiscountPercent > 0) {
      overallDiscount += subtotal * (Number(cartDiscountPercent) / 100);
    }

    const calculatedTotal = Math.max(0, subtotal + totalTax - (Number(cartDiscountAmount) || 0) + Number(roundOff));

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(totalTax * 100) / 100,
      cgst: Math.round(totalCgst * 100) / 100,
      sgst: Math.round(totalSgst * 100) / 100,
      igst: Math.round(totalIgst * 100) / 100,
      discountAmount: Math.round(overallDiscount * 100) / 100,
      roundOff: Number(roundOff) || 0,
      grandTotal: Math.round(calculatedTotal * 100) / 100,
      itemCount: cartItems.length,
      totalQuantity: cartItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0)
    };
  }, [cartItems, pricingMode, cartDiscountPercent, cartDiscountAmount, roundOff]);

  const completeCheckout = useCallback(
    async (paymentData) => {
      if (cartItems.length === 0) {
        showToast('Cart is empty. Add products before checkout.', 'error');
        return null;
      }

      try {
        const payload = {
          customer,
          items: cartItems,
          pricing_mode: pricingMode,
          cart_discount_percent: Number(cartDiscountPercent),
          cart_discount_amount: Number(cartDiscountAmount),
          round_off: Number(roundOff),
          payment_method: paymentData.payment_method || 'Cash',
          split_details: paymentData.split_details || {},
          paid_amount: Number(paymentData.paid_amount) || cartTotals.grandTotal,
          notes: paymentData.notes || ''
        };

        const res = await api.post('/invoices', payload);
        const createdInvoice = res.data;

        setLastCompletedInvoice(createdInvoice);
        setIsCheckoutOpen(false);
        setIsSuccessOpen(true);
        clearCart();
        showToast(`Invoice #${createdInvoice.invoice_number} generated successfully!`, 'success');
        return createdInvoice;
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'Failed to complete checkout. Please try again.';
        showToast(errorMsg, 'error');
        throw err;
      }
    },
    [cartItems, customer, pricingMode, cartDiscountPercent, cartDiscountAmount, roundOff, cartTotals, clearCart, showToast]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        updateItemUnit,
        updateItemDiscount,
        updateItemPrice,
        removeFromCart,
        clearCart,
        customer,
        setCustomer,
        pricingMode,
        setPricingMode,
        cartDiscountPercent,
        setCartDiscountPercent,
        cartDiscountAmount,
        setCartDiscountAmount,
        roundOff,
        setRoundOff,
        cartTotals,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isSuccessOpen,
        setIsSuccessOpen,
        lastCompletedInvoice,
        setLastCompletedInvoice,
        completeCheckout
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
