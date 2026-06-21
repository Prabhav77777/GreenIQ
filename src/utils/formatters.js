/**
 * Number and Date Formatting Utilities
 */

/**
 * Format a number with Indian locale (commas at lakhs/crores)
 * @param {number} num - Number to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(num, decimals = 1) {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

/**
 * Format CO2 value with appropriate unit
 * @param {number} kgCO2 - Value in kgCO2
 * @returns {string} Formatted string with unit
 */
export function formatCO2(kgCO2) {
  if (typeof kgCO2 !== 'number' || isNaN(kgCO2)) return '0 kg';
  if (kgCO2 >= 1000) {
    return `${formatNumber(kgCO2 / 1000)} t`;
  }
  return `${formatNumber(kgCO2, 0)} kg`;
}

/**
 * Format a date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
}

export function formatDateTime(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format percentage change with arrow
 * @param {number} percent - Percentage change
 * @returns {{ text: string, direction: 'up'|'down'|'neutral' }}
 */
export function formatChange(percent) {
  if (typeof percent !== 'number' || isNaN(percent)) {
    return { text: '—', direction: 'neutral' };
  }
  if (percent > 0) {
    return { text: `↑ ${Math.abs(percent)}%`, direction: 'up' };
  }
  if (percent < 0) {
    return { text: `↓ ${Math.abs(percent)}%`, direction: 'down' };
  }
  return { text: '→ 0%', direction: 'neutral' };
}
