import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export const Thermal58mmTemplate = ({ invoice, settings }) => {
  if (!invoice) return null;
  const biz = invoice.business_info || settings?.business || {};

  return (
    <div className="w-[220px] mx-auto bg-white p-2 text-black font-mono text-[9px] leading-tight border border-dashed border-slate-300">
      <div className="text-center pb-1 border-b border-dashed border-black">
        <h2 className="text-xs font-bold">{biz.name || 'Lax360 Store'}</h2>
        {biz.gstin && <p className="text-[8px]">GSTIN: {biz.gstin}</p>}
      </div>
      <div className="py-1 border-b border-dashed border-black text-[8px] space-y-0.5">
        <div>Inv: {invoice.invoice_number}</div>
        <div>Date: {invoice.date} {invoice.time}</div>
      </div>
      <div className="py-1 border-b border-dashed border-black">
        {(invoice.items || []).map((it, idx) => (
          <div key={idx} className="flex justify-between py-0.5">
            <span className="truncate w-2/3">{it.quantity}x {it.name}</span>
            <span className="font-bold">₹{it.line_total}</span>
          </div>
        ))}
      </div>
      <div className="py-1 space-y-0.5 font-bold">
        <div className="flex justify-between">
          <span>TOTAL:</span>
          <span>{formatCurrency(invoice.grand_total)}</span>
        </div>
      </div>
      <p className="text-center text-[7px] pt-1">Thank you! Visit again.</p>
    </div>
  );
};
