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
      type,                // "BUY" or "SELL"
      quantity,
      trailingAmount,      // Fixed amount for trailing stop
      trailingPercent,     // Percentage for trailing stop
      activationPrice,     // Price at which trailing stop becomes active
    } = req.body;

    // Validate required fields
    if (!stockId || !type || !quantity || (!trailingAmount && !trailingPercent)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate type
    if (type !== 'BUY' && type !== 'SELL') {
      return res.status(400).json({ error: 'Type must be either BUY or SELL' });
    }

    // Validate quantity
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // Get the stock
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Get the user
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For SELL trailing stop, check if user has enough shares
    if (type === 'SELL') {
      const portfolioItem = await prisma.portfolioItem.findFirst({
        where: {
          portfolio: {
            userId: user.id,
          },
          stockId,
        },
      });

      if (!portfolioItem || portfolioItem.quantity < quantity) {
        return res.status(400).json({ error: 'Not enough shares to sell' });
      }
    }

    // For BUY trailing stop, calculate maximum cost
    if (type === 'BUY') {
      const maxCost = stock.currentPrice * quantity;
      
      if (dbUser.balance < maxCost) {
        return res.status(400).json({ error: 'Insufficient balance for potential purchase' });
      }
    }

    // Calculate trailing stop values
    const trailingValue = trailingAmount || (stock.currentPrice * (trailingPercent / 100));
    const initialStopPrice = type === 'SELL' 
      ? stock.currentPrice - trailingValue 
      : stock.currentPrice + trailingValue;

    // Create the trailing stop order in the Transaction table with a special status
    const trailingStopOrder = await prisma.transaction.create({
      data: {
        userId: user.id,
        stockId,
        type,
        orderType: 'TRAILING_STOP',
        quantity,
        price: stock.currentPrice, // Current price for reference
        total: quantity * stock.currentPrice, // Estimated total
        status: 'PENDING',
        limitPrice: null,
        stopPrice: initialStopPrice,
        // Store trailing parameters in a JSON field
        // In a real implementation, you would have a dedicated table for trailing stops
        // For this demo, we'll use the existing Transaction model
        expiryDate: null,
      },
    });

    // In a real system, we would now set up a job to monitor this trailing stop
    // For this demo, we'll just return the order details

    return res.status(200).json({ 
      success: true, 
      trailingStopOrder,
      message: `Trailing stop ${type.toLowerCase()} order placed successfully`,
      details: {
        stockSymbol: stock.symbol,
        stockName: stock.name,
        currentPrice: stock.currentPrice,
        trailingValue,
        initialStopPrice,
        activationPrice: activationPrice || stock.currentPrice,
      }
    });
  } catch (error) {
    console.error('Error creating trailing stop order:', error);
    return res.status(500).json({ error: 'Failed to create trailing stop order' });
  }
}