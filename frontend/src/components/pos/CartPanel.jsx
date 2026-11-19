import React from 'react';
import { Plus, Minus, Trash2, UserPlus, CreditCard, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';

export const CartPanel = ({ onOpenCustomerModal }) => {
  const {
    cartItems,
    customer,
    updateQuantity,
    updateItemUnit,
    updateItemDiscount,
    removeFromCart,
    clearCart,
    cartTotals,
    pricingMode,
    setPricingMode,
    setIsCheckoutOpen
  } = useCart();
  const { categoryConfig } = useAuth();

  const availableUnits = categoryConfig?.units || ['pcs', 'kg', 'gm', 'ltr', 'box', 'pack'];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md overflow-hidden">
      {/* Customer Header Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Customer</span>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
            {customer.name || 'Walk-in Customer'}
          </h4>
          {customer.phone && <p className="text-[11px] text-slate-500 font-medium">{customer.phone}</p>}
        </div>

        <button
          type="button"
          onClick={onOpenCustomerModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
          <span>F4 Customer</span>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <ShoppingBag className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Your Cart is Empty</p>
            <p className="text-xs text-slate-400 max-w-[200px] mt-1">
              Select products from the catalog to build an invoice.
            </p>
          </div>
        ) : (
          cartItems.map((item, idx) => (
            <div
              key={`${item.product_id}-${idx}`}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 flex flex-col gap-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{item.name}</h5>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {formatCurrency(item.unit_price)} × {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(item.unit_price * item.quantity * (1 - (item.discount_percent || 0) / 100))}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(idx)}
                    className="block ml-auto text-slate-400 hover:text-rose-500 transition mt-1 p-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Quantity & Unit Controls */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateQuantity(idx, Math.max(0, item.quantity - 1))}
                    className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(idx, parseFloat(e.target.value) || 0)}
                    className="w-12 text-center text-xs font-bold py-1 border-x border-slate-200 dark:border-slate-700 bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => updateQuantity(idx, item.quantity + 1)}
                    className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <select
                  value={item.unit}
                  onChange={(e) => updateItemUnit(idx, e.target.value)}
                  className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {availableUnits.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="0"
                    value={item.discount_percent || ''}
                    onChange={(e) => updateItemDiscount(idx, e.target.value)}
                    className="w-11 text-center text-xs py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">% off</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <span className="text-slate-500 font-medium">Pricing Mode:</span>
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setPricingMode('inclusive')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  pricingMode === 'inclusive' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                }`}
              >
                GST Incl
              </button>
              <button
                type="button"
                onClick={() => setPricingMode('exclusive')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  pricingMode === 'exclusive' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                }`}
              >
                GST Excl
              </button>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(cartTotals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST Total:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(cartTotals.taxAmount)}</span>
            </div>
            {cartTotals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Total Discount:</span>
                <span>-{formatCurrency(cartTotals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Grand Total:</span>
              <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(cartTotals.grandTotal)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={clearCart}
              className="px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Clear Cart"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-[0.99]"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              <CreditCard className="h-4 w-4" />
              <span>Checkout F8 ({formatCurrency(cartTotals.grandTotal)})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
