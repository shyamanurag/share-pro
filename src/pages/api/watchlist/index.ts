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

    // GET: Fetch user's watchlist with stock details
    if (req.method === 'GET') {
      // Find or create default watchlist for user
      let watchlist = await prisma.watchlist.findFirst({
        where: { userId: user.id },
      });

      if (!watchlist) {
        watchlist = await prisma.watchlist.create({
          data: {
            name: 'My Watchlist',
            userId: user.id,
          },
        });
      }

      // Get watchlist items with stock details
      const watchlistItems = await prisma.watchlistItem.findMany({
        where: { watchlistId: watchlist.id },
        include: { stock: true },
      });

      return res.status(200).json({ 
        watchlist,
        items: watchlistItems 
      });
    }
    
    // POST: Add stock to watchlist
    else if (req.method === 'POST') {
      const { stockId } = req.body;
      
      if (!stockId) {
        return res.status(400).json({ error: 'Stock ID is required' });
      }

      // Find or create default watchlist for user
      let watchlist = await prisma.watchlist.findFirst({
        where: { userId: user.id },
      });

      if (!watchlist) {
        watchlist = await prisma.watchlist.create({
          data: {
            name: 'My Watchlist',
            userId: user.id,
          },
        });
      }

      // Check if stock already in watchlist
      const existingItem = await prisma.watchlistItem.findFirst({
        where: {
          watchlistId: watchlist.id,
          stockId: stockId,
        },
      });

      if (existingItem) {
        return res.status(400).json({ error: 'Stock already in watchlist' });
      }

      // Add stock to watchlist
      const watchlistItem = await prisma.watchlistItem.create({
        data: {
          watchlistId: watchlist.id,
          stockId: stockId,
        },
        include: { stock: true },
      });

      return res.status(201).json({ watchlistItem });
    }
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error managing watchlist:', error);
    return res.status(500).json({ error: 'Failed to manage watchlist' });
  }
}