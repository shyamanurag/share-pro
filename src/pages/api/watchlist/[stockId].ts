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
    
    if (!stockId || typeof stockId !== 'string') {
      return res.status(400).json({ error: 'Stock ID is required' });
    }

    // DELETE: Remove stock from watchlist
    if (req.method === 'DELETE') {
      // Find user's watchlist
      const watchlist = await prisma.watchlist.findFirst({
        where: { userId: user.id },
      });

      if (!watchlist) {
        return res.status(404).json({ error: 'Watchlist not found' });
      }

      // Delete watchlist item
      await prisma.watchlistItem.deleteMany({
        where: {
          watchlistId: watchlist.id,
          stockId: stockId,
        },
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