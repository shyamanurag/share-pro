import { PrismaClient } from '@prisma/client';

/**
 * This file provides a fallback mechanism for the Prisma client
 * in case the regular client initialization fails.
 * 
 * It creates a simplified client with minimal configuration
 * that should work with the existing database structure.
 */

// Create a fallback Prisma client with minimal configuration
const createFallbackClient = () => {
  console.warn('Using fallback Prisma client configuration');
  
  try {
    return new PrismaClient({
      // Use minimal logging to avoid overwhelming logs
      log: ['error'],
      
      // Use standard connection without custom datasource configuration
      // This ensures compatibility with the database URL format
    });
  } catch (error) {
    console.error('Failed to create fallback Prisma client:', error);
    throw error;
  }
};

// Export the fallback client creation function
export default createFallbackClient;