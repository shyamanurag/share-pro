import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(req, res);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getMarginInfo(req, res, user.id);
    case 'POST':
      return executeMarginTrade(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get user's margin trading information
async function getMarginInfo(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    // Get the user
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's portfolio value
    const portfolioItems = await prisma.portfolioItem.findMany({
      where: {
        portfolio: {
          userId,
        },
      },
      include: {
        stock: true,
      },
    });

    const portfolioValue = portfolioItems.reduce(
      (total, item) => total + item.quantity * item.stock.currentPrice,
      0
    );

    // Calculate margin parameters
    // In a real system, these would be based on user's risk profile, account history, etc.
    const marginMultiplier = 2; // 2x leverage
    const marginAvailable = dbUser.balance * marginMultiplier;
    const marginUsed = 0; // In a real system, this would be calculated from margin positions
    const marginRemaining = marginAvailable - marginUsed;
    const maintenanceMargin = marginUsed * 0.3; // 30% maintenance margin requirement
    const marginCallThreshold = marginUsed * 0.4; // 40% margin call threshold

    // Get margin interest rate
    const marginInterestRate = 8.0; // 8% annual interest rate

    return res.status(200).json({
      marginInfo: {
        accountBalance: dbUser.balance,
        portfolioValue,
        totalEquity: dbUser.balance + portfolioValue,
        marginMultiplier,
        marginAvailable,
        marginUsed,
        marginRemaining,
        maintenanceMargin,
        marginCallThreshold,
        marginInterestRate,
      },
    });
  } catch (error) {
    console.error('Error fetching margin info:', error);
    return res.status(500).json({ error: 'Failed to fetch margin info' });
  }
}

// Execute a margin trade
async function executeMarginTrade(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const {
      stockId,
      type,           // "BUY" or "SELL"
      quantity,
      leverage,       // Leverage multiplier (e.g., 2 for 2x leverage)
    } = req.body;

    // Validate required fields
    if (!stockId || !type || !quantity || !leverage) {
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

    // Validate leverage
    if (leverage < 1 || leverage > 5) {
      return res.status(400).json({ error: 'Leverage must be between 1 and 5' });
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
      where: { id: userId },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate trade details
    const totalValue = stock.currentPrice * quantity;
    const marginRequired = totalValue / leverage;

    // Check if user has enough balance for the margin requirement
    if (dbUser.balance < marginRequired) {
      return res.status(400).json({ error: 'Insufficient balance for margin requirement' });
    }

    // In a real system, you would create a margin position record
    // For this demo, we'll create a transaction with a special type

    // Create the margin trade transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        stockId,
        type,
        orderType: 'MARGIN',
        quantity,
        price: stock.currentPrice,
        total: totalValue,
        status: 'COMPLETED',
        // Store margin details in a JSON field
        // In a real implementation, you would have a dedicated table for margin positions
      },
    });

    // Update user's balance (deduct margin requirement)
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: dbUser.balance - marginRequired,
      },
    });

    // Get or create user's portfolio
    let portfolio = await prisma.portfolio.findFirst({
      where: { userId },
    });

    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          userId,
          name: 'Default Portfolio',
        },
      });
    }

    // Update portfolio for BUY orders
    if (type === 'BUY') {
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
        const newTotalCost = existingItem.avgBuyPrice * existingItem.quantity + totalValue;
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
    }

    return res.status(200).json({
      success: true,
      transaction,
      marginDetails: {
        totalValue,
        marginRequired,
        leverage,
        remainingBalance: dbUser.balance - marginRequired,
      },
      message: `Margin ${type.toLowerCase()} order executed successfully`,
    });
  } catch (error) {
    console.error('Error executing margin trade:', error);
    return res.status(500).json({ error: 'Failed to execute margin trade' });
  }
}