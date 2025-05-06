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

    // POST: Create a new watchlist
    if (req.method === 'POST') {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Watchlist name is required' });
      }

      // Create a new watchlist
      const watchlist = await prisma.watchlist.create({
        data: {
          name,
          userId: user.id,
        },
      });

      return res.status(201).json({ watchlist });
    }
    
    // GET: Get all user's watchlists
    else if (req.method === 'GET') {
      const watchlists = await prisma.watchlist.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      });

      // Get counts for each watchlist
      const watchlistIds = watchlists.map(wl => wl.id);
      const counts = await Promise.all(
        watchlistIds.map(async (id) => {
          const count = await prisma.watchlistItem.count({
            where: { watchlistId: id }
          });
          return { id, count };
        })
      );

      // Create a map of watchlist ID to count
      const countsMap = counts.reduce((map, item) => {
        map[item.id] = item.count;
        return map;
      }, {} as Record<string, number>);

      return res.status(200).json({ 
        watchlists,
        counts: countsMap
      });
    }
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error managing watchlists:', error);
    return res.status(500).json({ error: 'Failed to manage watchlists' });
  }
}