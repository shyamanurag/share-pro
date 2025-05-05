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
      return getAlgoTemplates(req, res);
    case 'POST':
      return executeAlgoTemplate(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get available algorithmic trading templates
async function getAlgoTemplates(req: NextApiRequest, res: NextApiResponse) {
  try {
    // In a real implementation, these would be stored in the database
    // For this demo, we'll return a static list of templates
    const templates = [
      {
        id: 'moving-average-crossover',
        name: 'Moving Average Crossover',
        description: 'Buy when short-term MA crosses above long-term MA, sell when it crosses below',
        parameters: [
          { name: 'shortPeriod', type: 'number', default: 10, description: 'Short-term moving average period' },
          { name: 'longPeriod', type: 'number', default: 50, description: 'Long-term moving average period' },
          { name: 'quantity', type: 'number', default: 10, description: 'Number of shares to trade' },
        ],
      },
      {
        id: 'rsi-overbought-oversold',
        name: 'RSI Overbought/Oversold',
        description: 'Buy when RSI is below oversold threshold, sell when above overbought threshold',
        parameters: [
          { name: 'period', type: 'number', default: 14, description: 'RSI calculation period' },
          { name: 'oversold', type: 'number', default: 30, description: 'Oversold threshold' },
          { name: 'overbought', type: 'number', default: 70, description: 'Overbought threshold' },
          { name: 'quantity', type: 'number', default: 10, description: 'Number of shares to trade' },
        ],
      },
      {
        id: 'bollinger-band-bounce',
        name: 'Bollinger Band Bounce',
        description: 'Buy when price touches lower band, sell when it touches upper band',
        parameters: [
          { name: 'period', type: 'number', default: 20, description: 'Bollinger Band calculation period' },
          { name: 'stdDev', type: 'number', default: 2, description: 'Standard deviation multiplier' },
          { name: 'quantity', type: 'number', default: 10, description: 'Number of shares to trade' },
        ],
      },
      {
        id: 'vwap-reversion',
        name: 'VWAP Reversion',
        description: 'Buy when price is below VWAP by threshold, sell when above VWAP by threshold',
        parameters: [
          { name: 'threshold', type: 'number', default: 2, description: 'Percentage threshold from VWAP' },
          { name: 'quantity', type: 'number', default: 10, description: 'Number of shares to trade' },
        ],
      },
      {
        id: 'momentum-strategy',
        name: 'Momentum Strategy',
        description: 'Buy stocks with positive momentum, sell when momentum slows',
        parameters: [
          { name: 'lookbackPeriod', type: 'number', default: 10, description: 'Lookback period for momentum calculation' },
          { name: 'momentumThreshold', type: 'number', default: 5, description: 'Momentum threshold percentage' },
          { name: 'quantity', type: 'number', default: 10, description: 'Number of shares to trade' },
        ],
      },
    ];

    return res.status(200).json({ templates });
  } catch (error) {
    console.error('Error fetching algo templates:', error);
    return res.status(500).json({ error: 'Failed to fetch algo templates' });
  }
}

// Execute an algorithmic trading template
async function executeAlgoTemplate(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const {
      templateId,
      stockId,
      parameters,
    } = req.body;

    // Validate required fields
    if (!templateId || !stockId || !parameters) {
      return res.status(400).json({ error: 'Missing required fields' });
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

    // In a real implementation, you would execute the algorithm based on the template
    // For this demo, we'll simulate the execution with a mock response

    let simulatedResult;
    const quantity = parameters.quantity || 10;

    switch (templateId) {
      case 'moving-average-crossover':
        simulatedResult = {
          signal: 'BUY',
          reason: 'Short-term MA (10) crossed above long-term MA (50)',
          entryPrice: stock.currentPrice,
          stopLoss: stock.currentPrice * 0.95,
          takeProfit: stock.currentPrice * 1.1,
        };
        break;
      case 'rsi-overbought-oversold':
        simulatedResult = {
          signal: 'BUY',
          reason: 'RSI (14) is below oversold threshold (30)',
          entryPrice: stock.currentPrice,
          stopLoss: stock.currentPrice * 0.97,
          takeProfit: stock.currentPrice * 1.05,
        };
        break;
      case 'bollinger-band-bounce':
        simulatedResult = {
          signal: 'SELL',
          reason: 'Price touched upper Bollinger Band (2 std dev)',
          entryPrice: stock.currentPrice,
          stopLoss: stock.currentPrice * 1.03,
          takeProfit: stock.currentPrice * 0.95,
        };
        break;
      case 'vwap-reversion':
        simulatedResult = {
          signal: 'BUY',
          reason: 'Price is 2.5% below VWAP',
          entryPrice: stock.currentPrice,
          stopLoss: stock.currentPrice * 0.98,
          takeProfit: stock.currentPrice * 1.03,
        };
        break;
      case 'momentum-strategy':
        simulatedResult = {
          signal: 'BUY',
          reason: 'Stock has 7.2% momentum over lookback period',
          entryPrice: stock.currentPrice,
          stopLoss: stock.currentPrice * 0.94,
          takeProfit: stock.currentPrice * 1.08,
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid template ID' });
    }

    // Create a transaction record for the algorithm signal
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        stockId,
        type: simulatedResult.signal,
        orderType: 'ALGO_' + templateId.toUpperCase(),
        quantity,
        price: stock.currentPrice,
        total: stock.currentPrice * quantity,
        status: 'PENDING', // In a real system, this would be executed or monitored
        limitPrice: simulatedResult.takeProfit,
        stopPrice: simulatedResult.stopLoss,
      },
    });

    return res.status(200).json({
      success: true,
      algoSignal: simulatedResult,
      transaction,
      message: `Algorithm ${templateId} executed successfully with ${simulatedResult.signal} signal`,
    });
  } catch (error) {
    console.error('Error executing algo template:', error);
    return res.status(500).json({ error: 'Failed to execute algo template' });
  }
}