/**
 * Shared Validation & Sanitization Helpers for Star Enterprises
 */

/**
 * Strips non-digits and leading +91 or 0 prefix to return a clean 10-digit mobile number.
 * @param {string|number} phone
 * @returns {string}
 */
export function cleanPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Validates an Indian 10-digit mobile number (starts with 6, 7, 8, or 9).
 * @param {string|number} phone
 * @returns {boolean}
 */
export function isValidIndianPhone(phone) {
  const cleaned = cleanPhone(phone);
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validates standard Indian GSTIN format (15 characters alphanumeric).
 * @param {string} gstin
 * @returns {boolean}
 */
export function isValidGstin(gstin) {
  if (!gstin) return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    String(gstin).trim().toUpperCase()
  );
}

/**
 * Validates email address format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}

/**
 * Validates 15-digit IMEI number for mobile phones.
 * @param {string} imei
 * @returns {boolean}
 */
export function isValidImei(imei) {
  if (!imei) return false;
  return /^\d{15}$/.test(String(imei).trim());
}

/**
 * Validates 6-digit Indian PIN code.
 * @param {string|number} pin
 * @returns {boolean}
 */
export function isValidPincode(pin) {
  if (!pin) return false;
  return /^[1-9]\d{5}$/.test(String(pin).trim());
}

/**
 * Validates 12-digit Indian Aadhaar number.
 * @param {string} aadhaar
 * @returns {boolean}
 */
export function isValidAadhaar(aadhaar) {
  if (!aadhaar) return false;
  const digits = String(aadhaar).replace(/\D/g, '');
  return /^\d{12}$/.test(digits);
}

