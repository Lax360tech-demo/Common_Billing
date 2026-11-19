import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import api from '../../api/client';
import { formatCurrency } from '../../utils/formatters';

export const CustomerLedgerModal = ({ isOpen, onClose, customer }) => {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (customer && isOpen) {
      api.get(`/customers/${customer.id}`).then(res => setInvoices(res.data.invoices || [])).catch(() => {});
    }
  }, [customer, isOpen]);

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Customer Ledger: ${customer.name}`} subtitle={`Phone: ${customer.phone || 'N/A'} • Outstanding Balance: ${formatCurrency(customer.outstanding_balance)}`} maxWidth="max-w-3xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Billed</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">{formatCurrency(customer.total_purchases)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Invoices</p>
            <p className="text-base font-extrabold text-indigo-600">{invoices.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Balance Due</p>
            <p className={`text-base font-extrabold ${Number(customer.outstanding_balance) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(customer.outstanding_balance)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72 border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-slate-400">No invoices generated yet for this customer.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-indigo-600">{inv.invoice_number}</td>
                    <td className="p-3">{inv.date}</td>
                    <td className="p-3 text-right font-bold">{formatCurrency(inv.grand_total)}</td>
                    <td className="p-3 text-right text-emerald-600 font-semibold">{formatCurrency(inv.paid_amount)}</td>
                    <td className="p-3 text-right text-rose-600 font-semibold">{formatCurrency(inv.balance_due)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};
