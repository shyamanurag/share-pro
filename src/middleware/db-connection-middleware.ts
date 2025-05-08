import { NextApiRequest, NextApiResponse } from 'next';
import { NextApiHandler } from 'next';
import connectionManager from '@/lib/connection-manager';
import prisma from '@/lib/prisma';

/**
 * Middleware to handle database connection issues
 * This middleware will check the database connection before processing the request
 * and will return a 503 Service Unavailable response if the database is not available
 */
export function withDatabaseConnection(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Skip connection check for non-database routes
    const nonDbRoutes = [
      '/api/hello',
      '/api/system/health',
    ];
    
    if (nonDbRoutes.includes(req.url || '')) {
      return handler(req, res);
    }
    
    // Check if database is connected using the connection manager
    if (!connectionManager.isConnectedToDatabase()) {
      console.error('Database connection unavailable in middleware');
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database service is currently unavailable. Please try again later.'
      });
    }
    
    try {
      // Database is connected, proceed with the request
      const result = await handler(req, res);
      
      // Ensure we release connections back to the pool
      try {
        // Only disconnect in development to avoid connection churn in production
        if (process.env.NODE_ENV === 'development') {
          await prisma.$disconnect();
        }
      } catch (disconnectError) {
        console.warn('Error disconnecting from database:', disconnectError);
      }
      
      return result;
    } catch (error) {
      console.error('Error in API handler:', error);
      
      // If response has not been sent yet, send a 500 error
      if (!res.writableEnded) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred while processing your request.'
        });
      }
      
      // Ensure we release connections back to the pool even on error
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.warn('Error disconnecting from database after error:', disconnectError);
      }
    }
  };
}