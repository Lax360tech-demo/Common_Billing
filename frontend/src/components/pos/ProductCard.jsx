import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';

export const ProductCard = ({ product }) => {
  const { cartItems, updateQuantity, addToCart } = useCart();
  const isOutOfStock = Number(product.stock) <= 0;
  const isLowStock = Number(product.stock) <= Number(product.min_stock_level || 5);

  const itemIndex = cartItems.findIndex((it) => it.product_id === product.id);
  const itemInCart = itemIndex > -1 ? cartItems[itemIndex] : null;
  const qtyInCart = itemInCart ? itemInCart.quantity : 0;

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (itemInCart) {
      updateQuantity(itemIndex, qtyInCart + 1);
    } else {
      addToCart(product, 1);
    }
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (!itemInCart || qtyInCart <= 0) return;
    updateQuantity(itemIndex, qtyInCart - 1);
  };

  return (
    <div
      onClick={handleIncrease}
      className={`group relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-slate-900 p-4 transition-all duration-200 select-none ${
        isOutOfStock
          ? 'opacity-60 cursor-not-allowed bg-slate-100/50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800'
          : qtyInCart > 0
          ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md cursor-pointer'
          : 'border-slate-200/80 dark:border-slate-800 hover:shadow-lg hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer active:scale-[0.99]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-1 text-[11px] mb-2">
          <span className="font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
            {product.category || 'General'}
          </span>
          <span
            className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
              isOutOfStock
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                : isLowStock
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : `${product.stock} ${product.unit || 'pcs'}`}
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {product.name}
        </h4>

        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
          {product.brand && <span className="font-medium text-slate-600 dark:text-slate-300">{product.brand}</span>}
          {product.code && <span>#{product.code}</span>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
        <div>
          <span className="text-xs text-slate-400 block -mb-0.5">Price</span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(product.selling_price)}
          </span>
        </div>

        {/* Plus / Minus Step Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            disabled={isOutOfStock || qtyInCart === 0}
            onClick={handleDecrease}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-95 ${
              qtyInCart === 0
                ? 'opacity-30 cursor-not-allowed text-slate-400'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 shadow-xs cursor-pointer'
            }`}
            title="Reduce quantity by 1"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <span className="min-w-[20px] px-1 text-center text-xs font-black text-slate-900 dark:text-white select-none">
            {qtyInCart}
          </span>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleIncrease}
            className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold shadow-xs transition active:scale-95 cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                : 'text-white hover:opacity-90'
            }`}
            style={!isOutOfStock ? { backgroundColor: 'var(--theme-primary, #4f46e5)' } : {}}
            title="Increase quantity by 1"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

