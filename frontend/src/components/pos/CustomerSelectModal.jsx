import React, { useState, useEffect } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';

export const CustomerSelectModal = ({ isOpen, onClose }) => {
  const { customer, setCustomer } = useCart();
  const { showToast } = useApp();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', gstin: '' });

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      const res = await api.get('/customers?limit=100');
      setCustomers(res.data.items || []);
    } catch (err) {
      console.warn('Customer load error:', err);
    }
  };

  const handleSelect = (cust) => {
    setCustomer(cust);
    onClose();
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      showToast('Name and phone number are required', 'error');
      return;
    }
    try {
      const res = await api.post('/customers', newCustomer);
      showToast('Customer created successfully', 'success');
      setCustomer(res.data);
      setIsAddingNew(false);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create customer', 'error');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Customer (F4)" subtitle="Attach customer for invoicing & ledger" maxWidth="max-w-lg">
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => handleSelect({ name: 'Walk-in Customer', phone: '', gstin: '', address: '' })}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer text-left"
        >
          <div>
            <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">Walk-in Customer (General)</h5>
            <p className="text-[11px] text-slate-400">Default generic customer without phone or credit balance</p>
          </div>
          {customer.name === 'Walk-in Customer' && <Check className="h-4 w-4 text-indigo-600" />}
        </button>

        {!isAddingNew ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-indigo-600"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
                    customer.phone === c.phone ? 'ring-2 ring-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40' : ''
                  }`}
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</h5>
                    <p className="text-[11px] text-slate-500 font-medium">{c.phone} {c.gstin && `• GST: ${c.gstin}`}</p>
                  </div>
                  {customer.phone === c.phone && <Check className="h-4 w-4 text-indigo-600" />}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Customer</span>
            </button>
          </>
        ) : (
          <form onSubmit={handleCreateCustomer} className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name *</label>
              <input
                type="text"
                required
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone Number *</label>
              <input
                type="tel"
                required
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                placeholder="e.g. 9876543210"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">GSTIN (Optional)</label>
              <input
                type="text"
                value={newCustomer.gstin}
                onChange={(e) => setNewCustomer({ ...newCustomer, gstin: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                placeholder="29ABCDE1234F1Z5"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md"
              >
                Save & Select
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
