import { NextApiRequest, NextApiResponse } from 'next';
import { checkDatabaseConnection } from '@/lib/db-connection';
import prisma from '@/lib/prisma';
import dbHealthMonitor from '@/lib/db-health-monitor';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Force a health check if requested
    const forceCheck = req.query.force === 'true';
    
    let isConnected;
    if (forceCheck) {
      // Force a new health check
      isConnected = await dbHealthMonitor.forceHealthCheck();
    } else {
      // Use the cached health status
      isConnected = dbHealthMonitor.isDatabaseHealthy();
    }
    
    if (!isConnected) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Get additional database information if detailed info is requested
    let details = {};
    if (req.query.detailed === 'true') {
      try {
        // Get database information
        const dbInfo = await prisma.$queryRaw`SELECT current_database() as database, current_schema() as schema, version() as version`;
        
        // Get table counts
        const tableCountsResult = await prisma.$queryRaw`
          SELECT 
            (SELECT COUNT(*) FROM "User") as user_count,
            (SELECT COUNT(*) FROM "Stock") as stock_count,
            (SELECT COUNT(*) FROM "Transaction") as transaction_count,
            (SELECT COUNT(*) FROM "Portfolio") as portfolio_count,
            (SELECT COUNT(*) FROM "Watchlist") as watchlist_count
        `;
        
        // Get recent system logs
        const recentLogs = await prisma.systemLog.findMany({
          where: {
            level: {
              in: ['ERROR', 'CRITICAL']
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 5,
          select: {
            level: true,
            source: true,
            message: true,
            timestamp: true
          }
        });
        
        details = {
          database: dbInfo[0],
          counts: tableCountsResult[0],
          recentErrors: recentLogs
        };
      } catch (detailsError) {
        console.error('Error fetching detailed database info:', detailsError);
        details = {
          error: 'Failed to fetch detailed information',
          message: detailsError.message
        };
      }
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
          id: crypto.randomUUID(),
          level: 'INFO',
          source: 'DB_HEALTH_CHECK',
          message: 'Database health check successful',
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.warn('Failed to log health check:', error);
    }
    
    // If connected, return success with optional details
    return res.status(200).json({
      status: 'ok',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      poolStats,
      ...(Object.keys(details).length > 0 && { details })
    });
  } catch (error: any) {
    console.error('Error checking database health:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Error checking database health',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}