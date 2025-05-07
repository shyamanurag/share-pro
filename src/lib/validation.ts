/**
 * Utility functions for input validation and sanitization
 * to help prevent injection attacks and ensure data integrity
 */

// Create a validation object to group all validation functions
export const validation = {
  // Validate email format
  isEmail: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  isStrongPassword: (password: string): { 
    isValid: boolean; 
    message: string;
  } => {
    if (password.length < 8) {
      return { 
        isValid: false, 
        message: 'Password must be at least 8 characters long' 
      };
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { 
        isValid: false, 
        message: 'Password must contain at least one uppercase letter' 
      };
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return { 
        isValid: false, 
        message: 'Password must contain at least one lowercase letter' 
      };
    }
    
    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      return { 
        isValid: false, 
        message: 'Password must contain at least one number' 
      };
    }
    
    return { isValid: true, message: 'Password is strong' };
  },

  // Sanitize string input to prevent XSS
  sanitizeString: (input: string): string => {
    if (!input) return '';
    
    // Replace potentially dangerous characters
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // Validate UUID format
  isUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Validate numeric input
  isNumber: (value: any): boolean => {
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'string') return !isNaN(Number(value));
    return false;
  },

  // Validate positive number
  isPositiveNumber: (value: any): boolean => {
    return validation.isNumber(value) && Number(value) > 0;
  },

  // Validate integer
  isInteger: (value: any): boolean => {
    return validation.isNumber(value) && Number.isInteger(Number(value));
  },

  // Validate date format (YYYY-MM-DD)
  isDateFormat: (dateStr: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;
    
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  },

  // Validate URL format
  isURL: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Validate stock symbol format
  isStockSymbol: (symbol: string): boolean => {
    // Most stock symbols are 1-5 uppercase letters, but some may include numbers or dots
    const symbolRegex = /^[A-Z0-9.]{1,10}$/;
    return symbolRegex.test(symbol);
  },

  // Validate phone number format (basic validation)
  isPhoneNumber: (phone: string): boolean => {
    // This is a basic validation - adjust based on your requirements
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  },

  // Validate input against allowed values
  isAllowedValue: <T>(value: T, allowedValues: T[]): boolean => {
    return allowedValues.includes(value);
  },

  // Truncate string to prevent overflow attacks
  truncateString: (str: string, maxLength: number): string => {
    if (!str) return '';
    return str.length <= maxLength ? str : str.substring(0, maxLength);
  }
};

// For backward compatibility, also export individual functions
export function isValidEmail(email: string): boolean {
  return validation.isEmail(email);
}

export function isStrongPassword(password: string): { isValid: boolean; message: string; } {
  return validation.isStrongPassword(password);
}

export function sanitizeString(input: string): string {
  return validation.sanitizeString(input);
}

export function isValidUUID(uuid: string): boolean {
  return validation.isUUID(uuid);
}

export function isValidNumber(value: any): boolean {
  return validation.isNumber(value);
}

export function isPositiveNumber(value: any): boolean {
  return validation.isPositiveNumber(value);
}

export function isInteger(value: any): boolean {
  return validation.isInteger(value);
}

export function isValidDateFormat(dateStr: string): boolean {
  return validation.isDateFormat(dateStr);
}

export function isValidURL(url: string): boolean {
  return validation.isURL(url);
}

export function isValidStockSymbol(symbol: string): boolean {
  return validation.isStockSymbol(symbol);
}

export function isValidPhoneNumber(phone: string): boolean {
  return validation.isPhoneNumber(phone);
}

export function isAllowedValue<T>(value: T, allowedValues: T[]): boolean {
  return validation.isAllowedValue(value, allowedValues);
}

export function truncateString(str: string, maxLength: number): string {
  return validation.truncateString(str, maxLength);
}