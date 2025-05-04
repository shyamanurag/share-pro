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

    // GET: Fetch user's portfolio with stock details
    if (req.method === 'GET') {
      // Find or create default portfolio for user
      let portfolio = await prisma.portfolio.findFirst({
        where: { userId: user.id },
      });

      if (!portfolio) {
        portfolio = await prisma.portfolio.create({
          data: {
            name: 'My Portfolio',
            userId: user.id,
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
        where: { id: user.id },
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
    }
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error managing portfolio:', error);
    return res.status(500).json({ error: 'Failed to manage portfolio' });
  }
}