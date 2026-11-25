import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const InvoiceA4Template = ({ invoice, settings }) => {
  if (!invoice) return null;

  const biz = invoice.business_info || settings?.business || {};
  const customer = invoice.customer || {};

  return (
    <div className="w-[794px] min-h-[1123px] mx-auto bg-white p-10 text-slate-900 font-sans text-xs leading-relaxed border border-slate-200 shadow-md print:border-none print:shadow-none print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-300 pb-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 block mb-1">
            TAX INVOICE
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{biz.name || 'Lax360 Enterprise Store'}</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{biz.category || 'Universal POS Business'}</p>
          {biz.address && <p className="text-xs text-slate-600 mt-1 max-w-sm">{biz.address}</p>}
          <div className="mt-2 text-xs font-semibold space-y-0.5">
            {biz.gstin && <p>GSTIN: <span className="font-mono font-bold text-slate-800">{biz.gstin}</span></p>}
            {biz.phone && <p>Phone: <span className="text-slate-800">{biz.phone}</span></p>}
            {biz.email && <p>Email: <span className="text-slate-800">{biz.email}</span></p>}
          </div>
        </div>

        <div className="text-right">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-right space-y-1">
            <p className="text-xs text-slate-500 font-bold uppercase">Invoice Number</p>
            <p className="text-lg font-black text-indigo-700 font-mono">{invoice.invoice_number}</p>
            <p className="text-xs text-slate-500">Date: <strong className="text-slate-800">{invoice.date} {invoice.time}</strong></p>
            <p className="text-xs text-slate-500">Payment: <strong className="text-slate-800">{invoice.payment_method} ({invoice.payment_status || 'Paid'})</strong></p>
          </div>
        </div>
      </div>

      {/* Customer / Billed To Section */}
      <div className="my-6 grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Billed To (Customer)</p>
          <h3 className="text-sm font-bold text-slate-900">{customer.name || 'Walk-in Customer'}</h3>
          {customer.phone && <p className="text-xs text-slate-600 mt-0.5">Phone: {customer.phone}</p>}
          {customer.address && <p className="text-xs text-slate-600 mt-0.5">{customer.address}</p>}
          {customer.gstin && <p className="text-xs font-mono font-bold text-slate-700 mt-1">Customer GSTIN: {customer.gstin}</p>}
        </div>
        <div className="text-right flex flex-col justify-end">
          <p className="text-xs text-slate-500">Place of Supply: <strong className="text-slate-800">State Code {biz.stateCode || '33'}</strong></p>
          <p className="text-xs text-slate-500 mt-1">Reverse Charge Applicable: <strong className="text-slate-800">No</strong></p>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3">HSN/SAC</th>
              <th className="py-2.5 px-3 text-center">Qty & Unit</th>
              <th className="py-2.5 px-3 text-right">Unit Rate</th>
              <th className="py-2.5 px-3 text-right">Disc</th>
              <th className="py-2.5 px-3 text-right">Taxable</th>
              <th className="py-2.5 px-3 text-right">GST %</th>
              <th className="py-2.5 px-3 text-right">Tax Amt</th>
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(invoice.items || []).map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                <td className="py-2.5 px-3 font-mono text-slate-500">{item.hsn || '-'}</td>
                <td className="py-2.5 px-3 text-center font-bold">{item.quantity} {item.unit || 'pcs'}</td>
                <td className="py-2.5 px-3 text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                  {item.discount_amount > 0 ? `-₹${item.discount_amount}` : '-'}
                </td>
                <td className="py-2.5 px-3 text-right">₹{Number(item.taxable_amount || item.line_total).toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-medium">{Number(item.tax_rate || 0)}%</td>
                <td className="py-2.5 px-3 text-right font-medium">₹{Number(item.tax_amount || 0).toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{Number(item.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Calculation */}
      <div className="mt-6 flex justify-end">
        <div className="w-80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Taxable Amount (Subtotal):</span>
            <span className="font-bold text-slate-800">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>CGST Amount:</span>
            <span className="font-bold text-slate-800">{formatCurrency(invoice.cgst || (invoice.tax_amount / 2))}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>SGST Amount:</span>
            <span className="font-bold text-slate-800">{formatCurrency(invoice.sgst || (invoice.tax_amount / 2))}</span>
          </div>
          {invoice.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Overall Discount:</span>
              <span>-{formatCurrency(invoice.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-300">
            <span>Grand Total:</span>
            <span className="text-indigo-700">{formatCurrency(invoice.grand_total)}</span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
            <span>Amount Paid:</span>
            <span className="font-bold text-emerald-700">{formatCurrency(invoice.paid_amount || invoice.grand_total)}</span>
          </div>
          {Number(invoice.balance_due) > 0 && (
            <div className="flex justify-between text-xs font-bold text-rose-600">
              <span>Balance Due:</span>
              <span>{formatCurrency(invoice.balance_due)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Terms & Signatory */}
      <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Terms & Conditions</p>
          <p className="text-[11px] text-slate-500 leading-normal whitespace-pre-line">
            {settings?.billing?.termsAndConditions || '1. Goods once sold can be returned within 7 days in original condition.\n2. Subject to local jurisdiction.\nThank you for choosing Lax360 Billing!'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-800 mb-12">For {biz.name || 'Lax360 Enterprise Store'}</p>
          <p className="text-xs text-slate-400 font-medium">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
};
