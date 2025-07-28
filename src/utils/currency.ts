/**
 * Currency utility functions for Ethiopian Birr (ETB)
 */

/**
 * Format a number as Ethiopian Birr currency
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the ETB symbol (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | string, showSymbol: boolean = true): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return showSymbol ? 'ETB 0.00' : '0.00';
  }
  
  const formatted = numAmount.toFixed(2);
  return showSymbol ? `ETB ${formatted}` : formatted;
};

/**
 * Format currency for display in tables or compact spaces
 * @param amount - The amount to format
 * @returns Formatted currency string with ETB prefix
 */
export const formatCurrencyCompact = (amount: number | string): string => {
  return formatCurrency(amount, true);
};

/**
 * Parse a currency string to number
 * @param currencyString - String like "ETB 123.45" or "123.45"
 * @returns Parsed number
 */
export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Currency symbol constant
 */
export const CURRENCY_SYMBOL = 'ETB';

/**
 * Currency name constant
 */
export const CURRENCY_NAME = 'Ethiopian Birr';