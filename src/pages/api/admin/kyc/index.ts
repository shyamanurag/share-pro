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

    // GET: Fetch all KYC requests
    if (req.method === 'GET') {
      const status = req.query.status as string | undefined;
      const userId = req.query.userId as string | undefined;
      
      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (userId) whereClause.userId = userId;
      
      const kycRequests = await prisma.kycDetail.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return res.status(200).json({ kycRequests });
    }
    
    // POST: Not allowed at admin endpoint
    if (req.method === 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use /api/user/kyc for submissions' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling KYC admin request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}