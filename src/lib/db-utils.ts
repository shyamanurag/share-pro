import prisma from './prisma';
import { executeWithRetry } from './db-connection';

/**
 * Safely executes a database operation with proper error handling and connection management
 * This function wraps Prisma operations with retry logic and proper connection handling
 * 
 * @param operation Function that performs the database operation
 * @returns Result of the database operation
 */
export async function safeDbOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    // Execute the operation with retry logic
    const result = await executeWithRetry(operation);
    return result;
  } catch (error) {
    // Log the error
    console.error('Database operation failed:', error);
    
    // Rethrow the error to be handled by the caller
    throw error;
  }
}

/**
 * Safely executes a database transaction with proper error handling and connection management
 * This function wraps Prisma transactions with retry logic and proper connection handling
 * 
 * @param transactionFn Function that performs the transaction operations
 * @returns Result of the transaction
 */
export async function safeDbTransaction<T>(
  transactionFn: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  try {
    // Execute the transaction with retry logic
    return await prisma.$transaction(async (tx) => {
      return await transactionFn(tx);
    });
  } catch (error) {
    // Log the error
    console.error('Database transaction failed:', error);
    
    // Rethrow the error to be handled by the caller
    throw error;
  }
}

/**
 * Safely executes a read operation on the database
 * This function is optimized for read operations and includes proper error handling
 * 
 * @param operation Function that performs the read operation
 * @param fallbackValue Optional fallback value to return if the operation fails
 * @returns Result of the read operation or fallback value if provided
 */
export async function safeDbRead<T>(
  operation: () => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  try {
    // Execute the read operation with retry logic
    const result = await executeWithRetry(operation);
    return result;
  } catch (error) {
    // Log the error
    console.error('Database read operation failed:', error);
    
    // Return fallback value if provided, otherwise rethrow the error
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    
    throw error;
  }
}

/**
 * Safely executes a write operation on the database
 * This function is optimized for write operations and includes proper error handling
 * 
 * @param operation Function that performs the write operation
 * @returns Result of the write operation
 */
export async function safeDbWrite<T>(operation: () => Promise<T>): Promise<T> {
  try {
    // Execute the write operation with retry logic
    const result = await executeWithRetry(operation);
    return result;
  } catch (error) {
    // Log the error
    console.error('Database write operation failed:', error);
    
    // Rethrow the error to be handled by the caller
    throw error;
  } finally {
    // Ensure connection is properly managed
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn('Error disconnecting from database:', disconnectError);
    }
  }
}

/**
 * Checks if a record exists in the database
 * 
 * @param model Prisma model to check
 * @param where Where condition to find the record
 * @returns True if the record exists, false otherwise
 */
export async function recordExists<T>(
  model: any,
  where: any
): Promise<boolean> {
  try {
    const count = await model.count({
      where,
    });
    
    return count > 0;
  } catch (error) {
    console.error('Error checking if record exists:', error);
    return false;
  }
}

/**
 * Gets a record by ID with proper error handling
 * 
 * @param model Prisma model to query
 * @param id ID of the record to get
 * @param select Optional select object to specify which fields to include
 * @returns The record if found, null otherwise
 */
export async function getRecordById<T>(
  model: any,
  id: string,
  select?: any
): Promise<T | null> {
  try {
    const record = await model.findUnique({
      where: { id },
      ...(select && { select }),
    });
    
    return record;
  } catch (error) {
    console.error(`Error getting record by ID ${id}:`, error);
    return null;
  }
}