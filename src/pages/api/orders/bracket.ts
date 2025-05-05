import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the user from Supabase auth
  const supabase = createClient(req, res);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const {
      stockId,
      quantity,
      entryPrice, // Price at which to enter the position
      stopLoss,   // Price at which to exit if the trade goes against you
      takeProfit, // Price at which to take profits
    } = req.body;

    // Validate required fields
    if (!stockId || !quantity || !entryPrice || !stopLoss || !takeProfit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate logical constraints
    if (entryPrice <= 0 || stopLoss <= 0 || takeProfit <= 0) {
      return res.status(400).json({ error: 'Prices must be positive values' });
    }

    // For a buy bracket order, stop loss should be below entry price and take profit above
    if (stopLoss >= entryPrice) {
      return res.status(400).json({ error: 'Stop loss must be below entry price for buy orders' });
    }

    if (takeProfit <= entryPrice) {
      return res.status(400).json({ error: 'Take profit must be above entry price for buy orders' });
    }

    // Get the stock
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Get the user from the database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate total cost
    const total = quantity * entryPrice;

    // Check if user has enough balance
    if (dbUser.balance < total) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create the bracket order
    const bracketOrder = await prisma.bracketOrder.create({
      data: {
        userId: user.id,
        stockId,
        quantity,
        entryPrice,
        stopLoss,
        takeProfit,
        status: 'PENDING', // Order is pending until entry price is hit
      },
    });

    // In a real system, we would now set up a job to monitor this order
    // For this demo, we'll just return the bracket order

    return res.status(200).json({ 
      success: true, 
      bracketOrder,
      message: 'Bracket order placed successfully' 
    });
  } catch (error) {
    console.error('Error processing bracket order:', error);
    return res.status(500).json({ error: 'Failed to process bracket order' });
  }
}