import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { dbConnectionMiddleware, requireHealthyDbConnection } from '@/middleware/db-connection-middleware';
import prismaErrorHandler from '@/middleware/prisma-error-handler';
import dbHealthMonitor from '@/lib/db-health-monitor';
import prisma from '@/lib/prisma';

// Create a handler with middleware
const handler = nc({
  onError: (err, req, res: NextApiResponse) => {
    console.error('Health API error:', err);
    res.status(500).json({
      status: 'error',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  },
  onNoMatch: (req, res: NextApiResponse) => {
    res.status(405).json({
      status: 'error',
      message: `Method ${req.method} not allowed`,
      timestamp: new Date().toISOString()
    });
  }
})
  .use(dbConnectionMiddleware())
  .use(prismaErrorHandler())
  .use(requireHealthyDbConnection());

// GET handler for health check
handler.get(async (req: NextApiRequest, res: NextApiResponse) => {
  // Check overall system health
  const dbHealthy = dbHealthMonitor.isDatabaseHealthy();
  
  // Get system settings
  const systemSettings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: ['MAINTENANCE_MODE', 'TRADING_HOURS_START', 'TRADING_HOURS_END']
      }
    }
  });
  
  // Convert settings to a map
  const settings = systemSettings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);
  
  // Check if system is in maintenance mode
  const maintenanceMode = settings['MAINTENANCE_MODE'] === 'true';
  
  // Check if we're in trading hours
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const tradingHoursStart = settings['TRADING_HOURS_START'] || '09:15';
  const tradingHoursEnd = settings['TRADING_HOURS_END'] || '15:30';
  const inTradingHours = currentTime >= tradingHoursStart && currentTime <= tradingHoursEnd;
  
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  // Determine overall system status
  let status = 'ok';
  if (!dbHealthy) {
    status = 'error';
  } else if (maintenanceMode) {
    status = 'maintenance';
  }
  
  // Return health status
  return res.status(200).json({
    status,
    timestamp: new Date().toISOString(),
    components: {
      database: {
        status: dbHealthy ? 'ok' : 'error',
        message: dbHealthy ? 'Database connection successful' : 'Database connection failed'
      },
      api: {
        status: 'ok',
        message: 'API is responding'
      }
    },
    settings: {
      maintenanceMode,
      tradingHours: {
        start: tradingHoursStart,
        end: tradingHoursEnd,
        current: currentTime,
        inTradingHours
      }
    },
    system: {
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      },
      uptime: `${Math.round(process.uptime())} seconds`,
      nodeVersion: process.version
    }
  });
});

export default handler;