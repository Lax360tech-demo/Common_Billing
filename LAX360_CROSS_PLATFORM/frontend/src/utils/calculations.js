export const round2 = (val) => {
  return Math.round((Number(val) + 2 ** -52) * 100) / 100;
};

export const calculateLineItem = (item, inclusive = true) => {
  const qty = Number(item.quantity) || 1;
  const unitPrice = Number(item.unitPrice) || 0;
  const gstRate = Number(item.gstRate ?? 5);
  const grossAmount = round2(qty * unitPrice);

  let itemDiscountAmount = 0;
  if (item.discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, Number(item.discountValue) || 0));
    itemDiscountAmount = round2((grossAmount * pct) / 100);
  } else {
    itemDiscountAmount = round2(Math.min(grossAmount, Number(item.discountValue) || 0));
  }

  const taxableBase = Math.max(0, grossAmount - itemDiscountAmount);
  let taxableAmount = 0;
  let taxAmount = 0;
  let lineTotal = 0;

  if (inclusive) {
    taxableAmount = round2(taxableBase / (1 + gstRate / 100));
    taxAmount = round2(taxableBase - taxableAmount);
    lineTotal = round2(taxableBase);
  } else {
    taxableAmount = round2(taxableBase);
    taxAmount = round2((taxableAmount * gstRate) / 100);
    lineTotal = round2(taxableAmount + taxAmount);
  }

  const cgstRate = round2(gstRate / 2);
  const sgstRate = round2(gstRate / 2);
  const cgstAmount = round2(taxAmount / 2);
  const sgstAmount = round2(taxAmount - cgstAmount);

  return {
    ...item,
    quantity: qty,
    unitPrice: round2(unitPrice),
    grossAmount: round2(grossAmount),
    itemDiscountAmount,
    taxableAmount,
    taxAmount,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    lineTotal
  };
};

export const calculateCartTotals = (
  items = [],
  billDiscount = { type: 'fixed', value: 0 },
  inclusive = true,
  couponDiscount = 0,
  festivalDiscount = 0
) => {
  if (!items || items.length === 0) {
    return {
      totalItems: 0,
      totalQuantity: 0,
      grossSubtotal: 0,
      totalItemDiscount: 0,
      billDiscountAmount: 0,
      couponDiscountAmount: 0,
      festivalDiscountAmount: 0,
      totalDiscount: 0,
      taxableSubtotal: 0,
      totalTax: 0,
      totalCGST: 0,
      totalSGST: 0,
      grandTotal: 0,
      roundOff: 0,
      netPayable: 0,
      taxBreakup: [],
      processedItems: []
    };
  }

  let totalQty = 0;
  let grossSubtotal = 0;
  let totalItemDiscount = 0;

  const processedItems = items.map((it) => {
    const processed = calculateLineItem(it, inclusive);
    totalQty += processed.quantity;
    grossSubtotal += processed.grossAmount;
    totalItemDiscount += processed.itemDiscountAmount;
    return processed;
  });

  const netAfterItemDiscount = Math.max(0, grossSubtotal - totalItemDiscount);

  let billDiscountAmount = 0;
  if (billDiscount.type === 'percent') {
    const pct = Math.min(100, Math.max(0, Number(billDiscount.value) || 0));
    billDiscountAmount = round2((netAfterItemDiscount * pct) / 100);
  } else {
    billDiscountAmount = round2(Math.min(netAfterItemDiscount, Number(billDiscount.value) || 0));
  }

  const couponDiscountAmount = round2(
    Math.min(Math.max(0, netAfterItemDiscount - billDiscountAmount), Number(couponDiscount) || 0)
  );

  const festivalDiscountAmount = round2(
    Math.min(
      Math.max(0, netAfterItemDiscount - billDiscountAmount - couponDiscountAmount),
      Number(festivalDiscount) || 0
    )
  );

  const totalBasketDiscounts = billDiscountAmount + couponDiscountAmount + festivalDiscountAmount;
  const multiplier =
    netAfterItemDiscount > 0
      ? Math.max(0, netAfterItemDiscount - totalBasketDiscounts) / netAfterItemDiscount
      : 1;

  let taxableSubtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalTax = 0;
  const taxBreakupMap = {};

  processedItems.forEach((it) => {
    const eff = round2(it.grossAmount - it.itemDiscountAmount) * multiplier;
    const rate = Number(it.gstRate) || 5;

    let taxVal = 0;
    let taxAmt = 0;

    if (inclusive) {
      taxVal = round2(eff / (1 + rate / 100));
      taxAmt = round2(eff - taxVal);
    } else {
      taxVal = round2(eff);
      taxAmt = round2((taxVal * rate) / 100);
    }

    const cgstAmt = round2(taxAmt / 2);
    const sgstAmt = round2(taxAmt - cgstAmt);

    taxableSubtotal += taxVal;
    totalCGST += cgstAmt;
    totalSGST += sgstAmt;
    totalTax += taxAmt;

    if (!taxBreakupMap[rate]) {
      taxBreakupMap[rate] = {
        rate,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        totalTax: 0
      };
    }
    taxBreakupMap[rate].taxable = round2(taxBreakupMap[rate].taxable + taxVal);
    taxBreakupMap[rate].cgst = round2(taxBreakupMap[rate].cgst + cgstAmt);
    taxBreakupMap[rate].sgst = round2(taxBreakupMap[rate].sgst + sgstAmt);
    taxBreakupMap[rate].totalTax = round2(taxBreakupMap[rate].totalTax + taxAmt);
  });

  taxableSubtotal = round2(taxableSubtotal);
  totalCGST = round2(totalCGST);
  totalSGST = round2(totalSGST);
  totalTax = round2(totalTax);

  let grandTotal = 0;
  if (inclusive) {
    grandTotal = round2(netAfterItemDiscount - totalBasketDiscounts);
  } else {
    grandTotal = round2(taxableSubtotal + totalTax);
  }

  const netPayable = Math.max(0, Math.round(grandTotal));
  const roundOff = round2(netPayable - grandTotal);

  return {
    totalItems: items.length,
    totalQuantity: totalQty,
    grossSubtotal: round2(grossSubtotal),
    totalItemDiscount: round2(totalItemDiscount),
    billDiscountAmount,
    couponDiscountAmount,
    festivalDiscountAmount,
    totalDiscount: round2(totalItemDiscount + totalBasketDiscounts),
    taxableSubtotal,
    totalTax,
    totalCGST,
    totalSGST,
    grandTotal,
    roundOff,
    netPayable,
    taxBreakup: Object.values(taxBreakupMap),
    processedItems
  };
};

export const validatePayment = (netPayable, method, paymentData = {}) => {
  const rPayable = round2(netPayable);

  if (method === 'Cash') {
    const received = Number(paymentData.amountReceived) || 0;
    if (received < rPayable) {
      return {
        valid: false,
        error: `Tendered amount (₹${received}) cannot be less than total payable (₹${rPayable}).`
      };
    }
    return {
      valid: true,
      changeReturned: round2(received - rPayable)
    };
  }

  if (method === 'UPI') {
    return {
      valid: true,
      changeReturned: 0,
      reference: paymentData.reference || `UPI/POS/${Date.now().toString().slice(-6)}`
    };
  }

  if (method === 'Card') {
    return {
      valid: true,
      changeReturned: 0,
      reference: paymentData.reference || `CARD/APPR/${Date.now().toString().slice(-4)}`
    };
  }

  if (method === 'Split') {
    const splits = paymentData.splitDetails || { cash: 0, upi: 0, card: 0 };
    const totalSplit = round2(
      (Number(splits.cash) || 0) + (Number(splits.upi) || 0) + (Number(splits.card) || 0)
    );
    if (Math.abs(totalSplit - rPayable) > 0.5) {
      return {
        valid: false,
        error: `Sum of split payments (₹${totalSplit}) must equal net payable (₹${rPayable}).`
      };
    }
    return {
      valid: true,
      changeReturned: 0,
      splitDetails: splits
    };
  }

  return { valid: true, changeReturned: 0 };
};

export const generateInvoiceNumber = (prefix = 'TEX-2026-', sequence = 1001) => {
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};
