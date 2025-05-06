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
      const { watchlistId } = req.query;
      
      // Find or create default watchlist for user if no watchlistId provided
      let watchlist;
      
      if (watchlistId && typeof watchlistId === 'string') {
        // Get specific watchlist
        watchlist = await prisma.watchlist.findFirst({
          where: { 
            id: watchlistId,
            userId: user.id 
          },
        });
        
        if (!watchlist) {
          return res.status(404).json({ error: 'Watchlist not found' });
        }
      } else {
        // Get or create default watchlist
        watchlist = await prisma.watchlist.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' },
        });

        if (!watchlist) {
          watchlist = await prisma.watchlist.create({
            data: {
              name: 'My Watchlist',
              userId: user.id,
            },
          });
        }
      }

      // Get watchlist items with stock details
      const watchlistItems = await prisma.watchlistItem.findMany({
        where: { watchlistId: watchlist.id },
        include: { stock: true },
      });

      // Get all user's watchlists for the dropdown
      const allWatchlists = await prisma.watchlist.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      });

      return res.status(200).json({ 
        watchlist,
        items: watchlistItems,
        allWatchlists
      });
    }
    
    // POST: Add stock to watchlist
    else if (req.method === 'POST') {
      const { stockId, watchlistId } = req.body;
      
      if (!stockId) {
        return res.status(400).json({ error: 'Stock ID is required' });
      }

      // Find specified watchlist or default watchlist
      let watchlist;
      
      if (watchlistId) {
        watchlist = await prisma.watchlist.findFirst({
          where: { 
            id: watchlistId,
            userId: user.id 
          },
        });
        
        if (!watchlist) {
          return res.status(404).json({ error: 'Watchlist not found' });
        }
      } else {
        // Find or create default watchlist
        watchlist = await prisma.watchlist.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' },
        });

        if (!watchlist) {
          watchlist = await prisma.watchlist.create({
            data: {
              name: 'My Watchlist',
              userId: user.id,
            },
          });
        }
      }

      // Check if stock already in watchlist
      const existingItem = await prisma.watchlistItem.findFirst({
        where: {
          watchlistId: watchlist.id,
          stockId: stockId,
        },
      });

      if (existingItem) {
        return res.status(400).json({ error: 'Stock already in this watchlist' });
      }

      // Add stock to watchlist
      const watchlistItem = await prisma.watchlistItem.create({
        data: {
          watchlistId: watchlist.id,
          stockId: stockId,
        },
        include: { stock: true },
      });

      // Update the watchlist's updatedAt timestamp
      await prisma.watchlist.update({
        where: { id: watchlist.id },
        data: { updatedAt: new Date() },
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