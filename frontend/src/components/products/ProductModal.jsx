import React, { useState, useEffect } from 'react';
import { ScanBarcode } from 'lucide-react';
import Modal from '../common/Modal';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import api from '../../api/client';

export const ProductModal = ({ isOpen, onClose, product, onSaved, categoriesList = [] }) => {
  const { categoryConfig } = useAuth();
  const { showToast } = useApp();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    category: 'General',
    brand: '',
    description: '',
    purchase_price: '',
    selling_price: '',
    mrp: '',
    tax_rate: 18,
    unit: 'pcs',
    stock: '',
    min_stock_level: 5,
    hsn: '',
    attributes: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        barcode: product.barcode || '',
        category: product.category || 'General',
        brand: product.brand || '',
        description: product.description || '',
        purchase_price: product.purchase_price !== undefined && product.purchase_price !== null ? String(product.purchase_price) : '',
        selling_price: product.selling_price !== undefined && product.selling_price !== null ? String(product.selling_price) : '',
        mrp: (product.mrp ?? product.selling_price) !== undefined ? String(product.mrp ?? product.selling_price) : '',
        tax_rate: product.tax_rate ?? 0,
        unit: product.unit || categoryConfig?.defaultUnit || 'pcs',
        stock: product.stock !== undefined && product.stock !== null ? String(product.stock) : '',
        min_stock_level: product.min_stock_level || 5,
        hsn: product.hsn || '',
        attributes: product.attributes || {}
      });
    } else {
      const defaultCat = categoriesList?.find(c => c && c !== 'All') || categoryConfig?.suggestedCategories?.[0] || 'General';
      setFormData({
        name: '',
        code: '',
        barcode: '',
        category: defaultCat,
        brand: '',
        description: '',
        purchase_price: '',
        selling_price: '',
        mrp: '',
        tax_rate: 18,
        unit: categoryConfig?.defaultUnit || 'pcs',
        stock: '',
        min_stock_level: 5,
        hsn: '',
        attributes: {}
      });
    }
  }, [product, categoryConfig, isOpen]);

  const handleNumberChange = (field, val) => {
    if (val === '' || val === null || val === undefined) {
      setFormData((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    let cleanVal = String(val);
    // Remove leading zeros when followed by other digits (e.g. '05' -> '5', '0100' -> '100')
    if (/^0[0-9]/.test(cleanVal)) {
      cleanVal = cleanVal.replace(/^0+/, '') || '0';
    }
    setFormData((prev) => ({ ...prev, [field]: cleanVal }));
  };

  const availableCategories = React.useMemo(() => {
    const set = new Set();
    (categoryConfig?.suggestedCategories || []).forEach((c) => c && set.add(c.trim()));
    (categoriesList || []).forEach((c) => c && c !== 'All' && set.add(c.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [categoryConfig, categoriesList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        category: formData.category?.trim() || 'General',
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        mrp: parseFloat(formData.mrp) || parseFloat(formData.selling_price) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        stock: parseFloat(formData.stock) || 0,
        min_stock_level: parseFloat(formData.min_stock_level) || 0
      };

      if (product) {
        await api.put(`/products/${product.id}`, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Product added successfully', 'success');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dynamicFields = categoryConfig?.productFields || [];

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Product'}
      subtitle={`Category: ${categoryConfig?.name || 'Universal Store'}`}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core Product Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              placeholder="Enter Product name"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category</label>
            <input
              type="text"
              list="suggested-cats"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            />
            <datalist id="suggested-cats">
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Brand / Make</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              placeholder="Enter Brand"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Barcode / SKU</label>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                <ScanBarcode className="h-3.5 w-3.5" />
                <span>Scan Camera</span>
              </button>
            </div>
            <div className="relative mt-1">
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-indigo-600"
                placeholder="Leave blank to auto-generate"
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 cursor-pointer"
                title="Scan Barcode / QR Code"
              >
                <ScanBarcode className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Measurement Unit</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            >
              {(categoryConfig?.units || ['pcs', 'kg', 'gm', 'ltr', 'box', 'pack', 'metre']).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing & GST */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Purchase Cost (₹)</label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={formData.purchase_price}
              onChange={(e) => handleNumberChange('purchase_price', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Selling Price (₹) *</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0"
              value={formData.selling_price}
              onChange={(e) => handleNumberChange('selling_price', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">GST Slab (%)</label>
            <select
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
            >
              <option value="0">0% (Exempt)</option>
              <option value="5">5% (Essentials)</option>
              <option value="12">12% (Standard)</option>
              <option value="18">18% (General)</option>
              <option value="28">28% (Luxury)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Initial Stock / Quantity</label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={formData.stock}
              onChange={(e) => handleNumberChange('stock', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
            />
          </div>
        </div>

        {/* Category-Specific Dynamic Fields */}
        {dynamicFields.length > 0 && (
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              {categoryConfig?.name} Specific Attributes
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dynamicFields.map((field) => (
                <div key={field.key}>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={formData.attributes[field.key] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attributes: { ...formData.attributes, [field.key]: e.target.value }
                      })
                    }
                    placeholder={field.placeholder || ''}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </Modal>
    <BarcodeScannerModal
      isOpen={isScannerOpen}
      onClose={() => setIsScannerOpen(false)}
      onScanSuccess={(code) => setFormData((prev) => ({ ...prev, barcode: code }))}
      title="Scan Product Barcode / QR Code"
      subtitle="Point camera directly at the product code to autofill SKU"
    />
    </>
  );
};
