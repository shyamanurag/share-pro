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

    // GET: Fetch user profile
    if (req.method === 'GET') {
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          balance: true,
          createdAt: true,
        },
      });

      if (!userProfile) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get portfolio value
      const portfolio = await prisma.portfolio.findFirst({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              stock: true,
            },
          },
        },
      });

      const portfolioValue = portfolio?.items.reduce((total, item) => {
        return total + (item.quantity * item.stock.currentPrice);
      }, 0) || 0;

      // Get transaction count
      const transactionCount = await prisma.transaction.count({
        where: { userId: user.id },
      });

      return res.status(200).json({ 
        user: userProfile,
        portfolioValue,
        transactionCount,
        totalValue: userProfile.balance + portfolioValue
      });
    }
    
    // PATCH: Update user profile
    else if (req.method === 'PATCH') {
      const { name } = req.body;
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { name },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          balance: true,
          createdAt: true,
        },
      });

      return res.status(200).json({ user: updatedUser });
    }
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error managing user profile:', error);
    return res.status(500).json({ error: 'Failed to manage user profile' });
  }
}