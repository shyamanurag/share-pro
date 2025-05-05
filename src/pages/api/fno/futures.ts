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
      return getFuturesContracts(req, res);
    case 'POST':
      return tradeFuturesContract(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get available futures contracts
async function getFuturesContracts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { stockId } = req.query;

    let whereClause = {};
    
    // If stockId is provided, filter by that stock
    if (stockId && typeof stockId === 'string') {
      whereClause = { stockId };
    }

    // Get futures contracts
    const futuresContracts = await prisma.futuresContract.findMany({
      where: whereClause,
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
            currentPrice: true,
            sector: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return res.status(200).json({ futuresContracts });
  } catch (error) {
    console.error('Error fetching futures contracts:', error);
    return res.status(500).json({ error: 'Failed to fetch futures contracts' });
  }
}

// Trade a futures contract (buy or sell)
async function tradeFuturesContract(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const {
      futuresContractId,
      quantity, // In lots
      type, // "BUY" or "SELL"
    } = req.body;

    // Validate required fields
    if (!futuresContractId || !quantity || !type) {
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

    // Get the futures contract
    const futuresContract = await prisma.futuresContract.findUnique({
      where: { id: futuresContractId },
    });

    if (!futuresContract) {
      return res.status(404).json({ error: 'Futures contract not found' });
    }

    // Get the user
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate required margin
    const requiredMargin = futuresContract.marginRequired * quantity;

    // Check if user has enough balance for the margin
    if (dbUser.balance < requiredMargin) {
      return res.status(400).json({ error: 'Insufficient balance for margin requirement' });
    }

    // Check if user already has a position in this contract
    const existingPosition = await prisma.futuresPosition.findUnique({
      where: {
        userId_futuresContractId: {
          userId,
          futuresContractId,
        },
      },
    });

    let position;

    if (existingPosition) {
      // If user already has a position, update it
      if (type === 'BUY' && existingPosition.quantity < 0) {
        // If user is buying and has a short position, reduce the short position
        const newQuantity = existingPosition.quantity + quantity;
        
        if (newQuantity === 0) {
          // If the position is closed, delete it
          await prisma.futuresPosition.delete({
            where: { id: existingPosition.id },
          });
          
          // Return margin to user's balance
          await prisma.user.update({
            where: { id: userId },
            data: {
              balance: dbUser.balance + Math.abs(existingPosition.quantity) * futuresContract.marginRequired,
            },
          });
          
          return res.status(200).json({
            success: true,
            message: 'Futures position closed successfully',
          });
        } else if (newQuantity > 0) {
          // If position changes from short to long
          position = await prisma.futuresPosition.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQuantity,
              entryPrice: futuresContract.contractPrice,
              currentPrice: futuresContract.contractPrice,
              margin: newQuantity * futuresContract.marginRequired,
              pnl: 0, // Reset PnL for new position
            },
          });
          
          // Adjust user's balance for the difference in margin
          const marginDifference = Math.abs(existingPosition.quantity) * futuresContract.marginRequired - 
                                  newQuantity * futuresContract.marginRequired;
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              balance: dbUser.balance + marginDifference,
            },
          });
        } else {
          // If still short but with less quantity
          position = await prisma.futuresPosition.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQuantity,
              entryPrice: ((existingPosition.entryPrice * Math.abs(existingPosition.quantity)) - 
                          (futuresContract.contractPrice * quantity)) / Math.abs(newQuantity),
              currentPrice: futuresContract.contractPrice,
              margin: Math.abs(newQuantity) * futuresContract.marginRequired,
              pnl: (existingPosition.entryPrice - futuresContract.contractPrice) * Math.abs(newQuantity),
            },
          });
          
          // Return excess margin to user's balance
          const marginReturned = quantity * futuresContract.marginRequired;
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              balance: dbUser.balance + marginReturned,
            },
          });
        }
      } else if (type === 'SELL' && existingPosition.quantity > 0) {
        // If user is selling and has a long position, reduce the long position
        const newQuantity = existingPosition.quantity - quantity;
        
        if (newQuantity === 0) {
          // If the position is closed, delete it
          await prisma.futuresPosition.delete({
            where: { id: existingPosition.id },
          });
          
          // Return margin to user's balance
          await prisma.user.update({
            where: { id: userId },
            data: {
              balance: dbUser.balance + existingPosition.quantity * futuresContract.marginRequired,
            },
          });
          
          return res.status(200).json({
            success: true,
            message: 'Futures position closed successfully',
          });
        } else if (newQuantity < 0) {
          // If position changes from long to short
          position = await prisma.futuresPosition.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQuantity,
              entryPrice: futuresContract.contractPrice,
              currentPrice: futuresContract.contractPrice,
              margin: Math.abs(newQuantity) * futuresContract.marginRequired,
              pnl: 0, // Reset PnL for new position
            },
          });
          
          // Adjust user's balance for the difference in margin
          const marginDifference = existingPosition.quantity * futuresContract.marginRequired - 
                                  Math.abs(newQuantity) * futuresContract.marginRequired;
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              balance: dbUser.balance + marginDifference,
            },
          });
        } else {
          // If still long but with less quantity
          position = await prisma.futuresPosition.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQuantity,
              entryPrice: ((existingPosition.entryPrice * existingPosition.quantity) - 
                          (futuresContract.contractPrice * quantity)) / newQuantity,
              currentPrice: futuresContract.contractPrice,
              margin: newQuantity * futuresContract.marginRequired,
              pnl: (futuresContract.contractPrice - existingPosition.entryPrice) * newQuantity,
            },
          });
          
          // Return excess margin to user's balance
          const marginReturned = quantity * futuresContract.marginRequired;
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              balance: dbUser.balance + marginReturned,
            },
          });
        }
      } else {
        // If user is adding to their existing position (long buying more or short selling more)
        const newQuantity = type === 'BUY' 
          ? existingPosition.quantity + quantity 
          : existingPosition.quantity - quantity;
        
        const newEntryPrice = type === 'BUY'
          ? ((existingPosition.entryPrice * existingPosition.quantity) + 
             (futuresContract.contractPrice * quantity)) / newQuantity
          : ((existingPosition.entryPrice * Math.abs(existingPosition.quantity)) + 
             (futuresContract.contractPrice * quantity)) / Math.abs(newQuantity);
        
        position = await prisma.futuresPosition.update({
          where: { id: existingPosition.id },
          data: {
            quantity: newQuantity,
            entryPrice: newEntryPrice,
            currentPrice: futuresContract.contractPrice,
            margin: Math.abs(newQuantity) * futuresContract.marginRequired,
            pnl: type === 'BUY'
              ? (futuresContract.contractPrice - newEntryPrice) * newQuantity
              : (newEntryPrice - futuresContract.contractPrice) * Math.abs(newQuantity),
          },
        });
        
        // Deduct additional margin from user's balance
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: dbUser.balance - quantity * futuresContract.marginRequired,
          },
        });
      }
    } else {
      // If user doesn't have a position, create a new one
      const positionQuantity = type === 'BUY' ? quantity : -quantity;
      
      position = await prisma.futuresPosition.create({
        data: {
          userId,
          futuresContractId,
          quantity: positionQuantity,
          entryPrice: futuresContract.contractPrice,
          currentPrice: futuresContract.contractPrice,
          margin: requiredMargin,
          pnl: 0, // Initial PnL is zero
        },
      });
      
      // Deduct margin from user's balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: dbUser.balance - requiredMargin,
        },
      });
    }

    return res.status(200).json({
      success: true,
      position,
      message: `Futures ${type === 'BUY' ? 'buy' : 'sell'} order executed successfully`,
    });
  } catch (error) {
    console.error('Error trading futures contract:', error);
    return res.status(500).json({ error: 'Failed to trade futures contract' });
  }
}