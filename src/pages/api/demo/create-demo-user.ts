import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    
    // Check if demo user already exists in our database
    const existingUser = await prisma.user.findFirst({
      where: { email: 'demo@papertrader.app' }
    });
    
    if (!existingUser) {
      // Create demo user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: 'demo@papertrader.app',
        password: 'demo1234',
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
        }
      });

      if (authError) {
        console.error('Error creating demo user in Supabase Auth:', authError);
        return res.status(500).json({ error: 'Failed to create demo user' });
      }

      // Create user record in database
      if (authUser.user) {
        const user = await prisma.user.upsert({
          where: { id: authUser.user.id },
          update: {
            name: 'Demo User',
            balance: 10000,
          },
          create: {
            id: authUser.user.id,
            email: authUser.user.email!,
            name: 'Demo User',
            balance: 10000,
          },
        });

        // Create default watchlist for demo user
        const watchlist = await prisma.watchlist.create({
          data: {
            name: 'Default',
            userId: user.id,
          },
        });

        // Create default portfolio for demo user
        const portfolio = await prisma.portfolio.create({
          data: {
            name: 'Default',
            userId: user.id,
          },
        });

        // Add some sample transactions for the demo user
        const stocks = await prisma.stock.findMany({ take: 3 });
        
        if (stocks.length > 0) {
          // Add first stock to watchlist
          await prisma.watchlistItem.create({
            data: {
              watchlistId: watchlist.id,
              stockId: stocks[0].id,
            },
          });
          
          // Add sample transactions and portfolio items
          for (let i = 0; i < Math.min(2, stocks.length); i++) {
            const stock = stocks[i];
            const quantity = 10;
            const total = quantity * stock.currentPrice;
            
            // Create buy transaction
            await prisma.transaction.create({
              data: {
                userId: user.id,
                stockId: stock.id,
                type: 'BUY',
                quantity,
                price: stock.currentPrice,
                total,
                timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Stagger dates
              },
            });
            
            // Add to portfolio
            await prisma.portfolioItem.create({
              data: {
                portfolioId: portfolio.id,
                stockId: stock.id,
                quantity,
                avgBuyPrice: stock.currentPrice,
              },
            });
          }
          
          // Update user balance to reflect purchases
          const totalSpent = await prisma.transaction.aggregate({
            where: { userId: user.id, type: 'BUY' },
            _sum: { total: true },
          });
          
          await prisma.user.update({
            where: { id: user.id },
            data: { balance: 10000 - (totalSpent._sum.total || 0) },
          });
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in create-demo-user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}