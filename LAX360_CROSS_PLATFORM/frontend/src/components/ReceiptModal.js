import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { downloadInvoicePdf } from '../utils/invoiceDownloader';
import { generateReceiptHtml } from '../utils/receiptHtmlGenerator';

export const ReceiptModal = ({ visible, onClose, invoice }) => {
  const { activeTheme } = useTheme();
  const { settings } = useSettings();
  const colors = activeTheme.colors;

  const defaultPaper = settings?.billing?.defaultPaperSize || '80mm';
  const [paperSize, setPaperSize] = useState(defaultPaper);
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [printStatus, setPrintStatus] = useState('');

  useEffect(() => {
    if (visible && window.electronPrinter?.getPrinters) {
      window.electronPrinter.getPrinters()
        .then((list) => {
          if (Array.isArray(list) && list.length > 0) {
            setPrinters(list);
            const defaultP = list.find((p) => p.isDefault) || list[0];
            setSelectedPrinter(defaultP.name);
          }
        })
        .catch((e) => console.warn('Could not enumerate printers:', e));
    }
  }, [visible]);

  if (!invoice) return null;

  const summary = invoice.summary || {};
  const items = invoice.items || [];
  const customer = invoice.customer || {};
  const store = settings?.store || {};

  const handleDirectPrint = async (silent = true) => {
    const html = generateReceiptHtml(invoice, settings, paperSize);
    if (window.electronPrinter?.printBill) {
      setPrintStatus(silent ? `Printing to ${selectedPrinter || 'default'}...` : 'Opening print dialog...');
      try {
        const res = await window.electronPrinter.printBill({
          html,
          printerName: selectedPrinter,
          silent,
          paperSize
        });
        if (res?.success) {
          setPrintStatus('✓ Printed successfully!');
        } else if (res?.failureReason) {
          setPrintStatus('Print failed: ' + res.failureReason);
        } else {
          setPrintStatus('');
        }
      } catch (err) {
        setPrintStatus('Error: ' + err.message);
      }
      setTimeout(() => setPrintStatus(''), 4000);
    } else {
      // Browser fallback: open print window with isolated receipt HTML
      const win = window.open('', '_blank', 'width=800,height=900');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 350);
      } else if (typeof window !== 'undefined' && window.print) {
        window.print();
      }
    }
  };

  const handleOpenWindowPreview = () => {
    const html = generateReceiptHtml(invoice, settings, paperSize);
    if (window.electronPrinter?.openPreviewWindow) {
      window.electronPrinter.openPreviewWindow({ html, paperSize });
    } else {
      const win = window.open('', '_blank', 'width=800,height=900');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    }
  };

  const handleDownload = () => {
    downloadInvoicePdf(invoice, settings);
  };

  const isA4 = paperSize === 'A4';
  const is58mm = paperSize === '58mm';
  const previewWidth = isA4 ? 720 : is58mm ? 290 : 380;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgCard || '#FFFFFF' }]}>
          {/* Header Bar */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border || '#E2E8F0' }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                Invoice Preview • {invoice.invoiceNumber}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                Live Bill Preview — Ready to Print
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Printer Selector */}
              {printers.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted }}>Printer:</Text>
                  <select
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${colors.border || '#cbd5e1'}`,
                      backgroundColor: colors.bgMain || '#f8fafc',
                      color: colors.textMain || '#0f172a',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      maxWidth: '220px'
                    }}
                  >
                    {printers.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.displayName} {p.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </View>
              )}

              {/* Paper Format Selector */}
              <View style={styles.formatSelector}>
                {['80mm', 'A4', '58mm'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeBtn,
                      {
                        backgroundColor:
                          paperSize === size ? colors.primary : colors.bgMain || '#F1F5F9',
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => setPaperSize(size)}
                  >
                    <Text
                      style={[
                        styles.sizeBtnText,
                        { color: paperSize === size ? '#FFFFFF' : colors.textMain }
                      ]}
                    >
                      {size === 'A4' ? 'A4 Invoice' : `${size} Thermal`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={{ fontSize: 18, color: colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Printable Receipt Preview ScrollView */}
          <ScrollView style={styles.previewContainer} contentContainerStyle={styles.previewContent}>
            <View
              style={[
                styles.receiptPaper,
                {
                  width: previewWidth,
                  borderColor: '#E2E8F0',
                  borderWidth: 1,
                  backgroundColor: '#FFFFFF'
                }
              ]}
              id="printable-invoice"
            >
              {/* Store Brand */}
              <View style={styles.storeHeader}>
                <Text style={styles.storeName}>{store.storeName || 'Lady Avenue Showroom'}</Text>
                <Text style={styles.storeAddress}>{store.tagline}</Text>
                <Text style={styles.storeAddress}>{store.address}</Text>
                <Text style={styles.storeAddress}>
                  {store.city}, {store.state} - {store.pincode}
                </Text>
                <Text style={styles.storeAddress}>Phone: {store.phone}</Text>
                <Text style={styles.storeGSTIN}>GSTIN: {store.gstin}</Text>
              </View>

              <View style={styles.divider} />

              {/* Bill Details */}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Bill No: {invoice.invoiceNumber}</Text>
                <Text style={styles.metaText}>
                  Date: {invoice.date ? new Date(invoice.date).toLocaleDateString() : ''}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Customer: {customer.name || 'Walk-in'}</Text>
                <Text style={styles.metaText}>Mobile: {customer.phone || 'N/A'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Cashier: {invoice.cashier || 'Admin'}</Text>
                <Text style={styles.metaText}>Mode: {invoice.payment?.method || 'Cash'}</Text>
              </View>

              <View style={styles.divider} />

              {/* Items Table */}
              <View style={styles.tableHeader}>
                <Text style={[styles.colItem, styles.bold]}>Item Description</Text>
                <Text style={[styles.colQty, styles.bold, styles.center]}>Qty</Text>
                <Text style={[styles.colRate, styles.bold, styles.right]}>Rate</Text>
                <Text style={[styles.colAmount, styles.bold, styles.right]}>Amount</Text>
              </View>

              {items.map((it, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <View style={styles.colItem}>
                    <Text style={styles.itemName}>{it.name}</Text>
                    <Text style={styles.itemVariant}>
                      {it.size} • {it.color} {it.sku ? `(${it.sku})` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.colQty, styles.center]}>{it.quantity}</Text>
                  <Text style={[styles.colRate, styles.right]}>₹{it.unitPrice}</Text>
                  <Text style={[styles.colAmount, styles.right, styles.bold]}>
                    ₹{it.lineTotal || it.grossAmount}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />

              {/* Bill Summary */}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Gross Subtotal:</Text>
                <Text style={styles.summaryVal}>₹{summary.grossSubtotal || 0}</Text>
              </View>
              {summary.totalDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Discount:</Text>
                  <Text style={styles.summaryVal}>-₹{summary.totalDiscount}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxable Amount:</Text>
                <Text style={styles.summaryVal}>₹{summary.taxableSubtotal || 0}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CGST / SGST Total:</Text>
                <Text style={styles.summaryVal}>₹{summary.totalTax || 0}</Text>
              </View>
              {summary.roundOff !== 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Round Off:</Text>
                  <Text style={styles.summaryVal}>{summary.roundOff > 0 ? `+₹${summary.roundOff}` : `-₹${Math.abs(summary.roundOff)}`}</Text>
                </View>
              )}

              <View style={[styles.divider, { borderStyle: 'solid', borderWidth: 1 }]} />

              <View style={styles.netPayableRow}>
                <Text style={styles.netPayableLabel}>NET AMOUNT PAYABLE:</Text>
                <Text style={styles.netPayableVal}>₹{summary.netPayable || 0}</Text>
              </View>

              {/* Change returned if cash */}
              {invoice.payment?.method === 'Cash' && invoice.payment?.changeReturned > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tendered / Change Returned:</Text>
                  <Text style={styles.summaryVal}>
                    ₹{invoice.payment.amountReceived} / ₹{invoice.payment.changeReturned}
                  </Text>
                </View>
              )}

              {/* Generated Loyalty Coupon banner */}
              {invoice.generated_coupon && (
                <View style={styles.couponNotice}>
                  <Text style={styles.couponNoticeTitle}>🎉 LOYALTY COUPON EARNED!</Text>
                  <Text style={styles.couponNoticeCode}>{invoice.generated_coupon.code}</Text>
                  <Text style={styles.couponNoticeDesc}>{invoice.generated_coupon.description}</Text>
                </View>
              )}

              {/* Terms and Footer */}
              <View style={styles.termsBox}>
                <Text style={styles.termsText}>{settings?.billing?.termsAndConditions}</Text>
                <Text style={styles.thankYouText}>*** Thank you for shopping with us! ***</Text>
              </View>
            </View>
          </ScrollView>

          {/* Modal Actions Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border || '#E2E8F0' }]}>
            {/* Bottom Left Corner: Download & Window Preview */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleDownload}
                style={[styles.downloadBtn, { backgroundColor: '#10B981' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.downloadBtnText}>📥 Download PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenWindowPreview}
                style={[styles.actionBtn, { backgroundColor: colors.bgMain || '#F1F5F9', borderWidth: 1, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMain }}>🔍 Window Preview</Text>
              </TouchableOpacity>
            </View>

            {/* Center Status */}
            {printStatus ? (
              <View style={[styles.statusBadge, { backgroundColor: printStatus.includes('✓') ? '#DCFCE7' : '#FEF3C7' }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: printStatus.includes('✓') ? '#166534' : '#92400E' }}>
                  {printStatus}
                </Text>
              </View>
            ) : null}

            {/* Bottom Right Actions */}
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TouchableOpacity onPress={onClose} style={[styles.actionBtn, styles.cancelBtn]}>
                <Text style={{ fontWeight: '600', color: colors.textMain }}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDirectPrint(false)}
                style={[styles.actionBtn, { backgroundColor: colors.bgMain || '#F1F5F9', borderWidth: 1, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Text style={{ fontWeight: '600', color: colors.textMain }}>⚙️ Print Dialog</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDirectPrint(true)}
                style={[styles.actionBtn, { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }]}
                activeOpacity={0.8}
              >
                <Text style={{ fontWeight: '800', color: '#FFFFFF', fontSize: 13 }}>🖨️ Print Direct (Ready)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 860,
    maxHeight: '92%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  modalSubtitle: {
    fontSize: 12
  },
  formatSelector: {
    flexDirection: 'row',
    gap: 6
  },
  sizeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  sizeBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  closeBtn: {
    padding: 6
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  previewContent: {
    padding: 20,
    alignItems: 'center'
  },
  receiptPaper: {
    padding: 16,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  storeHeader: {
    alignItems: 'center',
    marginBottom: 10
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center'
  },
  storeAddress: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center'
  },
  storeGSTIN: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: '#CBD5E1',
    marginVertical: 8
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2
  },
  metaText: {
    fontSize: 11,
    color: '#334155'
  },
  tableHeader: {
    flexDirection: 'row',
    marginVertical: 4
  },
  tableRow: {
    flexDirection: 'row',
    marginVertical: 4
  },
  colItem: { flex: 4 },
  colQty: { flex: 1 },
  colRate: { flex: 1.5 },
  colAmount: { flex: 2 },
  bold: { fontWeight: '700' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  itemName: { fontSize: 12, fontWeight: '600', color: '#0F172A' },
  itemVariant: { fontSize: 10, color: '#64748B' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2
  },
  summaryLabel: { fontSize: 11, color: '#475569' },
  summaryVal: { fontSize: 11, fontWeight: '600', color: '#0F172A' },
  netPayableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
    alignItems: 'center'
  },
  netPayableLabel: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  netPayableVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  couponNotice: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 8
  },
  couponNoticeTitle: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  couponNoticeCode: { fontSize: 14, fontWeight: '900', color: '#B45309', marginVertical: 2 },
  couponNoticeDesc: { fontSize: 10, color: '#92400E' },
  termsBox: { marginTop: 12, alignItems: 'center' },
  termsText: { fontSize: 9, color: '#64748B', textAlign: 'center', fontStyle: 'italic' },
  thankYouText: { fontSize: 11, fontWeight: '700', color: '#0F172A', marginTop: 6 },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  downloadBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  }
});
