/**
 * format.js - Currency and number formatting utilities for SolarCalc PH
 * Philippine Peso formatting and other display helpers
 */

/**
 * Format a number as Philippine Peso currency
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string (e.g., "₱146,000.00")
 */
export function formatPeso(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  
  if (!isFinite(value)) {
    return '—';
  }
  
  // Handle negative values
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);
  
  const formatted = absoluteValue.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return isNegative ? `-₱${formatted}` : `₱${formatted}`;
}

/**
 * Format a number as Philippine Peso without decimals (for whole amounts)
 * @param {number} value - The number to format
 * @returns {string} Formatted currency string without decimals (e.g., "₱146,000")
 */
export function formatPesoWhole(value) {
  return formatPeso(value, 0);
}

/**
 * Format a number as percentage
 * @param {number} value - The percentage value (e.g., 25.7 for 25.7%)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string (e.g., "25.7%")
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  
  if (!isFinite(value)) {
    return '—';
  }
  
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number as years
 * @param {number} value - The number of years
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted years string (e.g., "3.9 years")
 */
export function formatYears(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  
  if (!isFinite(value)) {
    return '—';
  }
  
  const formatted = value.toFixed(decimals);
  return `${formatted} years`;
}

/**
 * Format a number with comma separators
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number string (e.g., "1,234,567")
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  
  if (!isFinite(value)) {
    return '—';
  }
  
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format a number with unit suffix
 * @param {number} value - The number to format
 * @param {string} unit - The unit suffix (e.g., "kW", "kWh", "hrs")
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted string with unit (e.g., "10.5 kW")
 */
export function formatWithUnit(value, unit, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  
  if (!isFinite(value)) {
    return '—';
  }
  
  const formatted = value.toFixed(decimals);
  return `${formatted} ${unit}`;
}

/**
 * Parse a formatted peso string back to a number
 * @param {string} value - The formatted string (e.g., "₱146,000.00" or "146000")
 * @returns {number|null} Parsed number or null if invalid
 */
export function parsePeso(value) {
  if (typeof value !== 'string') {
    return typeof value === 'number' ? value : null;
  }
  
  // Remove ₱ symbol, commas, and whitespace
  const cleaned = value.replace(/[₱,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse a percentage string back to a number
 * @param {string} value - The percentage string (e.g., "25.7%")
 * @returns {number|null} Parsed number or null if invalid
 */
export function parsePercent(value) {
  if (typeof value !== 'string') {
    return typeof value === 'number' ? value : null;
  }
  
  const cleaned = value.replace(/%/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format input value for display in input fields
 * Preserves the value but removes any formatting for editing
 * @param {number} value - The number value
 * @returns {string} Plain number string suitable for input
 */
export function formatForInput(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  
  return String(value);
}

/**
 * Round a number to a specified precision
 * @param {number} value - The number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded number
 */
export function round(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Clamp a number between min and max values
 * @param {number} value - The number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a large number in a compact form (e.g., "1.5M", "2.3K")
 * @param {number} value - The number to format
 * @returns {string} Compact formatted string
 */
export function formatCompact(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000) {
    return `₱${(value / 1000000).toFixed(1)}M`;
  }
  
  if (absValue >= 1000) {
    return `₱${(value / 1000).toFixed(1)}K`;
  }
  
  return formatPeso(value);
}

// Default export
export default {
  formatPeso,
  formatPesoWhole,
  formatPercent,
  formatYears,
  formatNumber,
  formatWithUnit,
  parsePeso,
  parsePercent,
  formatForInput,
  round,
  clamp,
  formatCompact
};
