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

    // GET: Fetch user's transaction history
    if (req.method === 'GET') {
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        include: { stock: true },
        orderBy: { timestamp: 'desc' },
      });

      return res.status(200).json({ transactions });
    }
    
    // POST: Create a new transaction (buy or sell)
    else if (req.method === 'POST') {
      const { stockId, type, quantity } = req.body;
      
      if (!stockId || !type || !quantity) {
        return res.status(400).json({ error: 'Stock ID, type, and quantity are required' });
      }

      if (type !== 'BUY' && type !== 'SELL') {
        return res.status(400).json({ error: 'Type must be BUY or SELL' });
      }

      if (quantity <= 0 || !Number.isInteger(quantity)) {
        return res.status(400).json({ error: 'Quantity must be a positive integer' });
      }

      // Get stock details
      const stock = await prisma.stock.findUnique({
        where: { id: stockId },
      });

      if (!stock) {
        return res.status(404).json({ error: 'Stock not found' });
      }

      // Get user's current balance
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      });

      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate transaction total
      const total = stock.currentPrice * quantity;

      // Find or create user's portfolio
      let portfolio = await prisma.portfolio.findFirst({
        where: { userId: user.id },
      });

      if (!portfolio) {
        portfolio = await prisma.portfolio.create({
          data: {
            name: 'My Portfolio',
            userId: user.id,
          },
        });
      }

      // Process transaction based on type
      if (type === 'BUY') {
        // Check if user has enough balance
        if (userData.balance < total) {
          return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Update user's balance
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: userData.balance - total },
        });

        // Find existing portfolio item or create new one
        const existingItem = await prisma.portfolioItem.findFirst({
          where: {
            portfolioId: portfolio.id,
            stockId: stockId,
          },
        });

        if (existingItem) {
          // Update existing portfolio item
          const newQuantity = existingItem.quantity + quantity;
          const newAvgBuyPrice = ((existingItem.avgBuyPrice * existingItem.quantity) + total) / newQuantity;
          
          await prisma.portfolioItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: newQuantity,
              avgBuyPrice: newAvgBuyPrice,
            },
          });
        } else {
          // Create new portfolio item
          await prisma.portfolioItem.create({
            data: {
              portfolioId: portfolio.id,
              stockId: stockId,
              quantity: quantity,
              avgBuyPrice: stock.currentPrice,
            },
          });
        }
      } 
      else if (type === 'SELL') {
        // Check if user has the stock in portfolio
        const portfolioItem = await prisma.portfolioItem.findFirst({
          where: {
            portfolioId: portfolio.id,
            stockId: stockId,
          },
        });

        if (!portfolioItem) {
          return res.status(400).json({ error: 'Stock not in portfolio' });
        }

        // Check if user has enough shares
        if (portfolioItem.quantity < quantity) {
          return res.status(400).json({ error: 'Not enough shares to sell' });
        }

        // Update user's balance
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: userData.balance + total },
        });

        // Update portfolio item
        const newQuantity = portfolioItem.quantity - quantity;
        
        if (newQuantity === 0) {
          // Remove portfolio item if no shares left
          await prisma.portfolioItem.delete({
            where: { id: portfolioItem.id },
          });
        } else {
          // Update portfolio item quantity
          await prisma.portfolioItem.update({
            where: { id: portfolioItem.id },
            data: { quantity: newQuantity },
          });
        }
      }

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          stockId: stockId,
          type: type,
          quantity: quantity,
          price: stock.currentPrice,
          total: total,
        },
        include: { stock: true },
      });

      return res.status(201).json({ transaction });
    }
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error processing transaction:', error);
    return res.status(500).json({ error: 'Failed to process transaction' });
  }
}