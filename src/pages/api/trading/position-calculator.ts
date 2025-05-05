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
      riskAmount,          // Amount willing to risk in currency
      riskPercentage,      // Percentage of account willing to risk
      stopLossPercentage,  // Stop loss as percentage from entry
      stopLossPrice,       // Specific stop loss price
      entryPrice,          // Entry price for the position
    } = req.body;

    // Validate required fields
    if (!stockId || (!riskAmount && !riskPercentage) || (!stopLossPercentage && !stopLossPrice) || !entryPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the stock
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Get the user's account balance
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's risk profile
    const riskProfile = await prisma.riskProfile.findUnique({
      where: { userId: user.id },
    });

    // Default risk parameters if no profile exists
    const maxPositionSize = riskProfile?.maxPositionSize || 5; // Default 5% of portfolio
    const defaultRiskPerTrade = riskProfile?.riskPerTrade || 1; // Default 1% risk per trade

    // Calculate position size
    let calculatedRiskAmount: number;
    let calculatedStopLossPrice: number;
    let positionSize: number;
    let shares: number;
    let riskRewardRatio: number;
    let marginOfSafety: number;

    // Calculate risk amount
    if (riskAmount) {
      calculatedRiskAmount = riskAmount;
    } else {
      calculatedRiskAmount = (dbUser.balance * (riskPercentage || defaultRiskPerTrade)) / 100;
    }

    // Calculate stop loss price
    if (stopLossPrice) {
      calculatedStopLossPrice = stopLossPrice;
    } else {
      calculatedStopLossPrice = entryPrice * (1 - stopLossPercentage / 100);
    }

    // Calculate risk per share
    const riskPerShare = Math.abs(entryPrice - calculatedStopLossPrice);
    
    if (riskPerShare <= 0) {
      return res.status(400).json({ error: 'Invalid stop loss price' });
    }

    // Calculate number of shares
    shares = Math.floor(calculatedRiskAmount / riskPerShare);
    
    // Calculate total position size
    positionSize = shares * entryPrice;
    
    // Check if position size exceeds max position size
    const maxAllowedPositionSize = (dbUser.balance * maxPositionSize) / 100;
    
    if (positionSize > maxAllowedPositionSize) {
      shares = Math.floor(maxAllowedPositionSize / entryPrice);
      positionSize = shares * entryPrice;
    }
    
    // Calculate risk-reward ratio (assuming 2:1 as default target)
    const targetPrice = entryPrice + (2 * (entryPrice - calculatedStopLossPrice));
    riskRewardRatio = Math.abs((targetPrice - entryPrice) / (entryPrice - calculatedStopLossPrice));
    
    // Calculate margin of safety (how much buffer before stop loss is hit)
    marginOfSafety = Math.abs((entryPrice - calculatedStopLossPrice) / entryPrice) * 100;

    return res.status(200).json({
      success: true,
      calculation: {
        stockSymbol: stock.symbol,
        stockName: stock.name,
        entryPrice,
        stopLossPrice: calculatedStopLossPrice,
        targetPrice,
        shares,
        positionSize,
        riskAmount: calculatedRiskAmount,
        riskRewardRatio,
        marginOfSafety,
        percentOfAccount: (positionSize / dbUser.balance) * 100,
        maxPositionSizeAllowed: maxAllowedPositionSize,
      },
    });
  } catch (error) {
    console.error('Error calculating position size:', error);
    return res.status(500).json({ error: 'Failed to calculate position size' });
  }
}