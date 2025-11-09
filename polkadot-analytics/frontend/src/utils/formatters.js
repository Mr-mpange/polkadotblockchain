/**
 * Format a number as currency
 * @param {number|string} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, decimals = 2) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '$0.00';
  
  // Format large numbers with K, M, B, T suffixes
  const formatLargeNumber = (num, dec) => {
    const lookup = [
      { value: 1, symbol: '' },
      { value: 1e3, symbol: 'K' },
      { value: 1e6, symbol: 'M' },
      { value: 1e9, symbol: 'B' },
      { value: 1e12, symbol: 'T' },
    ];
    
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    const item = lookup.slice().reverse().find(item => num >= item.value);
    
    return item 
      ? `$${(num / item.value).toFixed(dec).replace(rx, '$1')}${item.symbol}`
      : '$0';
  };

  // For values less than 1, show more decimal places
  if (Math.abs(numValue) < 1) {
    return `$${numValue.toFixed(4).replace(/\.?0+$/, '')}`;
  }
  
  // For values less than 1000, show 2 decimal places
  if (Math.abs(numValue) < 1000) {
    return `$${numValue.toFixed(2).replace(/\.?0+$/, '')}`;
  }
  
  // For larger values, use the appropriate suffix
  return formatLargeNumber(numValue, decimals);
}

/**
 * Format a number as a percentage
 * @param {number|string} value - The value to format (e.g., 5 for 5%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 2) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0.00%';
  
  return `${numValue.toFixed(decimals)}%`;
}

/**
 * Format a large number with commas
 * @param {number|string} value - The number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(value) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  return numValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

/**
 * Format a date string or timestamp
 * @param {string|number|Date} date - The date to format
 * @param {string} format - Date format string (using date-fns format)
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'MMM d, yyyy') {
  try {
    const { format: dateFnsFormat } = require('date-fns');
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateFnsFormat(dateObj, format);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a duration in milliseconds to a human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

/**
 * Truncate a string to a specified length and add an ellipsis
 * @param {string} str - The string to truncate
 * @param {number} length - Maximum length before truncation
 * @param {string} ellipsis - The ellipsis character(s) to use
 * @returns {string} Truncated string
 */
export function truncateString(str, length = 20, ellipsis = '...') {
  if (!str || str.length <= length) return str;
  return `${str.substring(0, length)}${ellipsis}`;
}

/**
 * Format an address to show first and last few characters
 * @param {string} address - The address to format
 * @param {number} start - Number of characters to show at the start
 * @param {number} end - Number of characters to show at the end
 * @returns {string} Formatted address
 */
export function formatAddress(address, start = 6, end = 4) {
  if (!address || address.length < start + end) return address;
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}
