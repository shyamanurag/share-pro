import crypto from 'crypto';

/**
 * Security utilities for handling sensitive operations
 */

// Generate a secure random token
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Create a hash of a value with a salt
export function hashValue(value: string, salt?: string): { hash: string; salt: string } {
  // Generate a salt if not provided
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  
  // Create HMAC
  const hmac = crypto.createHmac('sha256', useSalt);
  hmac.update(value);
  const hash = hmac.digest('hex');
  
  return { hash, salt: useSalt };
}

// Verify a value against its hash
export function verifyHash(value: string, hash: string, salt: string): boolean {
  const hmac = crypto.createHmac('sha256', salt);
  hmac.update(value);
  const computedHash = hmac.digest('hex');
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(hash, 'hex')
  );
}

// Generate a time-limited token with payload
export function generateTimedToken(
  payload: Record<string, any>,
  secretKey: string,
  expiresInSeconds: number = 3600
): string {
  // Add expiration timestamp to payload
  const tokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };
  
  // Stringify and encode payload
  const data = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
  
  // Create signature
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(data);
  const signature = hmac.digest('hex');
  
  // Return token as base64url encoded payload + signature
  return `${data}.${signature}`;
}

// Verify and decode a timed token
export function verifyTimedToken(
  token: string,
  secretKey: string
): { valid: boolean; expired: boolean; payload: Record<string, any> | null } {
  try {
    // Split token into parts
    const [data, signature] = token.split('.');
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');
    
    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    if (!signatureValid) {
      return { valid: false, expired: false, payload: null };
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(data, 'base64').toString());
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: true, expired: true, payload };
    }
    
    return { valid: true, expired: false, payload };
  } catch (error) {
    return { valid: false, expired: false, payload: null };
  }
}

// Encrypt sensitive data
export function encryptData(
  data: string,
  encryptionKey: string
): { encrypted: string; iv: string } {
  // Generate initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey.padEnd(32).slice(0, 32)),
    iv
  );
  
  // Encrypt data
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex')
  };
}

// Decrypt sensitive data
export function decryptData(
  encrypted: string,
  iv: string,
  encryptionKey: string
): string {
  try {
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(encryptionKey.padEnd(32).slice(0, 32)),
      Buffer.from(iv, 'hex')
    );
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt data');
  }
}

// Generate a CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Sanitize error messages to prevent information leakage
export function sanitizeErrorMessage(error: Error | unknown): string {
  // Default generic error message
  const genericMessage = 'An unexpected error occurred';
  
  if (!error) return genericMessage;
  
  if (error instanceof Error) {
    // List of sensitive terms that shouldn't be exposed
    const sensitiveTerms = [
      'password', 'token', 'secret', 'key', 'auth', 
      'database', 'db', 'sql', 'query', 'supabase'
    ];
    
    // Check if error message contains sensitive information
    const message = error.message.toLowerCase();
    const containsSensitiveInfo = sensitiveTerms.some(term => 
      message.includes(term.toLowerCase())
    );
    
    return containsSensitiveInfo ? genericMessage : error.message;
  }
  
  return genericMessage;
}