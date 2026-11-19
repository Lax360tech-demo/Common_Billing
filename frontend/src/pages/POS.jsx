import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ScanBarcode, QrCode, Filter, Sparkles, ShoppingBag } from 'lucide-react';
import { ProductCard } from '../components/pos/ProductCard';
import { CartPanel } from '../components/pos/CartPanel';
import { CustomerSelectModal } from '../components/pos/CustomerSelectModal';
import { PaymentModal } from '../components/pos/PaymentModal';
import { BarcodeScannerModal } from '../components/pos/BarcodeScannerModal';
import { InvoicePreviewModal } from '../components/invoice/InvoicePreviewModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../api/client';

export const POS = () => {
  const { categoryConfig } = useAuth();
  const { settings, showToast } = useApp();
  const {
    addToCart,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isSuccessOpen,
    setIsSuccessOpen,
    lastCompletedInvoice
  } = useCart();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const searchInputRef = useRef(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products?limit=300');
      setProducts(res.data.items || []);
    } catch (err) {
      console.warn('POS products load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard Shortcuts: F4 Customer, F8 Checkout
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F4') {
        e.preventDefault();
        setIsCustomerModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setIsCheckoutOpen(true);
      } else if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsBarcodeScannerOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsCheckoutOpen]);

  // Extract unique categories from loaded products + business suggested categories
  const categoriesList = useMemo(() => {
    const set = new Set(['All']);
    (categoryConfig?.suggestedCategories || []).forEach((c) => set.add(c));
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products, categoryConfig]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    });
  }, [products, search, selectedCategory]);

  // Handle barcode scanned directly (via camera or hardware wedge)
  const handleBarcodeScanned = (code) => {
    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
        (p.code && p.code.toLowerCase() === code.toLowerCase())
    );
    if (found) {
      addToCart(found, 1);
      showToast(`Added ${found.name} to cart`, 'success');
      setSearch('');
    } else {
      showToast(`No product matched barcode: ${code}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top POS Search & Barcode Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products by Name, SKU, or Barcode (F2)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-semibold focus:outline-indigo-600"
          />
          <button
            type="button"
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            title="Scan Barcode / QR with Camera (F3)"
          >
            <ScanBarcode className="h-4 w-4" />
          </button>
        </div>

        {/* Camera Scanner Trigger */}
        <button
          type="button"
          onClick={() => setIsBarcodeScannerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs shrink-0 cursor-pointer group"
          title="Open Camera Scanner (F3)"
        >
          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
            <ScanBarcode className="h-4 w-4" />
            <QrCode className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
          </div>
          <span>Scan Barcode / QR (F3)</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
            style={selectedCategory === cat ? { backgroundColor: 'var(--theme-primary, #4f46e5)' } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main POS Split Layout: Catalog Grid + Cart Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Catalog Grid */}
        <div className="lg:col-span-8">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <ShoppingBag className="h-12 w-12 text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Products Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                No products match the selected criteria. Add products in Product Management or try another search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3.5">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} onAddToCart={(p) => addToCart(p, 1)} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Sticky Universal Cart Panel */}
        <div className="lg:col-span-4 sticky top-20">
          <CartPanel onOpenCustomerModal={() => setIsCustomerModalOpen(true)} />
        </div>
      </div>

      {/* Modals */}
      <CustomerSelectModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} />
      <PaymentModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScanSuccess={handleBarcodeScanned}
      />
      {lastCompletedInvoice && (
        <InvoicePreviewModal
          isOpen={isSuccessOpen}
          onClose={() => setIsSuccessOpen(false)}
          invoice={lastCompletedInvoice}
          settings={settings}
        />
      )}
    </div>
  );
};

export default POS;
