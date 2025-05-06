import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET request to fetch futures contracts
  if (req.method === 'GET') {
    try {
      const { stockId } = req.query;

      if (!stockId) {
        return res.status(400).json({ error: 'Stock ID is required' });
      }

      // Get current date
      const currentDate = new Date();
      
      // Fetch futures contracts for the stock that haven't expired
      const futuresContracts = await prisma.$queryRaw`
        SELECT 
          fc.id, 
          fc.contract_price as "contractPrice", 
          fc.expiry_date as "expiryDate", 
          fc.lot_size as "lotSize", 
          fc.margin_required as "marginRequired",
          s.id as "stockId", 
          s.symbol, 
          s.name, 
          s.current_price as "currentPrice"
        FROM "FuturesContract" fc
        JOIN "Stock" s ON fc.stock_id = s.id
        WHERE fc.stock_id = ${stockId as string}
        AND fc.expiry_date > ${currentDate}
        ORDER BY fc.expiry_date ASC
      `;

      // If no contracts found, generate some mock contracts
      if (!Array.isArray(futuresContracts) || futuresContracts.length === 0) {
        const stock = await prisma.stock.findUnique({
          where: { id: stockId as string },
        });

        if (!stock) {
          return res.status(404).json({ error: 'Stock not found' });
        }

        // Generate mock futures contracts with different expiry dates
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
        
        // Far month expiry (last Thursday of month after next)
        const farMonth = new Date();
        farMonth.setDate(1);
        farMonth.setMonth(farMonth.getMonth() + 3);
        farMonth.setDate(0);
        while (farMonth.getDay() !== 4) { // 4 is Thursday
          farMonth.setDate(farMonth.getDate() - 1);
        }

        // Add premium based on time to expiry
        const currentPremium = stock.currentPrice * 0.01; // 1% premium
        const nextPremium = stock.currentPrice * 0.02;    // 2% premium
        const farPremium = stock.currentPrice * 0.03;     // 3% premium

        mockContracts.push({
          id: `future-${stock.id}-1`,
          contractPrice: stock.currentPrice + currentPremium,
          expiryDate: currentMonth,
          lotSize: 50,
          marginRequired: (stock.currentPrice + currentPremium) * 50 * 0.2, // 20% margin
          stock: {
            id: stock.id,
            symbol: stock.symbol,
            name: stock.name,
            currentPrice: stock.currentPrice
          }
        });

        mockContracts.push({
          id: `future-${stock.id}-2`,
          contractPrice: stock.currentPrice + nextPremium,
          expiryDate: nextMonth,
          lotSize: 50,
          marginRequired: (stock.currentPrice + nextPremium) * 50 * 0.2, // 20% margin
          stock: {
            id: stock.id,
            symbol: stock.symbol,
            name: stock.name,
            currentPrice: stock.currentPrice
          }
        });

        mockContracts.push({
          id: `future-${stock.id}-3`,
          contractPrice: stock.currentPrice + farPremium,
          expiryDate: farMonth,
          lotSize: 50,
          marginRequired: (stock.currentPrice + farPremium) * 50 * 0.2, // 20% margin
          stock: {
            id: stock.id,
            symbol: stock.symbol,
            name: stock.name,
            currentPrice: stock.currentPrice
          }
        });

        return res.status(200).json({ futuresContracts: mockContracts });
      }

      return res.status(200).json({ futuresContracts });
    } catch (error) {
      console.error('Error fetching futures contracts:', error);
      return res.status(500).json({ error: 'Failed to fetch futures contracts' });
    }
  }
  
  // POST request to execute a futures trade
  else if (req.method === 'POST') {
    try {
      const { futuresContractId, quantity, type } = req.body;

      if (!futuresContractId) {
        return res.status(400).json({ error: 'Futures contract ID is required' });
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

      // In a real app, we would check if the user has enough margin, execute the trade, etc.
      // For this demo, we'll just record the transaction

      // Create a transaction record
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: type === 'BUY' ? 'BUY_FUTURES' : 'SELL_FUTURES',
          quantity,
          price: 0, // This would be the actual contract price
          stockId: '', // This would be the actual stock ID
          status: 'COMPLETED',
          metadata: {
            futuresContractId,
            orderType: type,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: `Successfully ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} lots of futures contract`,
      });
    } catch (error) {
      console.error('Error executing futures trade:', error);
      return res.status(500).json({ error: 'Failed to execute futures trade' });
    }
  }
  
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}