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

    const { stockId } = req.query;
    const { watchlistId } = req.query;
    
    if (!stockId || typeof stockId !== 'string') {
      return res.status(400).json({ error: 'Stock ID is required' });
    }

    // DELETE: Remove stock from watchlist
    if (req.method === 'DELETE') {
      // Find user's watchlist
      let targetWatchlistId;
      
      if (watchlistId && typeof watchlistId === 'string') {
        // Check if the specified watchlist belongs to the user
        const watchlist = await prisma.watchlist.findFirst({
          where: { 
            id: watchlistId,
            userId: user.id 
          },
        });
        
        if (!watchlist) {
          return res.status(404).json({ error: 'Watchlist not found or access denied' });
        }
        
        targetWatchlistId = watchlistId;
      } else {
        // Use the default watchlist if no watchlistId specified
        const watchlist = await prisma.watchlist.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' },
        });

        if (!watchlist) {
          return res.status(404).json({ error: 'Watchlist not found' });
        }
        
        targetWatchlistId = watchlist.id;
      }

      // Delete watchlist item
      await prisma.watchlistItem.deleteMany({
        where: {
          watchlistId: targetWatchlistId,
          stockId: stockId,
        },
      });

      // Update the watchlist's updatedAt timestamp
      await prisma.watchlist.update({
        where: { id: targetWatchlistId },
        data: { updatedAt: new Date() },
      });

      return res.status(200).json({ success: true });
    }
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
}