import { NextApiRequest, NextApiResponse } from 'next';
import { NextApiHandler } from 'next';
import { checkDatabaseConnection } from '@/lib/db-connection';

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
    
    try {
      // Check database connection
      const isConnected = await checkDatabaseConnection();
      
      if (!isConnected) {
        console.error('Database connection failed in middleware');
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Database connection failed. Please try again later.'
        });
      }
      
      // Database is connected, proceed with the request
      return handler(req, res);
    } catch (error) {
      console.error('Error checking database connection:', error);
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database connection error. Please try again later.'
      });
    }
  };
}