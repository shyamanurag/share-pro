import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withResourceOwner, logApiUsage } from '@/lib/api-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Record start time for performance monitoring
  const startTime = Date.now();
  
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Watchlist ID is required'
      });
    }
    
    // This handler will be wrapped with resource ownership verification
    return await resourceOwnerHandler(req, res);
  } catch (error) {
    console.error('Error in specific watchlist API:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
    
    // Log API usage with error
    await logApiUsage(req, res, undefined, startTime);
    return;
  }
}

// Handler that requires resource ownership verification
const resourceOwnerHandler = withResourceOwner(
  'watchlist',
  'id',
  async (req: NextApiRequest, res: NextApiResponse, userId: string, isOwner: boolean) => {
    const startTime = Date.now();
    const { id } = req.query as { id: string };
    
    if (!isOwner) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this watchlist'
      });
      await logApiUsage(req, res, userId, startTime);
      return;
    }

    // PUT: Update watchlist name
    if (req.method === 'PUT') {
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'Watchlist name is required'
        });
        await logApiUsage(req, res, userId, startTime);
        return;
      }
      
      // Validate name length and format
      if (name.trim().length < 1 || name.length > 50) {
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'Watchlist name must be between 1 and 50 characters'
        });
        await logApiUsage(req, res, userId, startTime);
        return;
      }
      
      // Check if user already has another watchlist with this name
      const existingWatchlist = await prisma.watchlist.findFirst({
        where: {
          userId,
          name: {
            equals: name,
            mode: 'insensitive' // Case-insensitive comparison
          },
          id: {
            not: id // Exclude the current watchlist
          }
        }
      });
      
      if (existingWatchlist) {
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'You already have another watchlist with this name'
        });
        await logApiUsage(req, res, userId, startTime);
        return;
      }

      const updatedWatchlist = await prisma.watchlist.update({
        where: { id },
        data: { name },
      });

      // Log successful API usage
      await logApiUsage(req, res, userId, startTime);

      return res.status(200).json({ 
        watchlist: updatedWatchlist,
        message: 'Watchlist updated successfully'
      });
    }
    
    // DELETE: Delete watchlist
    else if (req.method === 'DELETE') {
      // First check if this is the user's only watchlist
      const watchlistCount = await prisma.watchlist.count({
        where: { userId },
      });

      if (watchlistCount <= 1) {
        res.status(400).json({ 
          error: 'Bad Request',
          message: 'Cannot delete the only watchlist. Create a new watchlist first.'
        });
        await logApiUsage(req, res, userId, startTime);
        return;
      }

      // Delete the watchlist (cascade will delete all items)
      await prisma.watchlist.delete({
        where: { id },
      });

      // Find another watchlist to set as active
      const anotherWatchlist = await prisma.watchlist.findFirst({
        where: { userId },
      });

      // Log successful API usage
      await logApiUsage(req, res, userId, startTime);

      return res.status(200).json({ 
        success: true,
        message: 'Watchlist deleted successfully',
        nextActiveWatchlist: anotherWatchlist
      });
    }
    
    else {
      res.status(405).json({ 
        error: 'Method Not Allowed',
        message: 'This endpoint only supports PUT and DELETE requests'
      });
      
      // Log API usage with method not allowed
      await logApiUsage(req, res, userId, startTime);
      return;
    }
  }
);