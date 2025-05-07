import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, logApiUsage } from '@/lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Record start time for performance monitoring
  const startTime = Date.now();
  
  try {
    // This handler will be wrapped with authentication
    return await authenticatedHandler(req, res);
  } catch (error) {
    console.error('Error in watchlist item API:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
    
    // Log API usage with error
    await logApiUsage(req, res, undefined, startTime);
    return;
  }
}

// Handler that requires authentication
const authenticatedHandler = withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
  const { stockId } = req.query;
  const { watchlistId } = req.query;
  
  if (!stockId || typeof stockId !== 'string') {
    res.status(400).json({ 
      error: 'Bad Request',
      message: 'Stock ID is required'
    });
    await logApiUsage(req, res, userId, startTime);
    return;
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
      
      targetWatchlistId = watchlistId;
    } else {
      // Use the default watchlist if no watchlistId specified
      const watchlist = await prisma.watchlist.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!watchlist) {
        res.status(404).json({ 
          error: 'Not Found',
          message: 'Watchlist not found'
        });
        await logApiUsage(req, res, userId, startTime);
        return;
      }
      
      targetWatchlistId = watchlist.id;
    }

    // Verify the watchlist item exists before attempting to delete
    const watchlistItem = await prisma.watchlistItem.findFirst({
      where: {
        watchlistId: targetWatchlistId,
        stockId: stockId,
      },
    });
    
    if (!watchlistItem) {
      res.status(404).json({ 
        error: 'Not Found',
        message: 'Stock not found in this watchlist'
      });
      await logApiUsage(req, res, userId, startTime);
      return;
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

    // Log successful API usage
    await logApiUsage(req, res, userId, startTime);

    return res.status(200).json({ 
      success: true,
      message: 'Stock removed from watchlist'
    });
  }
  
  else {
    res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'This endpoint only supports DELETE requests'
    });
    
    // Log API usage with method not allowed
    await logApiUsage(req, res, userId, startTime);
    return;
  }
});