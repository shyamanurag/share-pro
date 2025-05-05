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

    const paymentId = req.query.id as string;
    
    // GET: Fetch specific payment request
    if (req.method === 'GET') {
      const paymentRequest = await prisma.paymentRequest.findUnique({
        where: { id: paymentId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              balance: true
            }
          }
        }
      });
      
      if (!paymentRequest) {
        return res.status(404).json({ error: 'Payment request not found' });
      }
      
      return res.status(200).json({ paymentRequest });
    }
    
    // PUT: Update payment status (approve/reject)
    if (req.method === 'PUT') {
      const { status, rejectionReason, transactionId } = req.body;
      
      if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      if (status === 'REJECTED' && !rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }
      
      const paymentRequest = await prisma.paymentRequest.findUnique({
        where: { id: paymentId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              balance: true
            }
          }
        }
      });
      
      if (!paymentRequest) {
        return res.status(404).json({ error: 'Payment request not found' });
      }
      
      // Start a transaction to update payment status and user balance if approved
      const result = await prisma.$transaction(async (prisma) => {
        // Update payment request
        const updatedPayment = await prisma.paymentRequest.update({
          where: { id: paymentId },
          data: {
            status,
            rejectionReason: status === 'REJECTED' ? rejectionReason : null,
            transactionId: status === 'APPROVED' ? (transactionId || `TXN-${Date.now()}`) : null,
            approvedBy: status === 'APPROVED' ? user.id : null,
            approvedAt: status === 'APPROVED' ? new Date() : null
          }
        });
        
        // If approved, update user balance
        let updatedUser = paymentRequest.user;
        if (status === 'APPROVED') {
          updatedUser = await prisma.user.update({
            where: { id: paymentRequest.userId },
            data: {
              balance: { increment: paymentRequest.amount }
            }
          });
        }
        
        return { updatedPayment, updatedUser };
      });
      
      // Log the action
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          source: 'PAYMENT_VERIFICATION',
          message: `Payment ${status.toLowerCase()} for user ${paymentRequest.user.email}`,
          details: JSON.stringify({
            paymentId,
            userId: paymentRequest.userId,
            amount: paymentRequest.amount,
            status,
            adminId: user.id,
            timestamp: new Date()
          })
        }
      });
      
      // Create user notification
      await prisma.userNotification.create({
        data: {
          userId: paymentRequest.userId,
          title: `Payment ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
          message: status === 'APPROVED' 
            ? `Your payment of ₹${paymentRequest.amount.toFixed(2)} has been approved and added to your account.`
            : `Your payment of ₹${paymentRequest.amount.toFixed(2)} has been rejected. Reason: ${rejectionReason}`,
          type: 'PAYMENT_UPDATE'
        }
      });
      
      return res.status(200).json({ 
        success: true,
        message: `Payment request ${status.toLowerCase()} successfully`,
        paymentRequest: result.updatedPayment,
        user: status === 'APPROVED' ? {
          id: result.updatedUser.id,
          balance: result.updatedUser.balance
        } : undefined
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling payment admin action:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}