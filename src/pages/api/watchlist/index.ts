import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, logApiUsage } from '@/lib/api-auth';
import { validation } from '@/lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Record start time for performance monitoring
  const startTime = Date.now();
  
  try {
    // This handler will be wrapped with authentication
    return await authenticatedHandler(req, res);
  } catch (error) {
    console.error('Error in watchlist API:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
    
    // Log API usage with error
    try {
      await logApiUsage(req, res, undefined, startTime);
    } catch (logError) {
      console.error('Error logging API usage:', logError);
    }
    return;
  }
}

// Handler that requires authentication
const authenticatedHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
  // Record start time for performance monitoring
  const startTime = Date.now();
  
  try {
    // GET: Fetch user's watchlist with stock details
    if (req.method === 'GET') {
      const { watchlistId } = req.query;
      
      // Find or create default watchlist for user if no watchlistId provided
      let watchlist;
      
      if (watchlistId && typeof watchlistId === 'string') {
        // Validate watchlist ID format
        if (!validation.isUUID(watchlistId)) {
          res.status(400).json({ 
            error: 'Bad Request',
            message: 'Invalid watchlist ID format'
          });
          await logApiUsage(req, res, userId, startTime);
          return;
        }
        
        // Get specific watchlist
        watchlist = await prisma.watchlist.findFirst({
          where: { 
            id: watchlistId,
            userId // Ensure user can only access their own watchlists
          },
        });
        
        if (!watchlist) {
          res.status(404).json({ 
            error: 'Not Found',
            message: 'Watchlist not found or you do not have access to it'
          });
          await logApiUsage(req, res, userId, startTime);
          return;
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

      // Log successful API usage
      await logApiUsage(req, res, userId, startTime);

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
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'Stock ID is required'
        });
        await logApiUsage(req, res, userId, startTime);
        return;
      }
      
      // Validate stock ID format
      if (!validation.isUUID(stockId)) {
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'Invalid stock ID format'
        });
        await logApiUsage(req, res, userId, startTime);
        return;
      }
      
      // Validate watchlist ID format if provided
      if (watchlistId && !validation.isUUID(watchlistId)) {
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'Invalid watchlist ID format'
        });
        await logApiUsage(req, res, userId, startTime);
        return;
      }
      
      // Validate that the stock exists
      const stockExists = await prisma.stock.findUnique({
        where: { id: stockId },
        select: { id: true }
      });
      
      if (!stockExists) {
        res.status(404).json({ 
          error: 'Not Found',
          message: 'The specified stock does not exist'
        });
        await logApiUsage(req, res, userId, startTime);
        return;
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
          res.status(404).json({ 
            error: 'Not Found',
            message: 'Watchlist not found or you do not have access to it'
          });
          await logApiUsage(req, res, userId, startTime);
          return;
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
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'Stock already in this watchlist'
        });
        await logApiUsage(req, res, userId, startTime);
        return;
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

      // Log successful API usage
      await logApiUsage(req, res, userId, startTime);

      return res.status(201).json({ watchlistItem });
    }
    
    else {
      res.status(405).json({ 
        error: 'Method Not Allowed',
        message: 'This endpoint only supports GET and POST requests'
      });
      
      // Log API usage with method not allowed
      await logApiUsage(req, res, userId, startTime);
      return;
    }
  } catch (error) {
    console.error('Error in watchlist handler:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
    
    // Log API usage with error
    await logApiUsage(req, res, userId, startTime);
    return;
  }
});