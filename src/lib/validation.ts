/**
 * Utility functions for input validation and sanitization
 * to help prevent injection attacks and ensure data integrity
 */

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isStrongPassword(password: string): { 
  isValid: boolean; 
  message: string;
} {
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
}

// Sanitize string input to prevent XSS
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Replace potentially dangerous characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validate numeric input
export function isValidNumber(value: any): boolean {
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') return !isNaN(Number(value));
  return false;
}

// Validate positive number
export function isPositiveNumber(value: any): boolean {
  return isValidNumber(value) && Number(value) > 0;
}

// Validate integer
export function isInteger(value: any): boolean {
  return isValidNumber(value) && Number.isInteger(Number(value));
}

// Validate date format (YYYY-MM-DD)
export function isValidDateFormat(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

// Validate URL format
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Validate stock symbol format
export function isValidStockSymbol(symbol: string): boolean {
  // Most stock symbols are 1-5 uppercase letters, but some may include numbers or dots
  const symbolRegex = /^[A-Z0-9.]{1,10}$/;
  return symbolRegex.test(symbol);
}

// Validate phone number format (basic validation)
export function isValidPhoneNumber(phone: string): boolean {
  // This is a basic validation - adjust based on your requirements
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
}

// Validate input against allowed values
export function isAllowedValue<T>(value: T, allowedValues: T[]): boolean {
  return allowedValues.includes(value);
}

// Truncate string to prevent overflow attacks
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  return str.length <= maxLength ? str : str.substring(0, maxLength);
}