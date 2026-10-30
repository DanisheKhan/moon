/**
 * Formats a numeric amount to Indian Rupee representation rounded to whole rupees (e.g. ₹ 45,999).
 * Decimals are rounded off to eliminate fractional pennies and floating-point precision leaks.
 * @param {number|string|null|undefined} amount
 * @param {boolean} [_showDecimals=false]
 * @returns {string}
 */
export function formatCurrency(amount, _showDecimals = false) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  if (isNaN(num)) return '₹0';

  const rounded = Math.round(num);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
}

/**
 * Formats an ISO date string to readable format (e.g., "15 Oct 2026, 03:45 PM").
 * @param {string|Date|null|undefined} dateInput
 * @param {boolean} [includeTime=true]
 * @returns {string}
 */
export function formatDate(dateInput, includeTime = true) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
  };

  return new Intl.DateTimeFormat('en-IN', options).format(d);
}

/**
 * Formats an Indian phone number cleanly.
 * @param {string|null|undefined} phone
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone) return '-';
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Converts a numerical amount into Indian currency words representation.
 * @param {number|string|null|undefined} amount
 * @returns {string}
 */
export function amountToWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelowThousand(n) {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  let crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  let thousand = Math.floor(remainder / 1000);
  let belowThousand = remainder % 1000;

  const parts = [];
  if (crore > 0) parts.push(convertBelowThousand(crore) + ' Crore');
  if (lakh > 0) parts.push(convertBelowThousand(lakh) + ' Lakh');
  if (thousand > 0) parts.push(convertBelowThousand(thousand) + ' Thousand');
  if (belowThousand > 0) parts.push(convertBelowThousand(belowThousand));

  return parts.join(' ') + ' Rupees Only';
}

