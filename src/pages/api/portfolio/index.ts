import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, logApiUsage } from '@/lib/api-auth';
import { calculatePortfolioValue } from '@/lib/accounting';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Record start time for performance monitoring
  const startTime = Date.now();
  
  try {
    // This handler will be wrapped with authentication
    return await authenticatedHandler(req, res);
  } catch (error) {
    console.error('Error in portfolio API:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
    
    // Log API usage with error
    try {
      await logApiUsage(req, res, undefined, startTime);
    } catch (logError) {
      console.error('Error logging API usage:', logError);
    }
    return;
  }
}

// Handler that requires authentication
const authenticatedHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
  // Record start time for performance monitoring
  const startTime = Date.now();
  
  try {
    // GET: Fetch user's portfolio with stock details
    if (req.method === 'GET') {
      try {
        // Find or create default portfolio for user
        let portfolio = await prisma.portfolio.findFirst({
          where: { userId },
        });

        if (!portfolio) {
          portfolio = await prisma.portfolio.create({
            data: {
              name: 'My Portfolio',
              userId,
            },
          });
        }

        // Get portfolio items with stock details
        const portfolioItems = await prisma.portfolioItem.findMany({
          where: { portfolioId: portfolio.id },
          include: { stock: true },
        });

        // Get user's balance
        const userData = await prisma.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        });

        // Calculate portfolio value using accounting utility
        const portfolioValue = calculatePortfolioValue(portfolioItems);

        // Log successful API usage
        await logApiUsage(req, res, userId, startTime);

        return res.status(200).json({ 
          portfolio,
          items: portfolioItems,
          balance: userData?.balance || 0,
          portfolioValue
        });
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ 
          error: 'Internal Server Error',
          message: 'Failed to fetch portfolio data'
        });
        
        // Log API usage with error
        await logApiUsage(req, res, userId, startTime);
        return;
      }
    }
    
    else {
      res.status(405).json({ 
        error: 'Method Not Allowed',
        message: 'This endpoint only supports GET requests'
      });
      
      // Log API usage with method not allowed
      await logApiUsage(req, res, userId, startTime);
      return;
    }
  } catch (error) {
    console.error('Error in portfolio handler:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
    
    // Log API usage with error
    await logApiUsage(req, res, userId, startTime);
    return;
  }
});