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

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    });

    if (!userProfile || userProfile.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // GET: Fetch user activity
    if (req.method === 'GET') {
      const userId = req.query.userId as string | undefined;
      const action = req.query.action as string | undefined;
      const limit = parseInt(req.query.limit as string || '50');
      const offset = parseInt(req.query.offset as string || '0');
      
      const whereClause: any = {};
      if (userId) whereClause.userId = userId;
      if (action) whereClause.action = action;
      
      // Get total count for pagination
      const totalCount = await prisma.userActivity.count({
        where: whereClause
      });
      
      // Get activities with pagination
      const activities = await prisma.userActivity.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      });
      
      // If userId is provided, get user details
      let userData = null;
      if (userId) {
        userData = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
            lastLogin: true,
            isActive: true
          }
        });
      }
      
      return res.status(200).json({ 
        activities,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        user: userData
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling user activity request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}