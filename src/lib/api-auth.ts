import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

// Types for the handler functions
export type AuthenticatedHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) => Promise<void>;

export type ResourceOwnerHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  isOwner: boolean
) => Promise<void>;

// Wrapper for endpoints that require authentication
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const supabase = createClient(req, res);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'You must be logged in to access this resource'
        });
      }
      
      // Log authentication success
      await logAuthEvent(user.id, req, true);
      
      // Call the handler with the authenticated user's ID
      return handler(req, res, user.id);
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Log authentication failure
      await logAuthEvent('unknown', req, false);
      
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Failed to authenticate request'
      });
    }
  };
}

// Wrapper for endpoints that require resource ownership verification
export function withResourceOwner(
  resourceType: string,
  resourceIdParam: string,
  handler: ResourceOwnerHandler
) {
  return withAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string) => {
    try {
      const resourceId = req.query[resourceIdParam] as string;
      
      if (!resourceId) {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: `Missing resource ID parameter: ${resourceIdParam}`
        });
      }
      
      // Check resource ownership based on resource type
      let isOwner = false;
      
      switch (resourceType) {
        case 'watchlist':
          const watchlist = await prisma.watchlist.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          isOwner = watchlist?.userId === userId;
          break;
          
        case 'portfolio':
          const portfolio = await prisma.portfolio.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          isOwner = portfolio?.userId === userId;
          break;
          
        case 'transaction':
          const transaction = await prisma.transaction.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          isOwner = transaction?.userId === userId;
          break;
          
        case 'futuresPosition':
          const futuresPosition = await prisma.futuresPosition.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          isOwner = futuresPosition?.userId === userId;
          break;
          
        case 'optionsPosition':
          const optionsPosition = await prisma.optionsPosition.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          isOwner = optionsPosition?.userId === userId;
          break;
          
        default:
          return res.status(400).json({ 
            error: 'Bad Request',
            message: `Unsupported resource type: ${resourceType}`
          });
      }
      
      // Call the handler with ownership information
      return handler(req, res, userId, isOwner);
    } catch (error) {
      console.error('Resource ownership verification error:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to verify resource ownership'
      });
    }
  });
}

// Function to log authentication events
async function logAuthEvent(
  userId: string,
  req: NextApiRequest,
  success: boolean
) {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    await prisma.loginHistory.create({
      data: {
        userId,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
        userAgent,
        status: success ? 'SUCCESS' : 'FAILED',
      }
    });
  } catch (error) {
    // Don't let logging errors affect the main flow
    console.error('Error logging auth event:', error);
  }
}

// Function to log API usage
export async function logApiUsage(
  req: NextApiRequest,
  res: NextApiResponse,
  userId?: string,
  startTime?: number
) {
  try {
    const endTime = Date.now();
    const responseTime = startTime ? endTime - startTime : 0;
    
    await prisma.apiUsage.create({
      data: {
        endpoint: req.url || 'unknown',
        method: req.method || 'unknown',
        userId: userId || null,
        statusCode: res.statusCode,
        responseTime,
      }
    });
  } catch (error) {
    // Don't let logging errors affect the main flow
    console.error('Error logging API usage:', error);
  }
}