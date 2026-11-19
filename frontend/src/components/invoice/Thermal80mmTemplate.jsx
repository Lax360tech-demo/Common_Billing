import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const Thermal80mmTemplate = ({ invoice, settings }) => {
  if (!invoice) return null;

  const biz = invoice.business_info || settings?.business || {};
  const customer = invoice.customer || {};

  return (
    <div className="w-[300px] mx-auto bg-white p-4 text-black font-mono text-[11px] leading-tight border border-dashed border-slate-300 shadow-xs print:border-none print:shadow-none print:p-0">
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h2 className="text-sm font-bold uppercase">{biz.name || 'Lax360 Store'}</h2>
        <p className="text-[10px]">{biz.category || 'Universal Retail Store'}</p>
        {biz.address && <p className="text-[9px] mt-0.5">{biz.address}</p>}
        {biz.gstin && <p className="text-[10px] font-bold mt-1">GSTIN: {biz.gstin}</p>}
        {biz.phone && <p className="text-[9px]">Ph: {biz.phone}</p>}
      </div>

      {/* Meta */}
      <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Invoice: <strong>{invoice.invoice_number}</strong></span>
          <span>{invoice.payment_method || 'Cash'}</span>
        </div>
        <div className="flex justify-between">
          <span>Date: {invoice.date} {invoice.time}</span>
          <span>Status: {invoice.payment_status || 'Paid'}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer: {customer.name || 'Walk-in'}</span>
          <span>{customer.phone ? `Ph: ${customer.phone}` : ''}</span>
        </div>
        <div>
          <span>Cashier: {invoice.cashier_name || 'Staff'}</span>
        </div>
      </div>

      {/* Line Items */}
      <div className="py-2 border-b border-dashed border-black">
        <div className="flex justify-between font-bold text-[10px] mb-1">
          <span className="w-1/2">Item & Unit</span>
          <span className="w-1/4 text-center">Qty x Rate</span>
          <span className="w-1/4 text-right">Amt</span>
        </div>

        {(invoice.items || []).map((item, idx) => (
          <div key={idx} className="py-1">
            <div className="font-semibold text-[10px] truncate">{item.name}</div>
            <div className="flex justify-between text-[9px] text-slate-700">
              <span className="w-1/2 truncate">{item.quantity} {item.unit || 'pcs'}</span>
              <span className="w-1/4 text-center">₹{item.unit_price}</span>
              <span className="w-1/4 text-right font-bold">₹{item.line_total}</span>
            </div>
            {item.discount_amount > 0 && (
              <div className="text-[9px] text-right text-slate-600">
                Disc: -₹{item.discount_amount}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal (Taxable):</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>CGST:</span>
          <span>{formatCurrency(invoice.cgst || (invoice.tax_amount / 2))}</span>
        </div>
        <div className="flex justify-between">
          <span>SGST:</span>
          <span>{formatCurrency(invoice.sgst || (invoice.tax_amount / 2))}</span>
        </div>
        {invoice.discount_amount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(invoice.discount_amount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-bold pt-1 border-t border-dashed border-black">
          <span>GRAND TOTAL:</span>
          <span>{formatCurrency(invoice.grand_total)}</span>
        </div>
        <div className="flex justify-between pt-0.5">
          <span>Paid ({invoice.payment_method}):</span>
          <span>{formatCurrency(invoice.paid_amount || invoice.grand_total)}</span>
        </div>
        {Number(invoice.balance_due) > 0 && (
          <div className="flex justify-between font-bold text-rose-600">
            <span>Balance Due:</span>
            <span>{formatCurrency(invoice.balance_due)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pt-2 space-y-1 text-[9px]">
        <p className="font-semibold">{settings?.billing?.invoice_footer || 'Thank you for your business! Visit again.'}</p>
        <p className="text-[8px] text-slate-500">Powered by Lax360 Billing SaaS</p>
      </div>
    </div>
  );
};
