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
      limitPrice,          // Take profit price
      stopPrice,           // Stop loss price
    } = req.body;

    // Validate required fields
    if (!stockId || !type || !quantity || !limitPrice || !stopPrice) {
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

    // Validate prices for BUY OCO
    if (type === 'BUY' && limitPrice <= stopPrice) {
      return res.status(400).json({ error: 'For BUY OCO, limit price must be greater than stop price' });
    }

    // Validate prices for SELL OCO
    if (type === 'SELL' && limitPrice >= stopPrice) {
      return res.status(400).json({ error: 'For SELL OCO, limit price must be less than stop price' });
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

    // For SELL OCO, check if user has enough shares
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

    // For BUY OCO, calculate maximum cost
    if (type === 'BUY') {
      // Use the higher of current price or limit price for max cost calculation
      const maxPrice = Math.max(stock.currentPrice, limitPrice);
      const maxCost = maxPrice * quantity;
      
      if (dbUser.balance < maxCost) {
        return res.status(400).json({ error: 'Insufficient balance for potential purchase' });
      }
    }

    // Create the OCO order
    // In a real implementation, you would have a dedicated table for OCO orders
    // For this demo, we'll create two linked transactions with a special status

    // Create the limit order part
    const limitOrder = await prisma.transaction.create({
      data: {
        userId: user.id,
        stockId,
        type,
        orderType: 'OCO_LIMIT',
        quantity,
        price: stock.currentPrice, // Current price for reference
        total: quantity * limitPrice, // Estimated total based on limit price
        status: 'PENDING',
        limitPrice,
        stopPrice: null,
        expiryDate: null,
      },
    });

    // Create the stop order part
    const stopOrder = await prisma.transaction.create({
      data: {
        userId: user.id,
        stockId,
        type,
        orderType: 'OCO_STOP',
        quantity,
        price: stock.currentPrice, // Current price for reference
        total: quantity * stopPrice, // Estimated total based on stop price
        status: 'PENDING',
        limitPrice: null,
        stopPrice,
        expiryDate: null,
      },
    });

    // In a real system, we would now set up a job to monitor this OCO order
    // For this demo, we'll just return the order details

    return res.status(200).json({ 
      success: true, 
      ocoOrder: {
        limitOrder,
        stopOrder,
      },
      message: `OCO ${type.toLowerCase()} order placed successfully`,
      details: {
        stockSymbol: stock.symbol,
        stockName: stock.name,
        currentPrice: stock.currentPrice,
        limitPrice,
        stopPrice,
      }
    });
  } catch (error) {
    console.error('Error creating OCO order:', error);
    return res.status(500).json({ error: 'Failed to create OCO order' });
  }
}