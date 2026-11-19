export const formatCurrency = (amount, currency = '₹') => {
  const num = Number(amount) || 0;
  return `${currency}${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateOnly = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDate = (dateStr) => {
  return formatDateOnly(dateStr);
};

export const formatNumber = (val) => {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN');
};

export const formatUnitQty = (qty, unit = 'pcs') => {
  const num = Number(qty) || 0;
  const isFractional = ['kg', 'gm', 'ltr', 'ml', 'metre', 'hour'].includes(String(unit).toLowerCase());
  return `${isFractional ? num.toFixed(2) : Math.round(num)} ${unit}`;
};


