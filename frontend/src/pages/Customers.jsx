import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit2, Trash2, Users } from 'lucide-react';
import { CustomerModal } from '../components/customers/CustomerModal';
import { CustomerLedgerModal } from '../components/customers/CustomerLedgerModal';
import { useApp } from '../context/AppContext';
import api from '../api/client';
import { formatCurrency } from '../utils/formatters';

export const Customers = () => {
  const { showToast } = useApp();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers?limit=100');
      setCustomers(res.data.items || []);
    } catch (err) {
      console.warn('Customers load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer ${name}?`)) return;
    try {
      await api.delete(`/customers/${id}`);
      showToast('Customer deleted successfully', 'success');
      loadCustomers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete customer', 'error');
    }
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.gstin?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Customer Directory & Accounts
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage client profiles, purchase histories, and credit ledgers
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedCustomer(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          style={{ backgroundColor: 'var(--theme-primary, #4f46e5)' }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-indigo-600"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Email</th>
                <th className="p-4">GSTIN</th>
                <th className="p-4 text-right">Total Purchases</th>
                <th className="p-4 text-right">Balance Due</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400">
                    No customers found. Click "Add Customer" to register one.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">
                      {c.phone}
                    </td>
                    <td className="p-4 text-slate-500">
                      {c.email || '-'}
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                      {c.gstin || '-'}
                    </td>
                    <td className="p-4 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(c.total_purchases)}
                    </td>
                    <td className="p-4 text-right font-extrabold">
                      <span className={Number(c.outstanding_balance) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {formatCurrency(c.outstanding_balance)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setLedgerCustomer(c);
                            setIsLedgerOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                          title="View Ledger & Invoices"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Edit Customer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSaved={loadCustomers}
      />
      <CustomerLedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        customer={ledgerCustomer}
      />
    </div>
  );
};

export default Customers;
