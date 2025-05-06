import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Watchlist ID is required' });
    }

    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if the watchlist belongs to the user
    const watchlist = await prisma.watchlist.findUnique({
      where: { id },
    });

    if (!watchlist) {
      return res.status(404).json({ error: 'Watchlist not found' });
    }

    if (watchlist.userId !== user.id) {
      return res.status(403).json({ error: 'You do not have permission to access this watchlist' });
    }

    // PUT: Update watchlist name
    if (req.method === 'PUT') {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Watchlist name is required' });
      }

      const updatedWatchlist = await prisma.watchlist.update({
        where: { id },
        data: { name },
      });

      return res.status(200).json({ watchlist: updatedWatchlist });
    }
    
    // DELETE: Delete watchlist
    else if (req.method === 'DELETE') {
      // First check if this is the user's only watchlist
      const watchlistCount = await prisma.watchlist.count({
        where: { userId: user.id },
      });

      if (watchlistCount <= 1) {
        return res.status(400).json({ 
          error: 'Cannot delete the only watchlist. Create a new watchlist first.' 
        });
      }

      // Delete the watchlist (cascade will delete all items)
      await prisma.watchlist.delete({
        where: { id },
      });

      // Find another watchlist to set as active
      const anotherWatchlist = await prisma.watchlist.findFirst({
        where: { userId: user.id },
      });

      return res.status(200).json({ 
        message: 'Watchlist deleted successfully',
        nextActiveWatchlist: anotherWatchlist
      });
    }
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error managing watchlist:', error);
    return res.status(500).json({ error: 'Failed to manage watchlist' });
  }
}