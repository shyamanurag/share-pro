import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // This handler will be wrapped with authentication
    return await authenticatedHandler(req, res);
  } catch (error) {
    console.error('Error in portfolio API:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
}

// Handler that requires authentication
const authenticatedHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
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

      // Calculate portfolio value
      const portfolioValue = portfolioItems.reduce((total, item) => {
        return total + (item.quantity * item.stock.currentPrice);
      }, 0);

      return res.status(200).json({ 
        portfolio,
        items: portfolioItems,
        balance: userData?.balance || 0,
        portfolioValue
      });
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to fetch portfolio data'
      });
    }
  }
  
  else {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'This endpoint only supports GET requests'
    });
  }
});