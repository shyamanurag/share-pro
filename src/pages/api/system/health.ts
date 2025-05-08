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

  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: 'unknown',
        message: ''
      },
      api: {
        status: 'ok',
        uptime: process.uptime()
      }
    },
    environment: process.env.NODE_ENV || 'development'
  };

  try {
    // Check database connection
    const isDbConnected = await checkDatabaseConnection();
    
    if (isDbConnected) {
      healthStatus.services.database.status = 'ok';
      healthStatus.services.database.message = 'Database connection successful';
      
      // Try to get some basic stats
      try {
        const userCount = await prisma.user.count();
        const stockCount = await prisma.stock.count();
        
        healthStatus.services.database = {
          ...healthStatus.services.database,
          stats: {
            users: userCount,
            stocks: stockCount
          }
        };
      } catch (error) {
        console.warn('Failed to get database stats:', error);
      }
    } else {
      healthStatus.status = 'degraded';
      healthStatus.services.database.status = 'error';
      healthStatus.services.database.message = 'Database connection failed';
    }

    // Log the health check
    try {
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          source: 'SYSTEM_HEALTH',
          message: `System health check: ${healthStatus.status}`,
          details: JSON.stringify(healthStatus)
        }
      });
    } catch (error) {
      console.warn('Failed to log health check:', error);
    }

    return res.status(200).json(healthStatus);
  } catch (error: any) {
    healthStatus.status = 'error';
    healthStatus.services.database.status = 'error';
    healthStatus.services.database.message = error.message || 'Unknown database error';
    
    console.error('Health check error:', error);
    
    return res.status(500).json(healthStatus);
  }
}