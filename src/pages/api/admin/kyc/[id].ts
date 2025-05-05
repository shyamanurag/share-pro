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

    const kycId = req.query.id as string;
    
    // GET: Fetch specific KYC request
    if (req.method === 'GET') {
      const kycDetail = await prisma.kycDetail.findUnique({
        where: { id: kycId },
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
        }
      });
      
      if (!kycDetail) {
        return res.status(404).json({ error: 'KYC request not found' });
      }
      
      return res.status(200).json({ kycDetail });
    }
    
    // PUT: Update KYC status (approve/reject)
    if (req.method === 'PUT') {
      const { status, rejectionReason } = req.body;
      
      if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      if (status === 'REJECTED' && !rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }
      
      const kycDetail = await prisma.kycDetail.findUnique({
        where: { id: kycId }
      });
      
      if (!kycDetail) {
        return res.status(404).json({ error: 'KYC request not found' });
      }
      
      const updatedKyc = await prisma.kycDetail.update({
        where: { id: kycId },
        data: {
          status,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
          verifiedBy: user.id,
          verifiedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });
      
      // Log the action
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          source: 'KYC_VERIFICATION',
          message: `KYC ${status.toLowerCase()} for user ${updatedKyc.user.email}`,
          details: JSON.stringify({
            kycId,
            userId: updatedKyc.userId,
            status,
            adminId: user.id,
            timestamp: new Date()
          })
        }
      });
      
      // Create user notification
      await prisma.userNotification.create({
        data: {
          userId: updatedKyc.userId,
          title: `KYC Verification ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
          message: status === 'APPROVED' 
            ? 'Your KYC verification has been approved. You can now access all platform features.'
            : `Your KYC verification has been rejected. Reason: ${rejectionReason}`,
          type: 'KYC_UPDATE'
        }
      });
      
      return res.status(200).json({ 
        success: true,
        message: `KYC request ${status.toLowerCase()} successfully`,
        kycDetail: updatedKyc
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling KYC admin action:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}