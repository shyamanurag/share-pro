import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';
import { 
  roundCurrency, 
  calculateTransactionTotal, 
  calculateNewAverageBuyPrice,
  validateTransactionInput,
  hasSufficientBalance,
  hasSufficientShares
} from '@/lib/accounting';
import { executeWithRetry, executeTransaction } from '@/lib/db-connection';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // GET: Fetch user's transaction history
    if (req.method === 'GET') {
      const transactions = await executeWithRetry(async () => {
        return prisma.transaction.findMany({
          where: { userId: user.id },
          include: { stock: true },
          orderBy: { timestamp: 'desc' },
        });
      });

      // Log successful API call
      try {
        await prisma.systemLog.create({
          data: {
            level: 'INFO',
            source: 'API_TRANSACTIONS',
            message: `Successfully fetched ${transactions.length} transactions for user ${user.id}`,
          }
        });
      } catch (error) {
        console.warn('Failed to log API call:', error);
      }

      return res.status(200).json({ transactions });
    }
    
    // POST: Create a new transaction (buy or sell)
    else if (req.method === 'POST') {
      const { stockId, type, quantity } = req.body;
      
      // Validate transaction input
      const validationError = validateTransactionInput(stockId, type, quantity);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      // Get stock details with retry logic
      const stock = await executeWithRetry(async () => {
        return prisma.stock.findUnique({
          where: { id: stockId },
        });
      });

      if (!stock) {
        return res.status(404).json({ error: 'Stock not found' });
      }

      // Get user's current balance with retry logic
      const userData = await executeWithRetry(async () => {
        return prisma.user.findUnique({
          where: { id: user.id },
          select: { balance: true },
        });
      });

      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate transaction total using accounting utility
      const total = calculateTransactionTotal(stock.currentPrice, quantity);

      // Find or create user's portfolio with retry logic
      let portfolio = await executeWithRetry(async () => {
        return prisma.portfolio.findFirst({
          where: { userId: user.id },
        });
      });

      if (!portfolio) {
        portfolio = await executeWithRetry(async () => {
          return prisma.portfolio.create({
            data: {
              name: 'My Portfolio',
              userId: user.id,
            },
          });
        });
      }

      // Process transaction based on type using a transaction to ensure data consistency
      let transaction;
      
      if (type === 'BUY') {
        // Check if user has enough balance using accounting utility
        if (!hasSufficientBalance(userData.balance, total)) {
          return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Execute all database operations in a transaction with retry logic
        transaction = await executeTransaction(async (tx) => {
          // Update user's balance
          await tx.user.update({
            where: { id: user.id },
            data: { balance: userData.balance - total },
          });

          // Find existing portfolio item or create new one
          const existingItem = await tx.portfolioItem.findFirst({
            where: {
              portfolioId: portfolio.id,
              stockId: stockId,
            },
          });

          if (existingItem) {
            // Update existing portfolio item using accounting utility
            const newQuantity = existingItem.quantity + quantity;
            const newAvgBuyPrice = calculateNewAverageBuyPrice(
              existingItem.avgBuyPrice, 
              existingItem.quantity, 
              stock.currentPrice, 
              quantity
            );
            
            await tx.portfolioItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: newQuantity,
                avgBuyPrice: newAvgBuyPrice,
              },
            });
          } else {
            // Create new portfolio item
            await tx.portfolioItem.create({
              data: {
                portfolioId: portfolio.id,
                stockId: stockId,
                quantity: quantity,
                avgBuyPrice: stock.currentPrice,
              },
            });
          }

          // Create transaction record with proper order type
          const newTransaction = await tx.transaction.create({
            data: {
              userId: user.id,
              stockId: stockId,
              type: type,
              quantity: quantity,
              price: stock.currentPrice,
              total: total,
              orderType: 'MARKET', // Default to MARKET order type
              status: 'COMPLETED',
            },
            include: { stock: true },
          });

          // Log the transaction in system logs for audit purposes
          await tx.systemLog.create({
            data: {
              level: 'INFO',
              source: 'TRANSACTION',
              message: `User ${user.id} bought ${quantity} shares of ${stock.symbol} at ₹${stock.currentPrice}`,
              details: JSON.stringify({
                userId: user.id,
                stockId: stockId,
                type: type,
                quantity: quantity,
                price: stock.currentPrice,
                total: total,
                timestamp: new Date(),
              }),
            },
          });
          
          return newTransaction;
        });
      } 
      else if (type === 'SELL') {
        // Check if user has the stock in portfolio with retry logic
        const portfolioItem = await executeWithRetry(async () => {
          return prisma.portfolioItem.findFirst({
            where: {
              portfolioId: portfolio.id,
              stockId: stockId,
            },
          });
        });

        if (!portfolioItem) {
          return res.status(400).json({ error: 'Stock not in portfolio' });
        }

        // Check if user has enough shares using accounting utility
        if (!hasSufficientShares(portfolioItem.quantity, quantity)) {
          return res.status(400).json({ error: 'Not enough shares to sell' });
        }

        // Execute all database operations in a transaction with retry logic
        transaction = await executeTransaction(async (tx) => {
          // Update user's balance
          await tx.user.update({
            where: { id: user.id },
            data: { balance: userData.balance + total },
          });

          // Update portfolio item
          const newQuantity = portfolioItem.quantity - quantity;
          
          if (newQuantity === 0) {
            // Remove portfolio item if no shares left
            await tx.portfolioItem.delete({
              where: { id: portfolioItem.id },
            });
          } else {
            // Update portfolio item quantity
            await tx.portfolioItem.update({
              where: { id: portfolioItem.id },
              data: { quantity: newQuantity },
            });
          }

          // Create transaction record with proper order type
          const newTransaction = await tx.transaction.create({
            data: {
              userId: user.id,
              stockId: stockId,
              type: type,
              quantity: quantity,
              price: stock.currentPrice,
              total: total,
              orderType: 'MARKET', // Default to MARKET order type
              status: 'COMPLETED',
            },
            include: { stock: true },
          });

          // Log the transaction in system logs for audit purposes
          await tx.systemLog.create({
            data: {
              level: 'INFO',
              source: 'TRANSACTION',
              message: `User ${user.id} sold ${quantity} shares of ${stock.symbol} at ₹${stock.currentPrice}`,
              details: JSON.stringify({
                userId: user.id,
                stockId: stockId,
                type: type,
                quantity: quantity,
                price: stock.currentPrice,
                total: total,
                timestamp: new Date(),
              }),
            },
          });
          
          return newTransaction;
        });
      }

      return res.status(201).json({ transaction });
    }
    
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error processing transaction:', error);
    
    // Log the error
    try {
      await prisma.systemLog.create({
        data: {
          level: 'ERROR',
          source: 'API_TRANSACTIONS',
          message: 'Failed to process transaction',
          details: error.message || 'Unknown error',
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return res.status(500).json({ 
      error: 'Failed to process transaction',
      message: error.message || 'An unexpected error occurred'
    });
  }
}