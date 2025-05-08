import { NextApiRequest, NextApiResponse } from 'next';
import { checkDatabaseConnection } from '@/lib/db-connection';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      return res.status(500).json({ 
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }

    // Get connection pool stats if possible
    let poolStats = {};
    try {
      // This is a simplified version - actual implementation depends on your database setup
      poolStats = {
        activeConnections: 'N/A', // Would need a way to get this from Prisma
        maxConnections: process.env.DATABASE_CONNECTION_LIMIT || 10,
      };
    } catch (error) {
      console.error('Failed to get connection pool stats:', error);
    }

    // Log the health check
    try {
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          source: 'DB_HEALTH_CHECK',
          message: 'Database health check successful',
        }
      });
    } catch (error) {
      console.warn('Failed to log health check:', error);
    }

    return res.status(200).json({
      status: 'ok',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      poolStats
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}