import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(req);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getOptionsContracts(req, res);
    case 'POST':
      return tradeOptionsContract(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get available options contracts
async function getOptionsContracts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { stockId, type, strikePrice } = req.query;

    let whereClause: any = {};
    
    // Filter by stock if provided
    if (stockId && typeof stockId === 'string') {
      whereClause.stockId = stockId;
    }
    
    // Filter by option type if provided (CALL or PUT)
    if (type && typeof type === 'string' && ['CALL', 'PUT'].includes(type.toUpperCase())) {
      whereClause.type = type.toUpperCase();
    }
    
    // Filter by strike price if provided
    if (strikePrice && typeof strikePrice === 'string') {
      whereClause.strikePrice = parseFloat(strikePrice);
    }

    // Get options contracts
    const optionsContracts = await prisma.optionsContract.findMany({
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
      orderBy: [
        { expiryDate: 'asc' },
        { strikePrice: 'asc' },
      ],
    });

    return res.status(200).json({ optionsContracts });
  } catch (error) {
    console.error('Error fetching options contracts:', error);
    return res.status(500).json({ error: 'Failed to fetch options contracts' });
  }
}

// Trade an options contract (buy or sell)
async function tradeOptionsContract(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const {
      optionsContractId,
      quantity, // In lots
      type, // "BUY" or "SELL"
    } = req.body;

    // Validate required fields
    if (!optionsContractId || !quantity || !type) {
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

    // Get the options contract
    const optionsContract = await prisma.optionsContract.findUnique({
      where: { id: optionsContractId },
      include: {
        stock: true,
      },
    });

    if (!optionsContract) {
      return res.status(404).json({ error: 'Options contract not found' });
    }

    // Get the user
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate total cost for buying options
    const totalCost = optionsContract.premiumPrice * quantity * optionsContract.lotSize;

    // Check if user has enough balance for buying options
    if (type === 'BUY' && dbUser.balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check if user already has a position in this contract
    const existingPosition = await prisma.optionsPosition.findUnique({
      where: {
        userId_optionsContractId: {
          userId,
          optionsContractId,
        },
      },
    });

    let position;

    if (existingPosition) {
      // If user already has a position, update it
      if (type === 'BUY') {
        // If buying more, increase position
        const newQuantity = existingPosition.quantity + quantity;
        const newEntryPrice = ((existingPosition.entryPrice * existingPosition.quantity) + 
                              (optionsContract.premiumPrice * quantity)) / newQuantity;
        
        position = await prisma.optionsPosition.update({
          where: { id: existingPosition.id },
          data: {
            quantity: newQuantity,
            entryPrice: newEntryPrice,
            currentPrice: optionsContract.premiumPrice,
            pnl: (optionsContract.premiumPrice - newEntryPrice) * newQuantity * optionsContract.lotSize,
          },
        });
        
        // Deduct cost from user's balance
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: dbUser.balance - totalCost,
          },
        });
      } else {
        // If selling, decrease position
        if (existingPosition.quantity < quantity) {
          return res.status(400).json({ error: 'Not enough options to sell' });
        }
        
        const newQuantity = existingPosition.quantity - quantity;
        
        if (newQuantity === 0) {
          // If selling all, delete the position
          await prisma.optionsPosition.delete({
            where: { id: existingPosition.id },
          });
          
          // Add proceeds to user's balance
          await prisma.user.update({
            where: { id: userId },
            data: {
              balance: dbUser.balance + totalCost,
            },
          });
          
          return res.status(200).json({
            success: true,
            message: 'Options position closed successfully',
          });
        } else {
          // If selling some, update the position
          position = await prisma.optionsPosition.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQuantity,
              currentPrice: optionsContract.premiumPrice,
              pnl: (optionsContract.premiumPrice - existingPosition.entryPrice) * newQuantity * optionsContract.lotSize,
            },
          });
          
          // Add proceeds to user's balance
          await prisma.user.update({
            where: { id: userId },
            data: {
              balance: dbUser.balance + totalCost,
            },
          });
        }
      }
    } else {
      // If user doesn't have a position and is trying to sell, error
      if (type === 'SELL') {
        return res.status(400).json({ error: 'Cannot sell options you do not own' });
      }
      
      // Create new position for buying
      position = await prisma.optionsPosition.create({
        data: {
          userId,
          optionsContractId,
          quantity,
          entryPrice: optionsContract.premiumPrice,
          currentPrice: optionsContract.premiumPrice,
          pnl: 0, // Initial PnL is zero
        },
      });
      
      // Deduct cost from user's balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: dbUser.balance - totalCost,
        },
      });
    }

    return res.status(200).json({
      success: true,
      position,
      message: `Options ${type === 'BUY' ? 'buy' : 'sell'} order executed successfully`,
    });
  } catch (error) {
    console.error('Error trading options contract:', error);
    return res.status(500).json({ error: 'Failed to trade options contract' });
  }
}