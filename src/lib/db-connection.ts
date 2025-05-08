import prisma from './prisma';
import databaseConfig from '@/config/database';

/**
 * Utility function to execute database operations with retry logic
 * and proper connection handling
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = databaseConfig.retry.maxRetries,
  retryDelay = databaseConfig.retry.retryDelay
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Execute the database operation
      const result = await operation();
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Enhanced error detection for various database connection issues
      const isRetryableError = 
        error.code === 'P2024' || // Connection pool timeout
        error.code === 'P2028' || // Transaction API error
        error.code === 'P2025' || // Record not found (might be due to replication lag)
        error.message?.includes('timeout') ||
        error.message?.includes('timed out') ||
        error.message?.includes('connection') ||
        error.message?.includes('pool') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('statement timeout') ||
        error.message?.includes('canceling statement');
      
      if (!isRetryableError || attempt === maxRetries) {
        // If it's not a retryable error or we've reached max retries, throw the error
        throw error;
      }
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 500; // Add up to 500ms of random jitter
      const delay = (retryDelay * Math.pow(2, attempt - 1)) + jitter;
      
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${delay}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw lastError;
}

/**
 * Safely execute a Prisma transaction with retry logic
 */
export async function executeTransaction<T>(
  transactionFn: (tx: typeof prisma) => Promise<T>,
  maxRetries = databaseConfig.retry.maxRetries
): Promise<T> {
  return executeWithRetry(
    () => prisma.$transaction(transactionFn as any),
    maxRetries
  );
}

/**
 * Healthcheck function to test database connectivity
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to check if the database is responsive with a timeout
    const result = await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  } finally {
    try {
      // Explicitly disconnect to release the connection back to the pool
      await prisma.$disconnect();
    } catch (error) {
      console.warn('Error disconnecting from database:', error);
    }
  }
}