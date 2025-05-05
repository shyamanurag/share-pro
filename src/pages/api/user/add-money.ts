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

    // Only allow POST method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, paymentMethod } = req.body;
    
    // Validate input
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!paymentMethod || !['UPI', 'CARD'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // In a real app, this would integrate with a payment gateway
    // For this demo, we'll just add the money directly to the user's balance
    
    // Get current user
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user balance
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: userProfile.balance + parseFloat(amount),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        balance: true,
        createdAt: true,
      },
    });

    // Log the transaction in system logs
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        source: 'ADD_MONEY',
        message: `User ${user.id} added ₹${amount} via ${paymentMethod}`,
        details: JSON.stringify({
          userId: user.id,
          amount,
          paymentMethod,
          timestamp: new Date(),
        }),
      },
    });

    // Log user activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'ADD_MONEY',
        details: JSON.stringify({
          amount,
          paymentMethod,
          newBalance: updatedUser.balance,
        }),
      },
    });

    return res.status(200).json({ 
      success: true,
      message: `Successfully added ₹${amount} to your account`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error adding money:', error);
    return res.status(500).json({ error: 'Failed to add money' });
  }
}