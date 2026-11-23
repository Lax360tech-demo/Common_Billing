import { jsPDF } from 'jspdf';

/**
 * Downloads a professionally formatted PDF Tax Invoice directly to the user's device.
 * @param {Object} invoice - The invoice data object
 * @param {Object} storeSettings - Store & showroom settings
 */
export function downloadInvoicePdf(invoice, storeSettings = {}) {
  if (!invoice) return;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const store = storeSettings?.store || {};
    const billing = storeSettings?.billing || {};
    const storeName = store.storeName || 'Lady Avenue Showroom';
    const tagline = store.tagline || 'Retail & Apparel Showroom';
    const address = store.address || '42, Tech Park Boulevard, Sector 5';
    const cityState = `${store.city || 'Salem'}, ${store.state || 'Tamil Nadu'} - ${store.pincode || '636001'}`;
    const phone = store.phone || '+91 98412 34567';
    const gstin = store.gstin || '33AABCL3601K1ZM';

    const invNum = invoice.invoiceNumber || invoice.invoice_number || 'TEX-2026';
    const invDate = invoice.date ? new Date(invoice.date).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
    const customer = invoice.customer || {};
    const items = invoice.items || [];
    const summary = invoice.summary || {};
    const payment = invoice.payment || {};

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 14;

    // Header Background Accent
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Store Name & Brand Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(storeName.toUpperCase(), 14, y);

    // Document Title on Right
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text('GST TAX INVOICE', pageWidth - 14, y, { align: 'right' });
    y += 5;

    // Store Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(tagline, 14, y);
    doc.text(`Invoice No: ${invNum}`, pageWidth - 14, y, { align: 'right' });
    y += 4;

    doc.text(`${address}, ${cityState}`, 14, y);
    doc.text(`Date & Time: ${invDate}`, pageWidth - 14, y, { align: 'right' });
    y += 4;

    doc.text(`Phone: ${phone} | GSTIN: ${gstin}`, 14, y);
    const payMethod = payment.method || invoice.payment_method || 'Cash';
    doc.text(`Payment Mode: ${payMethod}`, pageWidth - 14, y, { align: 'right' });
    y += 6;

    // Divider Line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.4);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    // Customer & Bill Details Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('BILLED TO (CUSTOMER DETAILS):', 18, y + 5);
    doc.text('BILLING METADATA:', (pageWidth / 2) + 10, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const custName = customer.name || 'Walk-in Customer';
    const custPhone = customer.phone ? `Phone: ${customer.phone}` : 'Phone: N/A';
    doc.text(`${custName} • ${custPhone}`, 18, y + 11);

    const cashier = invoice.cashier || 'Admin Store Manager';
    doc.text(`Cashier: ${cashier} | Type: ${customer.type || 'Retail'}`, (pageWidth / 2) + 10, y + 11);
    y += 22;

    // Items Table Header
    const colX = {
      sno: 16,
      item: 28,
      qty: 110,
      rate: 135,
      tax: 158,
      total: pageWidth - 16
    };

    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y + 8, pageWidth - 14, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('#', colX.sno, y + 5.5);
    doc.text('ITEM DESCRIPTION', colX.item, y + 5.5);
    doc.text('QTY', colX.qty, y + 5.5, { align: 'center' });
    doc.text('RATE (Rs.)', colX.rate, y + 5.5, { align: 'right' });
    doc.text('TAX', colX.tax, y + 5.5, { align: 'right' });
    doc.text('AMOUNT (Rs.)', colX.total, y + 5.5, { align: 'right' });
    y += 10;

    // Items List
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    items.forEach((it, index) => {
      // Check page overflow
      if (y > 250) {
        doc.addPage();
        y = 15;
      }

      const isEven = index % 2 === 0;
      if (isEven) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 2.5, pageWidth - 28, 8, 'F');
      }

      doc.setTextColor(71, 85, 105);
      doc.text(String(index + 1), colX.sno, y + 2.5);

      // Item Name & Variant
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const itemName = it.name || it.product_name || 'Apparel Item';
      doc.text(itemName.substring(0, 42), colX.item, y + 1);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      const variantDesc = [it.size, it.color, it.sku ? `SKU: ${it.sku}` : ''].filter(Boolean).join(' • ');
      doc.text(variantDesc, colX.item, y + 4.5);

      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const qty = it.quantity || it.qty || 1;
      doc.text(String(qty), colX.qty, y + 2.5, { align: 'center' });

      const rate = Number(it.unitPrice || it.unit_price || it.price || 0).toFixed(2);
      doc.text(rate, colX.rate, y + 2.5, { align: 'right' });

      const taxRate = it.gstRate ? `${it.gstRate}%` : '5%';
      doc.text(taxRate, colX.tax, y + 2.5, { align: 'right' });

      const lineTotal = Number(it.lineTotal || it.grossAmount || (qty * Number(rate))).toFixed(2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(lineTotal, colX.total, y + 2.5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      y += 8;
    });

    // Divider Line
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, pageWidth - 14, y);
    y += 5;

    // Summary Totals Calculation
    const grossSubtotal = Number(summary.grossSubtotal || invoice.subtotal || 0).toFixed(2);
    const totalDiscount = Number(summary.totalDiscount || invoice.discount || 0).toFixed(2);
    const taxableSubtotal = Number(summary.taxableSubtotal || (Number(grossSubtotal) - Number(totalDiscount))).toFixed(2);
    const totalTax = Number(summary.totalTax || invoice.tax_amount || 0).toFixed(2);
    const roundOff = Number(summary.roundOff || 0).toFixed(2);
    const netPayable = Number(summary.netPayable || invoice.grand_total || grossSubtotal).toFixed(2);

    // Summary Box (Right aligned)
    const summaryX = pageWidth - 90;
    const summaryValX = pageWidth - 16;

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Gross Subtotal:', summaryX, y);
    doc.text(`Rs. ${grossSubtotal}`, summaryValX, y, { align: 'right' });
    y += 4.5;

    if (Number(totalDiscount) > 0) {
      doc.setTextColor(220, 38, 38); // red
      doc.text('Total Discount:', summaryX, y);
      doc.text(`- Rs. ${totalDiscount}`, summaryValX, y, { align: 'right' });
      y += 4.5;
    }

    doc.setTextColor(71, 85, 105);
    doc.text('Taxable Value:', summaryX, y);
    doc.text(`Rs. ${taxableSubtotal}`, summaryValX, y, { align: 'right' });
    y += 4.5;

    doc.text('CGST + SGST:', summaryX, y);
    doc.text(`Rs. ${totalTax}`, summaryValX, y, { align: 'right' });
    y += 4.5;

    if (Number(roundOff) !== 0) {
      doc.text('Round Off:', summaryX, y);
      doc.text(`Rs. ${roundOff}`, summaryValX, y, { align: 'right' });
      y += 4.5;
    }

    // Net Payable Highlight Box
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.roundedRect(summaryX - 4, y - 1, (pageWidth - summaryX) - 10, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text('NET PAYABLE:', summaryX, y + 4.5);
    doc.text(`Rs. ${netPayable}`, summaryValX, y + 4.5, { align: 'right' });
    y += 14;

    // Generated Loyalty coupon banner if available
    if (invoice.generated_coupon) {
      doc.setFillColor(254, 243, 199); // amber-100
      doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text(`* Loyalty Reward: ${invoice.generated_coupon.code} (${invoice.generated_coupon.description})`, 18, y + 6);
      y += 14;
    }

    // Terms & Conditions Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    const terms = billing.termsAndConditions || 'Goods once sold cannot be returned without original cash receipt. Exchange within 7 days.';
    doc.text(terms, 14, y);
    y += 4;
    doc.text('*** Thank you for shopping with us! Please visit again. ***', pageWidth / 2, y + 2, { align: 'center' });

    // Save PDF directly to the device
    const filename = `Invoice_${invNum.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    doc.save(filename);
    return true;
  } catch (error) {
    console.warn('[invoiceDownloader] jsPDF generation error, falling back to HTML download:', error);
    return downloadInvoiceHtmlFallback(invoice, storeSettings);
  }
}

/**
 * Clean fallback that creates an HTML invoice document and downloads to the device.
 */
function downloadInvoiceHtmlFallback(invoice, storeSettings = {}) {
  try {
    const invNum = invoice.invoiceNumber || invoice.invoice_number || 'TEX-2026';
    const store = storeSettings?.store || {};
    const storeName = store.storeName || 'Lady Avenue Showroom';
    const items = invoice.items || [];
    const summary = invoice.summary || {};

    const itemsRows = items.map((it, idx) => `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;"><strong>${it.name || 'Item'}</strong><br><small style="color: #64748b;">${it.size || ''} ${it.color || ''}</small></td>
        <td style="padding: 6px; text-align: center; border-bottom: 1px solid #e2e8f0;">${it.quantity || 1}</td>
        <td style="padding: 6px; text-align: right; border-bottom: 1px solid #e2e8f0;">Rs. ${Number(it.unitPrice || 0).toFixed(2)}</td>
        <td style="padding: 6px; text-align: right; border-bottom: 1px solid #e2e8f0;">Rs. ${Number(it.lineTotal || it.grossAmount || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${invNum}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; color: #1e293b; background: #fff; }
    .box { max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th { background: #f1f5f9; padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e1; }
    .totals { width: 280px; margin-left: auto; font-size: 13px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .net-payable { background: #e0e7ff; color: #3730a3; font-weight: bold; font-size: 16px; padding: 8px; border-radius: 4px; margin-top: 8px; }
    @media print { body { padding: 0; } .box { border: none; } }
  </style>
</head>
<body>
  <div class="box">
    <div class="header">
      <div>
        <h2 style="margin: 0; color: #0f172a;">${storeName}</h2>
        <p style="margin: 4px 0; color: #64748b; font-size: 12px;">${store.tagline || ''}</p>
        <p style="margin: 2px 0; color: #64748b; font-size: 12px;">${store.address || ''} Phone: ${store.phone || ''}</p>
        <p style="margin: 2px 0; color: #64748b; font-size: 12px;">GSTIN: ${store.gstin || ''}</p>
      </div>
      <div style="text-align: right;">
        <h3 style="margin: 0; color: #4f46e5;">TAX INVOICE</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>#${invNum}</strong></p>
        <p style="margin: 2px 0; font-size: 12px; color: #64748b;">${new Date(invoice.date || Date.now()).toLocaleString()}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Item Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>Gross Subtotal:</span><span>Rs. ${Number(summary.grossSubtotal || 0).toFixed(2)}</span></div>
      <div class="total-row"><span>Discount:</span><span>- Rs. ${Number(summary.totalDiscount || 0).toFixed(2)}</span></div>
      <div class="total-row"><span>CGST / SGST:</span><span>Rs. ${Number(summary.totalTax || 0).toFixed(2)}</span></div>
      <div class="total-row net-payable"><span>NET PAYABLE:</span><span>Rs. ${Number(summary.netPayable || 0).toFixed(2)}</span></div>
    </div>
    <div style="margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
      *** Thank you for shopping with us! ***
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invNum.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Invoice download failed:', err);
    return false;
  }
}
