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
      strategy,           // Strategy to backtest
      parameters,         // Strategy parameters
      startDate,          // Start date for backtest
      endDate,            // End date for backtest
      initialCapital,     // Initial capital for backtest
    } = req.body;

    // Validate required fields
    if (!stockId || !strategy || !parameters || !startDate || !endDate || !initialCapital) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the stock
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // In a real implementation, you would fetch historical data and run the backtest
    // For this demo, we'll simulate the backtest with mock results

    // Generate mock daily returns between -3% and +3%
    const generateMockReturns = (days: number) => {
      const returns = [];
      let cumulativeReturn = 0;
      
      for (let i = 0; i < days; i++) {
        const dailyReturn = (Math.random() * 6 - 3) / 100; // Between -3% and +3%
        cumulativeReturn += dailyReturn;
        returns.push({
          day: i + 1,
          dailyReturn,
          cumulativeReturn,
        });
      }
      
      return returns;
    };

    // Generate mock trades
    const generateMockTrades = (days: number, strategy: string) => {
      const trades = [];
      let position = 'NONE';
      let entryPrice = 0;
      let entryDay = 0;
      
      for (let i = 0; i < days; i++) {
        // Randomly decide to enter or exit positions
        const random = Math.random();
        
        if (position === 'NONE' && random > 0.8) {
          position = random > 0.9 ? 'SHORT' : 'LONG';
          entryPrice = stock.currentPrice * (1 + (Math.random() * 0.2 - 0.1)); // ±10% from current price
          entryDay = i + 1;
          
          trades.push({
            day: i + 1,
            action: position === 'LONG' ? 'BUY' : 'SELL',
            price: entryPrice,
            reason: `${strategy} signal generated`,
          });
        } else if (position !== 'NONE' && random > 0.85) {
          const exitPrice = entryPrice * (1 + (Math.random() * 0.2 - 0.1)); // ±10% from entry price
          const profit = position === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;
          const profitPct = (profit / entryPrice) * 100;
          
          trades.push({
            day: i + 1,
            action: position === 'LONG' ? 'SELL' : 'BUY',
            price: exitPrice,
            profit,
            profitPct,
            holdingPeriod: i + 1 - entryDay,
            reason: `${strategy} exit signal`,
          });
          
          position = 'NONE';
        }
      }
      
      return trades;
    };

    // Parse dates and calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Generate mock backtest results
    const mockReturns = generateMockReturns(days);
    const mockTrades = generateMockTrades(days, strategy);
    
    // Calculate performance metrics
    const winningTrades = mockTrades.filter(t => t.profit && t.profit > 0).length;
    const losingTrades = mockTrades.filter(t => t.profit && t.profit < 0).length;
    const totalTrades = winningTrades + losingTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const profits = mockTrades.filter(t => t.profit && t.profit > 0).map(t => t.profit || 0);
    const losses = mockTrades.filter(t => t.profit && t.profit < 0).map(t => t.profit || 0);
    
    const avgProfit = profits.length > 0 ? profits.reduce((sum, p) => sum + p, 0) / profits.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, l) => sum + l, 0) / losses.length : 0;
    
    const profitFactor = Math.abs(avgLoss) > 0 ? avgProfit / Math.abs(avgLoss) : 0;
    
    // Calculate final equity
    const totalProfitLoss = mockTrades
      .filter(t => t.profit)
      .reduce((sum, t) => sum + (t.profit || 0), 0);
    
    const finalEquity = initialCapital + totalProfitLoss;
    const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;
    
    // Calculate drawdown
    let maxDrawdown = 0;
    let peak = initialCapital;
    let equity = initialCapital;
    
    mockReturns.forEach(day => {
      equity = equity * (1 + day.dailyReturn);
      if (equity > peak) {
        peak = equity;
      }
      
      const drawdown = (peak - equity) / peak * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Prepare backtest results
    const backtestResults = {
      stock: {
        symbol: stock.symbol,
        name: stock.name,
      },
      strategy,
      parameters,
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      performance: {
        initialCapital,
        finalEquity,
        totalReturn,
        maxDrawdown,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        avgProfit,
        avgLoss,
        profitFactor,
      },
      trades: mockTrades,
      equityCurve: mockReturns.map(day => ({
        day: day.day,
        equity: initialCapital * (1 + day.cumulativeReturn),
      })),
    };

    return res.status(200).json({
      success: true,
      backtestResults,
    });
  } catch (error) {
    console.error('Error running backtest:', error);
    return res.status(500).json({ error: 'Failed to run backtest' });
  }
}