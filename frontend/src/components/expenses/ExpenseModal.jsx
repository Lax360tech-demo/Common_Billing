import React, { useState } from 'react';
import Modal from '../common/Modal';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

export const ExpenseModal = ({ isOpen, onClose, onSaved }) => {
  const { showToast } = useApp();
  const [formData, setFormData] = useState({
    category: 'Rent',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    reference: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) {
      showToast('Description and amount are required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/expenses', { ...formData, amount: parseFloat(formData.amount) || 0 });
      showToast('Expense recorded successfully', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to record expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Business Expense" subtitle="Track overheads, rent, utilities, salaries" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
          >
            <option value="Rent">Rent & Lease</option>
            <option value="Utilities">Electricity & Utilities</option>
            <option value="Salaries">Staff Salaries & Wages</option>
            <option value="Marketing">Marketing & Advertising</option>
            <option value="Maintenance">Maintenance & Repairs</option>
            <option value="Office Supplies">Office Supplies</option>
            <option value="Transport">Transport & Logistics</option>
            <option value="Other">Other Expenses</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description *</label>
          <input
            type="text"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            placeholder="e.g. Monthly commercial electricity bill"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount (₹) *</label>
            <input
              type="number"
              step="any"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-rose-600"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Payment Method</label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Receipt Ref #</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              placeholder="Voucher # or TXN ID"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md">
            {isSubmitting ? 'Recording...' : 'Save Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
