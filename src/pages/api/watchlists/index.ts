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
    console.error('Error in watchlists API:', error);
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
  // POST: Create a new watchlist
  if (req.method === 'POST') {
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
    
    // Check if user already has a watchlist with this name
    const existingWatchlist = await prisma.watchlist.findFirst({
      where: {
        userId,
        name: {
          equals: name,
          mode: 'insensitive' // Case-insensitive comparison
        }
      }
    });
    
    if (existingWatchlist) {
      res.status(400).json({ 
        error: 'Bad Request',
        message: 'You already have a watchlist with this name'
      });
      await logApiUsage(req, res, userId, startTime);
      return;
    }

    // Create a new watchlist
    const watchlist = await prisma.watchlist.create({
      data: {
        name,
        userId,
      },
    });

    // Log successful API usage
    await logApiUsage(req, res, userId, startTime);

    return res.status(201).json({ 
      watchlist,
      message: 'Watchlist created successfully'
    });
  }
  
  // GET: Get all user's watchlists
  else if (req.method === 'GET') {
    const watchlists = await prisma.watchlist.findMany({
      where: { userId },
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

    // Log successful API usage
    await logApiUsage(req, res, userId, startTime);

    return res.status(200).json({ 
      watchlists,
      counts: countsMap
    });
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
});