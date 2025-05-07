import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth } from '@/lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // This handler will be wrapped with authentication
    return await authenticatedHandler(req, res);
  } catch (error) {
    console.error('Error in watchlist API:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
    return;
  }
}

// Handler that requires authentication
const authenticatedHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
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
          userId // Ensure user can only access their own watchlists
        },
      });
      
      if (!watchlist) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Watchlist not found or you do not have access to it'
        });
      }
    } else {
      // Get or create default watchlist
      watchlist = await prisma.watchlist.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!watchlist) {
        watchlist = await prisma.watchlist.create({
          data: {
            name: 'My Watchlist',
            userId,
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
      where: { userId },
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
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Stock ID is required'
      });
    }
    
    // Validate that the stock exists
    const stockExists = await prisma.stock.findUnique({
      where: { id: stockId },
      select: { id: true }
    });
    
    if (!stockExists) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'The specified stock does not exist'
      });
    }

    // Find specified watchlist or default watchlist
    let watchlist;
    
    if (watchlistId) {
      watchlist = await prisma.watchlist.findFirst({
        where: { 
          id: watchlistId,
          userId // Ensure user can only access their own watchlists
        },
      });
      
      if (!watchlist) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Watchlist not found or you do not have access to it'
        });
      }
    } else {
      // Find or create default watchlist
      watchlist = await prisma.watchlist.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!watchlist) {
        watchlist = await prisma.watchlist.create({
          data: {
            name: 'My Watchlist',
            userId,
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
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Stock already in this watchlist'
      });
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
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'This endpoint only supports GET and POST requests'
    });
  }
});