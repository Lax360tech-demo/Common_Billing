import React, { useState } from 'react';
import Modal from '../common/Modal';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

export const StockAdjustmentModal = ({ isOpen, onClose, product, onAdjusted }) => {
  const { showToast } = useApp();
  const [type, setType] = useState('INWARD'); // INWARD, OUTWARD, CORRECTION, DAMAGE, RETURN
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/inventory/adjust', {
        product_id: product.id,
        adjustment_type: type,
        quantity: parseFloat(quantity) || 0,
        reason
      });
      showToast('Stock adjustment recorded successfully', 'success');
      onAdjusted?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to adjust stock', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust Stock: ${product.name}`} subtitle={`Current stock: ${product.stock} ${product.unit || 'pcs'}`} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Adjustment Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
          >
            <option value="INWARD">Inward (+ Increase Stock)</option>
            <option value="OUTWARD">Outward (- Manual Deduction)</option>
            <option value="CORRECTION">Correction (= Set Absolute Count)</option>
            <option value="DAMAGE">Damaged / Expired (- Write-off)</option>
            <option value="RETURN">Customer Return (+ Inward)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {type === 'CORRECTION' ? 'New Total Stock Count' : 'Quantity to Adjust'}
          </label>
          <input
            type="number"
            step="any"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reason / Reference</label>
          <input
            type="text"
            required
            placeholder="e.g. Audit reconciliation, Supplier batch inward..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md"
          >
            {isSubmitting ? 'Updating...' : 'Save Adjustment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
