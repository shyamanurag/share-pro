import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';

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

// Simplified wrapper for endpoints that require authentication
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
      
      // Call the handler with the authenticated user's ID
      return handler(req, res, user.id);
    } catch (error) {
      console.error('Authentication error:', error);
      
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Failed to authenticate request'
      });
    }
  };
}

// Simplified logging functions that won't cause errors
export async function logAuthEvent(userId: string, req: NextApiRequest, success: boolean) {
  // Simplified to just log to console
  console.log(`Auth event: user=${userId}, success=${success}`);
}

export async function logApiUsage(req: NextApiRequest, res: NextApiResponse, userId?: string, startTime?: number) {
  // Simplified to just log to console
  console.log(`API usage: endpoint=${req.url}, method=${req.method}, userId=${userId || 'unknown'}, status=${res.statusCode}`);
}