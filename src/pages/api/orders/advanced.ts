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
      type, // "BUY" or "SELL"
      orderType, // "MARKET", "LIMIT", "STOP_LOSS", "STOP_LIMIT"
      quantity,
      limitPrice, // Required for LIMIT and STOP_LIMIT orders
      stopPrice, // Required for STOP_LOSS and STOP_LIMIT orders
      expiryDate, // Optional, for GTC (Good Till Cancelled) orders
    } = req.body;

    // Validate required fields
    if (!stockId || !type || !orderType || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate order type specific fields
    if ((orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && !limitPrice) {
      return res.status(400).json({ error: 'Limit price is required for LIMIT and STOP_LIMIT orders' });
    }

    if ((orderType === 'STOP_LOSS' || orderType === 'STOP_LIMIT') && !stopPrice) {
      return res.status(400).json({ error: 'Stop price is required for STOP_LOSS and STOP_LIMIT orders' });
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

    // For market orders, execute immediately
    if (orderType === 'MARKET') {
      // Calculate total cost
      const total = quantity * stock.currentPrice;

      // Check if user has enough balance for BUY orders
      if (type === 'BUY' && dbUser.balance < total) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // For SELL orders, check if user owns enough shares
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

      // Create the transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          stockId,
          type,
          orderType,
          quantity,
          price: stock.currentPrice,
          total,
          status: 'COMPLETED',
        },
      });

      // Update user balance
      await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: type === 'BUY' 
            ? dbUser.balance - total 
            : dbUser.balance + total,
        },
      });

      // Update portfolio
      if (type === 'BUY') {
        // Get user's default portfolio or create one
        let portfolio = await prisma.portfolio.findFirst({
          where: { userId: user.id },
        });

        if (!portfolio) {
          portfolio = await prisma.portfolio.create({
            data: {
              userId: user.id,
              name: 'Default Portfolio',
            },
          });
        }

        // Check if user already owns this stock
        const existingItem = await prisma.portfolioItem.findFirst({
          where: {
            portfolioId: portfolio.id,
            stockId,
          },
        });

        if (existingItem) {
          // Update existing portfolio item
          const newTotalShares = existingItem.quantity + quantity;
          const newTotalCost = existingItem.avgBuyPrice * existingItem.quantity + total;
          const newAvgPrice = newTotalCost / newTotalShares;

          await prisma.portfolioItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: newTotalShares,
              avgBuyPrice: newAvgPrice,
            },
          });
        } else {
          // Create new portfolio item
          await prisma.portfolioItem.create({
            data: {
              portfolioId: portfolio.id,
              stockId,
              quantity,
              avgBuyPrice: stock.currentPrice,
            },
          });
        }
      } else if (type === 'SELL') {
        // Find the portfolio item
        const portfolio = await prisma.portfolio.findFirst({
          where: { userId: user.id },
        });

        if (portfolio) {
          const portfolioItem = await prisma.portfolioItem.findFirst({
            where: {
              portfolioId: portfolio.id,
              stockId,
            },
          });

          if (portfolioItem) {
            if (portfolioItem.quantity === quantity) {
              // Remove the item if selling all shares
              await prisma.portfolioItem.delete({
                where: { id: portfolioItem.id },
              });
            } else {
              // Update the quantity
              await prisma.portfolioItem.update({
                where: { id: portfolioItem.id },
                data: {
                  quantity: portfolioItem.quantity - quantity,
                },
              });
            }
          }
        }
      }

      return res.status(200).json({ 
        success: true, 
        transaction,
        message: `${type === 'BUY' ? 'Purchase' : 'Sale'} completed successfully` 
      });
    } 
    // For non-market orders, create a pending transaction
    else {
      // For limit orders, we'll create a pending transaction
      const pendingTransaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          stockId,
          type,
          orderType,
          quantity,
          price: stock.currentPrice, // Current price for reference
          total: quantity * (limitPrice || stock.currentPrice), // Estimated total
          status: 'PENDING',
          limitPrice,
          stopPrice,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        },
      });

      // In a real system, we would now set up a job to monitor this order
      // For this demo, we'll just return the pending transaction

      return res.status(200).json({ 
        success: true, 
        transaction: pendingTransaction,
        message: `${type === 'BUY' ? 'Buy' : 'Sell'} order placed successfully` 
      });
    }
  } catch (error) {
    console.error('Error processing advanced order:', error);
    return res.status(500).json({ error: 'Failed to process order' });
  }
}