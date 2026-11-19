import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api/client';
import { useApp } from '../../context/AppContext';

export const SupplierModal = ({ isOpen, onClose, supplier, onSaved }) => {
  const { showToast } = useApp();
  const [formData, setFormData] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', gstin: '', opening_balance: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        gstin: supplier.gstin || '',
        opening_balance: supplier.outstanding_payables || 0
      });
    } else {
      setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', gstin: '', opening_balance: 0 });
    }
  }, [supplier, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (supplier) {
        await api.put(`/suppliers/${supplier.id}`, formData);
        showToast('Supplier updated successfully', 'success');
      } else {
        await api.post('/suppliers', formData);
        showToast('Supplier created successfully', 'success');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save supplier', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={supplier ? 'Edit Supplier' : 'Add New Supplier'} subtitle="Vendor details & payables ledger" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Supplier / Company Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            placeholder="e.g. Apex Distributors Pvt Ltd"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact Person</label>
          <input
            type="text"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            placeholder="e.g. Vikas Malhotra"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone Number *</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            placeholder="e.g. 9123456780"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">GSTIN</label>
          <input
            type="text"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            placeholder="29AAACA9988P1Z8"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Address</label>
          <textarea
            rows="2"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            placeholder="Warehouse address, City"
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md">
            {isSubmitting ? 'Saving...' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
