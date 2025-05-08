import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';
import prisma from '@/lib/prisma';
import dbHealthMonitor from '@/lib/db-health-monitor';

/**
 * Middleware to handle database connections for API routes
 * This middleware ensures that database connections are properly established and released
 */
export function dbConnectionMiddleware() {
  return async (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    // Check if database is healthy
    if (!dbHealthMonitor.isDatabaseHealthy()) {
      console.warn('Database health check failed, proceeding with caution');
      // We'll still try to proceed, but log a warning
    }
    
    try {
      // Continue to the next middleware or route handler
      await next();
    } catch (error) {
      // Pass the error to the next error handler
      throw error;
    } finally {
      // Always ensure we disconnect from the database
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.warn('Error disconnecting from database:', disconnectError);
      }
    }
  };
}

/**
 * Middleware to require a healthy database connection
 * This middleware will return a 503 Service Unavailable if the database is not healthy
 */
export function requireHealthyDbConnection() {
  return async (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    // Check if database is healthy
    if (!dbHealthMonitor.isDatabaseHealthy()) {
      console.error('Database health check failed, returning 503');
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database connection is currently unavailable',
        details: 'Please try again later'
      });
    }
    
    // Database is healthy, continue
    await next();
  };
}

/**
 * Middleware to handle database transactions
 * This middleware wraps the request handler in a transaction
 */
export function withTransaction() {
  return async (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    // Only use transactions for write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
      try {
        // Start a transaction
        await prisma.$transaction(async (tx) => {
          // Attach the transaction to the request object
          (req as any).prisma = tx;
          
          // Continue to the next middleware or route handler
          await next();
        });
      } catch (error) {
        // Transaction failed, pass the error to the next error handler
        throw error;
      }
    } else {
      // For read operations, just continue without a transaction
      await next();
    }
  };
}

export default {
  dbConnectionMiddleware,
  requireHealthyDbConnection,
  withTransaction
};