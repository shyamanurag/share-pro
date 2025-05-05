import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!userProfile || userProfile.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // GET: Fetch risk report or generate a new one
    if (req.method === 'GET') {
      // Check if we should generate a new report or fetch the latest
      const generateNew = req.query.generate === 'true';
      
      if (!generateNew) {
        // Fetch the latest risk report
        const latestReport = await prisma.riskReport.findFirst({
          orderBy: { createdAt: 'desc' }
        });
        
        if (latestReport) {
          return res.status(200).json({ report: latestReport });
        }
      }
      
      // Generate a new risk report
      
      // 1. Get total users and active users
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: { isActive: true }
      });
      
      // 2. Calculate equity exposure (sum of portfolio values)
      const portfolioItems = await prisma.portfolioItem.findMany({
        include: {
          stock: true
        }
      });
      
      const equityExposure = portfolioItems.reduce((sum, item) => {
        return sum + (item.quantity * item.stock.currentPrice);
      }, 0);
      
      // 3. Calculate F&O exposure
      const futuresPositions = await prisma.futuresPosition.findMany();
      const optionsPositions = await prisma.optionsPosition.findMany();
      
      const fnoExposure = futuresPositions.reduce((sum, position) => {
        return sum + position.margin;
      }, 0) + optionsPositions.reduce((sum, position) => {
        return sum + (position.quantity * position.currentPrice);
      }, 0);
      
      // 4. Calculate total exposure and risk metrics
      const totalExposure = equityExposure + fnoExposure;
      const marginUtilized = futuresPositions.reduce((sum, position) => {
        return sum + position.margin;
      }, 0);
      
      // Risk ratio: total exposure / total user balances
      const totalUserBalances = await prisma.user.aggregate({
        _sum: {
          balance: true
        }
      });
      
      const riskRatio = totalExposure / (totalUserBalances._sum.balance || 1);
      
      // 5. Create detailed breakdown
      const detailedBreakdown = {
        userMetrics: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers
        },
        exposureMetrics: {
          equityExposure,
          fnoExposure,
          totalExposure,
          marginUtilized
        },
        riskMetrics: {
          riskRatio,
          totalUserBalances: totalUserBalances._sum.balance,
          highRiskUsers: 0, // Would require more complex calculation
        },
        topStocks: await prisma.portfolioItem.groupBy({
          by: ['stockId'],
          _sum: {
            quantity: true
          },
          orderBy: {
            _sum: {
              quantity: true
            }
          },
          take: 10
        })
      };
      
      // 6. Create the risk report
      const newReport = await prisma.riskReport.create({
        data: {
          totalUsers,
          activeUsers,
          totalExposure,
          equityExposure,
          fnoExposure,
          marginUtilized,
          riskRatio,
          details: JSON.stringify(detailedBreakdown),
          createdBy: user.id
        }
      });
      
      return res.status(200).json({ 
        report: newReport,
        details: detailedBreakdown
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling risk report request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}