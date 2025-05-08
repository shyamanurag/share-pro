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
      
      // Check if this is a connection error that we should retry
      const isConnectionError = 
        error.code === 'P2024' || // Connection pool timeout
        error.message?.includes('Unable to check out process from the pool') ||
        error.message?.includes('connection pool');
      
      if (!isConnectionError || attempt === maxRetries) {
        // If it's not a connection error or we've reached max retries, throw the error
        throw error;
      }
      
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${retryDelay}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
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
    // Simple query to check if the database is responsive
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}