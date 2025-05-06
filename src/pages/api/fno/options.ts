import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET request to fetch options contracts
  if (req.method === 'GET') {
    try {
      const { stockId, type } = req.query;

      if (!stockId) {
        return res.status(400).json({ error: 'Stock ID is required' });
      }

      if (!type || !['CALL', 'PUT'].includes(type as string)) {
        return res.status(400).json({ error: 'Valid option type (CALL/PUT) is required' });
      }

      // Get current date
      const currentDate = new Date();
      
      // Fetch options contracts for the stock that haven't expired
      const optionsContracts = await prisma.$queryRaw`
        SELECT 
          oc.id, 
          oc.type, 
          oc.strike_price as "strikePrice", 
          oc.premium_price as "premiumPrice", 
          oc.expiry_date as "expiryDate", 
          oc.lot_size as "lotSize",
          s.id as "stockId", 
          s.symbol, 
          s.name, 
          s.current_price as "currentPrice"
        FROM "OptionsContract" oc
        JOIN "Stock" s ON oc.stock_id = s.id
        WHERE oc.stock_id = ${stockId as string}
        AND oc.type = ${type as string}
        AND oc.expiry_date > ${currentDate}
        ORDER BY oc.expiry_date ASC, oc.strike_price ASC
      `;

      // If no contracts found, generate some mock contracts
      if (!Array.isArray(optionsContracts) || optionsContracts.length === 0) {
        const stock = await prisma.stock.findUnique({
          where: { id: stockId as string },
        });

        if (!stock) {
          return res.status(404).json({ error: 'Stock not found' });
        }

        // Generate mock options contracts with different strike prices and expiry dates
        const mockContracts = [];
        
        // Current month expiry (last Thursday of current month)
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        currentMonth.setDate(0);
        while (currentMonth.getDay() !== 4) { // 4 is Thursday
          currentMonth.setDate(currentMonth.getDate() - 1);
        }
        
        // Next month expiry (last Thursday of next month)
        const nextMonth = new Date();
        nextMonth.setDate(1);
        nextMonth.setMonth(nextMonth.getMonth() + 2);
        nextMonth.setDate(0);
        while (nextMonth.getDay() !== 4) { // 4 is Thursday
          nextMonth.setDate(nextMonth.getDate() - 1);
        }

        // Generate strike prices (5% intervals around current price)
        const strikePrices = [];
        const basePrice = stock.currentPrice;
        
        // For CALL options
        if (type === 'CALL') {
          // 5 strike prices below current price
          for (let i = -5; i <= 5; i++) {
            strikePrices.push(Math.round(basePrice * (1 + i * 0.05) * 100) / 100);
          }
        } 
        // For PUT options
        else {
          // 5 strike prices above current price
          for (let i = -5; i <= 5; i++) {
            strikePrices.push(Math.round(basePrice * (1 + i * 0.05) * 100) / 100);
          }
        }

        // Generate contracts for current month
        strikePrices.forEach((strikePrice, index) => {
          // Calculate premium based on strike price and option type
          let premium;
          if (type === 'CALL') {
            // For CALL options, premium increases as strike price decreases
            premium = Math.max(0, (basePrice - strikePrice) * 0.1 + basePrice * 0.02);
          } else {
            // For PUT options, premium increases as strike price increases
            premium = Math.max(0, (strikePrice - basePrice) * 0.1 + basePrice * 0.02);
          }
          
          mockContracts.push({
            id: `option-${stock.id}-${type}-${index}-1`,
            type: type,
            strikePrice: strikePrice,
            premiumPrice: Math.round(premium * 100) / 100,
            expiryDate: currentMonth,
            lotSize: 50,
            stock: {
              id: stock.id,
              symbol: stock.symbol,
              name: stock.name,
              currentPrice: stock.currentPrice
            }
          });
        });

        // Generate contracts for next month (with higher premiums)
        strikePrices.forEach((strikePrice, index) => {
          // Calculate premium based on strike price and option type (higher for longer expiry)
          let premium;
          if (type === 'CALL') {
            premium = Math.max(0, (basePrice - strikePrice) * 0.1 + basePrice * 0.03);
          } else {
            premium = Math.max(0, (strikePrice - basePrice) * 0.1 + basePrice * 0.03);
          }
          
          mockContracts.push({
            id: `option-${stock.id}-${type}-${index}-2`,
            type: type,
            strikePrice: strikePrice,
            premiumPrice: Math.round(premium * 100) / 100,
            expiryDate: nextMonth,
            lotSize: 50,
            stock: {
              id: stock.id,
              symbol: stock.symbol,
              name: stock.name,
              currentPrice: stock.currentPrice
            }
          });
        });

        return res.status(200).json({ optionsContracts: mockContracts });
      }

      return res.status(200).json({ optionsContracts });
    } catch (error) {
      console.error('Error fetching options contracts:', error);
      return res.status(500).json({ error: 'Failed to fetch options contracts' });
    }
  }
  
  // POST request to execute an options trade
  else if (req.method === 'POST') {
    try {
      const { optionsContractId, quantity, type } = req.body;

      if (!optionsContractId) {
        return res.status(400).json({ error: 'Options contract ID is required' });
      }

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Valid quantity is required' });
      }

      if (!type || !['BUY', 'SELL'].includes(type)) {
        return res.status(400).json({ error: 'Valid order type (BUY/SELL) is required' });
      }

      // Get user's portfolio
      const userPortfolio = await prisma.portfolio.findUnique({
        where: { userId: user.id },
      });

      if (!userPortfolio) {
        return res.status(404).json({ error: 'User portfolio not found' });
      }

      // In a real app, we would check if the user has enough funds, execute the trade, etc.
      // For this demo, we'll just record the transaction

      // Create a transaction record
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: type === 'BUY' ? 'BUY_OPTIONS' : 'SELL_OPTIONS',
          quantity,
          price: 0, // This would be the actual premium price
          stockId: '', // This would be the actual stock ID
          status: 'COMPLETED',
          metadata: {
            optionsContractId,
            orderType: type,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: `Successfully ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} lots of options contract`,
      });
    } catch (error) {
      console.error('Error executing options trade:', error);
      return res.status(500).json({ error: 'Failed to execute options trade' });
    }
  }
  
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}