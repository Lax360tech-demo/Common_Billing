/**
 * Generates standalone, pixel-perfect HTML for thermal receipt rolls (80mm, 58mm) and A4 invoices.
 * Designed for direct printing via Electron and in-app print preview.
 */
export function generateReceiptHtml(invoice, storeSettings = {}, paperSize = '80mm') {
  if (!invoice) return '';

  const store = storeSettings?.store || {};
  const billing = storeSettings?.billing || {};
  const summary = invoice.summary || {};
  const items = invoice.items || [];
  const customer = invoice.customer || {};
  const payment = invoice.payment || {};

  const storeName = store.storeName || 'Lady Avenue Showroom';
  const tagline = store.tagline || 'Retail & Apparel Showroom';
  const address = store.address || '42, Tech Park Boulevard, Sector 5';
  const cityState = `${store.city || 'Salem'}, ${store.state || 'Tamil Nadu'} - ${store.pincode || '636001'}`;
  const phone = store.phone || '+91 98412 34567';
  const gstin = store.gstin || '33AABCL3601K1ZM';
  const invNum = invoice.invoiceNumber || invoice.invoice_number || 'TEX-2026';
  const invDate = invoice.date ? new Date(invoice.date).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const cashier = invoice.cashier || billing?.cashierName || 'Cashier 01';
  const payMethod = payment.method || 'Cash';
  const terms = billing?.termsAndConditions || 'Goods once sold cannot be returned. Exchange within 7 days with original invoice.';

  const isA4 = paperSize === 'A4';
  const is58mm = paperSize === '58mm';

  if (isA4) {
    // Professional A4 GST Invoice Template
    const itemsHtml = items.map((it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 6px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 8px 6px;">
          <div style="font-weight: 600; color: #1e293b;">${it.name || 'Product'}</div>
          <div style="font-size: 11px; color: #64748b;">${it.size || ''} ${it.color ? '• ' + it.color : ''} ${it.sku ? '(' + it.sku + ')' : ''}</div>
        </td>
        <td style="padding: 8px 6px; text-align: center;">${it.quantity || 1}</td>
        <td style="padding: 8px 6px; text-align: right;">₹${Number(it.unitPrice || 0).toFixed(2)}</td>
        <td style="padding: 8px 6px; text-align: right; font-weight: 600;">₹${Number(it.lineTotal || it.grossAmount || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice #${invNum}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 20px; color: #0f172a; background: #fff; font-size: 13px; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 24px; background: #fff; }
    .top-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 14px; margin-bottom: 16px; }
    .store-brand h1 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
    .store-brand p { margin: 2px 0; font-size: 12px; color: #64748b; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { margin: 0; font-size: 18px; color: #4f46e5; font-weight: 800; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
    .meta-box h3 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .meta-box p { margin: 2px 0; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f1f5f9; padding: 10px 6px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
    .totals-area { display: flex; justify-content: flex-end; margin-top: 10px; }
    .totals-table { width: 320px; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e2e8f0; }
    .net-payable { display: flex; justify-content: space-between; background: #4f46e5; color: #fff; font-size: 16px; font-weight: 800; padding: 10px 12px; border-radius: 6px; margin-top: 8px; }
    .footer-note { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 0; } .invoice-card { border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="top-bar">
      <div class="store-brand">
        <h1>${storeName}</h1>
        <p>${tagline}</p>
        <p>${address}</p>
        <p>${cityState} • Ph: ${phone}</p>
        <p style="font-weight: 700; color: #334155;">GSTIN: ${gstin}</p>
      </div>
      <div class="invoice-title">
        <h2>GST TAX INVOICE</h2>
        <p style="margin: 4px 0; font-weight: 700; font-size: 14px;">#${invNum}</p>
        <p style="margin: 2px 0; font-size: 12px; color: #64748b;">${invDate}</p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h3>Billed To (Customer)</h3>
        <p><strong>Name:</strong> ${customer.name || 'Walk-in Customer'}</p>
        <p><strong>Mobile:</strong> ${customer.phone || 'N/A'}</p>
        ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ''}
      </div>
      <div class="meta-box">
        <h3>Payment & Staff</h3>
        <p><strong>Payment Mode:</strong> ${payMethod}</p>
        <p><strong>Cashier:</strong> ${cashier}</p>
        ${payment.referenceNumber ? `<p><strong>Ref / Txn:</strong> ${payment.referenceNumber}</p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th>Item & Details</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 100px; text-align: right;">Unit Rate</th>
          <th style="width: 110px; text-align: right;">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals-area">
      <div class="totals-table">
        <div class="totals-row"><span>Gross Subtotal:</span><span>₹${Number(summary.grossSubtotal || 0).toFixed(2)}</span></div>
        ${summary.totalDiscount > 0 ? `<div class="totals-row" style="color: #16a34a;"><span>Discount:</span><span>-₹${Number(summary.totalDiscount).toFixed(2)}</span></div>` : ''}
        <div class="totals-row"><span>Taxable Value:</span><span>₹${Number(summary.taxableSubtotal || 0).toFixed(2)}</span></div>
        <div class="totals-row"><span>CGST / SGST Total:</span><span>₹${Number(summary.totalTax || 0).toFixed(2)}</span></div>
        ${summary.roundOff !== 0 ? `<div class="totals-row"><span>Round Off:</span><span>${summary.roundOff > 0 ? '+₹' : '-₹'}${Math.abs(summary.roundOff).toFixed(2)}</span></div>` : ''}
        <div class="net-payable"><span>NET PAYABLE:</span><span>₹${Number(summary.netPayable || 0).toFixed(2)}</span></div>
      </div>
    </div>

    <div class="footer-note">
      <p style="margin: 0 0 4px 0;">${terms}</p>
      <p style="margin: 0; font-weight: 600; color: #64748b;">*** Thank you for shopping with us! ***</p>
    </div>
  </div>
</body>
</html>`;
  }

  // Thermal Roll Template (80mm or 58mm)
  const rollWidth = is58mm ? '54mm' : '76mm';
  const fontSize = is58mm ? '11px' : '12px';

  const thermalItemsHtml = items.map((it) => `
    <div style="margin-bottom: 6px;">
      <div style="display: flex; justify-content: space-between; font-weight: 600;">
        <span>${it.name || 'Product'}</span>
        <span>₹${Number(it.lineTotal || it.grossAmount || 0).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 10px; color: #555;">
        <span>${it.size || ''} ${it.color ? '• ' + it.color : ''} [${it.quantity} x ₹${Number(it.unitPrice || 0).toFixed(2)}]</span>
      </div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt #${invNum}</title>
  <style>
    @page { size: ${is58mm ? '58mm' : '80mm'} auto; margin: 2mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
      width: ${rollWidth};
      margin: 0 auto;
      padding: 6px 4px;
      font-size: ${fontSize};
      line-height: 1.35;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .dashed { border-top: 1px dashed #000; margin: 6px 0; }
    .double { border-top: 2px solid #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .net-box {
      border: 1px solid #000;
      padding: 6px;
      margin: 6px 0;
      display: flex;
      justify-content: space-between;
      font-size: ${is58mm ? '13px' : '15px'};
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="bold" style="font-size: ${is58mm ? '13px' : '16px'}; text-transform: uppercase;">${storeName}</div>
    <div style="font-size: 10px;">${tagline}</div>
    <div style="font-size: 10px;">${address}</div>
    <div style="font-size: 10px;">${cityState}</div>
    <div style="font-size: 10px;">Ph: ${phone}</div>
    <div class="bold" style="font-size: 11px; margin-top: 2px;">GSTIN: ${gstin}</div>
  </div>

  <div class="dashed"></div>

  <div class="row"><span>Bill No:</span><span class="bold">${invNum}</span></div>
  <div class="row"><span>Date:</span><span>${invDate}</span></div>
  <div class="row"><span>Customer:</span><span>${customer.name || 'Walk-in'}</span></div>
  <div class="row"><span>Mobile:</span><span>${customer.phone || 'N/A'}</span></div>
  <div class="row"><span>Cashier:</span><span>${cashier}</span></div>
  <div class="row"><span>Payment:</span><span>${payMethod}</span></div>

  <div class="dashed"></div>
  <div class="bold" style="font-size: 11px; margin-bottom: 4px;">ITEMS PURCHASED</div>

  ${thermalItemsHtml}

  <div class="dashed"></div>

  <div class="row"><span>Subtotal:</span><span>₹${Number(summary.grossSubtotal || 0).toFixed(2)}</span></div>
  ${summary.totalDiscount > 0 ? `<div class="row"><span>Discount:</span><span>-₹${Number(summary.totalDiscount).toFixed(2)}</span></div>` : ''}
  <div class="row"><span>Taxable:</span><span>₹${Number(summary.taxableSubtotal || 0).toFixed(2)}</span></div>
  <div class="row"><span>GST Total:</span><span>₹${Number(summary.totalTax || 0).toFixed(2)}</span></div>
  ${summary.roundOff !== 0 ? `<div class="row"><span>Round Off:</span><span>${summary.roundOff > 0 ? '+' : ''}₹${Number(summary.roundOff).toFixed(2)}</span></div>` : ''}

  <div class="net-box">
    <span>NET PAYABLE:</span>
    <span>₹${Number(summary.netPayable || 0).toFixed(2)}</span>
  </div>

  ${payMethod === 'Cash' && payment.changeReturned > 0 ? `
    <div class="row" style="font-size: 11px;"><span>Received / Change:</span><span>₹${payment.amountReceived} / ₹${payment.changeReturned}</span></div>
  ` : ''}

  <div class="dashed"></div>

  <div class="center" style="font-size: 10px; margin-top: 6px;">
    <div>${terms}</div>
    <div class="bold" style="margin-top: 4px;">*** THANK YOU! VISIT AGAIN ***</div>
  </div>
</body>
</html>`;
}
