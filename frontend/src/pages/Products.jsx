import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, SlidersHorizontal, Trash2, Package, ArrowUpDown } from 'lucide-react';
import { ProductModal } from '../components/products/ProductModal';
import { StockAdjustmentModal } from '../components/products/StockAdjustmentModal';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import { formatCurrency } from '../utils/formatters';

export const Products = () => {
  const { business, categoryConfig } = useAuth();
  const { showToast } = useApp();

  const [products, setProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('category'); // Sorted based on categories by default
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  const loadCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      if (Array.isArray(res.data)) {
        setDbCategories(res.data);
      }
    } catch (err) {
      console.warn('Products categories load error:', err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const q = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      const res = await api.get(`/products${q}`);
      setProducts(res.data.items || []);
    } catch (err) {
      console.warn('Products load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const handleProductSaved = () => {
    loadProducts();
    loadCategories();
  };

  const handleDelete = async (prodId, prodName) => {
    if (!window.confirm(`Are you sure you want to delete ${prodName}?`)) return;
    try {
      await api.delete(`/products/${prodId}`);
      showToast('Product deleted successfully', 'success');
      loadProducts();
      loadCategories();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete product', 'error');
    }
  };

  // Dynamically aggregate categories list from configuration, DB distinct categories, and newly input products
  const allCategories = useMemo(() => {
    const set = new Set();
    (categoryConfig?.suggestedCategories || []).forEach((c) => {
      if (c && typeof c === 'string' && c.trim()) set.add(c.trim());
    });
    dbCategories.forEach((c) => {
      if (c && typeof c === 'string' && c.trim()) set.add(c.trim());
    });
    products.forEach((p) => {
      if (p.category && typeof p.category === 'string' && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [categoryConfig, dbCategories, products]);

  // Sort and filter products: defaults to sorting based on categories
  const sortedAndFiltered = useMemo(() => {
    let list = products.filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      if (sortField === 'category') {
        const catA = (a.category || '').toLowerCase();
        const catB = (b.category || '').toLowerCase();
        const comp = catA.localeCompare(catB);
        if (comp !== 0) {
          return sortOrder === 'asc' ? comp : -comp;
        }
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortField === 'name') {
        const comp = (a.name || '').localeCompare(b.name || '');
        return sortOrder === 'asc' ? comp : -comp;
      } else if (sortField === 'stock') {
        const diff = (Number(a.stock) || 0) - (Number(b.stock) || 0);
        return sortOrder === 'asc' ? diff : -diff;
      }
      return 0;
    });
  }, [products, search, sortField, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Product & Inventory Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configured for <strong>{categoryConfig?.name}</strong> • Stock tracking & GST rates
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedProduct(null);
            setIsProductModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          style={{ backgroundColor: 'var(--theme-primary, #4f46e5)' }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by Name, SKU, Barcode, Brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-indigo-600"
          >
            <option value="All">All Categories ({allCategories.length})</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-4">SKU / Code</th>
                <th className="p-4">Product Details</th>
                <th
                  className="p-4 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  onClick={() => {
                    if (sortField === 'category') {
                      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                    } else {
                      setSortField('category');
                      setSortOrder('asc');
                    }
                  }}
                  title="Click to sort by Category"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black">
                      {sortField === 'category' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>
                <th className="p-4 text-center">Unit</th>
                <th className="p-4 text-right">Cost Price</th>
                <th className="p-4 text-right">Selling Price</th>
                <th className="p-4 text-center">GST Slab</th>
                <th className="p-4 text-center">In Stock</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedAndFiltered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-slate-400">
                    {loading ? 'Loading products...' : 'No products found. Click "Add Product" to create your first item.'}
                  </td>
                </tr>
              ) : (
                sortedAndFiltered.map((prod) => {
                  const isOutOfStock = Number(prod.stock) <= 0;
                  const isLowStock = Number(prod.stock) <= Number(prod.min_stock_level || 5);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                        {prod.code || prod.barcode}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{prod.name}</p>
                        {prod.brand && <p className="text-[11px] text-slate-400">Brand: {prod.brand}</p>}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60">
                          {prod.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-200 uppercase">
                        {prod.unit || 'pcs'}
                      </td>
                      <td className="p-4 text-right text-slate-500 font-medium">
                        {formatCurrency(prod.purchase_price)}
                      </td>
                      <td className="p-4 text-right font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(prod.selling_price)}
                      </td>
                      <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {prod.tax_rate || 0}%
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {prod.stock} {prod.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(prod);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                            title="Edit Product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingProduct(prod);
                              setIsAdjustmentOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition"
                            title="Adjust Stock"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onSaved={handleProductSaved}
        categoriesList={allCategories}
      />
      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        product={adjustingProduct}
        onAdjusted={handleProductSaved}
      />
    </div>
  );
};

export default Products;
