/**
 * Serial Number Generation Utility
 * Generates customizable serial numbers for order packages
 */

export interface SerialNumberConfig {
  prefix: string;        // String prefix (e.g., "PKG", "ORD", "LAU")
  randomDigits: number;  // Number of random digits (1-5)
  separator?: string;    // Optional separator between prefix and number (default: "")
}

/**
 * Default configuration for serial numbers
 */
export const DEFAULT_SERIAL_CONFIG: SerialNumberConfig = {
  prefix: "PKG",
  randomDigits: 4,
  separator: ""
};

/**
 * Generate a random number with specified number of digits
 * @param digits - Number of digits (1-5)
 * @returns Random number string with leading zeros if needed
 */
const generateRandomNumber = (digits: number): string => {
  if (digits < 1 || digits > 5) {
    throw new Error("Random digits must be between 1 and 5");
  }
  
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  
  return randomNum.toString().padStart(digits, '0');
};

/**
 * Generate a serial number based on configuration
 * @param config - Serial number configuration
 * @returns Generated serial number
 */
export const generateSerialNumber = (config: SerialNumberConfig = DEFAULT_SERIAL_CONFIG): string => {
  const { prefix, randomDigits, separator = "" } = config;
  
  // Validate inputs
  if (!prefix || prefix.length === 0) {
    throw new Error("Prefix cannot be empty");
  }
  
  if (randomDigits < 1 || randomDigits > 5) {
    throw new Error("Random digits must be between 1 and 5");
  }
  
  // Check total length doesn't exceed reasonable limits
  const totalLength = prefix.length + separator.length + randomDigits;
  if (totalLength > 10) {
    throw new Error("Total serial number length cannot exceed 10 characters");
  }
  
  const randomPart = generateRandomNumber(randomDigits);
  return `${prefix}${separator}${randomPart}`;
};

/**
 * Generate an order ID with 3-digit number + string
 * @param suffix - String suffix for the order ID
 * @returns Generated order ID
 */
export const generateOrderId = (suffix: string = "ORD"): string => {
  if (!suffix || suffix.length === 0) {
    throw new Error("Suffix cannot be empty");
  }
  
  // Generate 3-digit random number (100-999)
  const randomNum = Math.floor(Math.random() * 900) + 100;
  return `${randomNum}${suffix}`;
};

/**
 * Validate serial number format
 * @param serialNumber - Serial number to validate
 * @param config - Expected configuration
 * @returns True if valid, false otherwise
 */
export const validateSerialNumber = (serialNumber: string, config: SerialNumberConfig): boolean => {
  const { prefix, randomDigits, separator = "" } = config;
  const expectedLength = prefix.length + separator.length + randomDigits;
  
  if (serialNumber.length !== expectedLength) {
    return false;
  }
  
  if (!serialNumber.startsWith(prefix + separator)) {
    return false;
  }
  
  const numberPart = serialNumber.slice(prefix.length + separator.length);
  return /^\d+$/.test(numberPart) && numberPart.length === randomDigits;
};

/**
 * Predefined serial number configurations
 */
export const SERIAL_CONFIGS = {
  PACKAGE: { prefix: "PKG", randomDigits: 4, separator: "" },      // PKG1234
  LAUNDRY: { prefix: "LAU", randomDigits: 3, separator: "-" },     // LAU-123
  ORDER: { prefix: "ORD", randomDigits: 5, separator: "" },        // ORD12345
  DELIVERY: { prefix: "DEL", randomDigits: 4, separator: "-" },    // DEL-1234
  CUSTOM: { prefix: "CUS", randomDigits: 3, separator: "" },       // CUS123
};

/**
 * Generate multiple unique serial numbers
 * @param count - Number of serial numbers to generate
 * @param config - Serial number configuration
 * @returns Array of unique serial numbers
 */
export const generateMultipleSerialNumbers = (count: number, config: SerialNumberConfig = DEFAULT_SERIAL_CONFIG): string[] => {
  const serialNumbers = new Set<string>();
  
  while (serialNumbers.size < count) {
    serialNumbers.add(generateSerialNumber(config));
  }
  
  return Array.from(serialNumbers);
};