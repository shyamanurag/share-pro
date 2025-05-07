import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';
import { 
  roundCurrency, 
  calculateOptionsPremium, 
  calculateOptionsPnL,
  hasSufficientBalance,
  hasSufficientShares
} from '@/lib/accounting';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      // Using proper column names with quotes for Prisma raw queries
      const optionsContracts = await prisma.$queryRaw`
        SELECT 
          oc.id, 
          oc.type, 
          oc."strikePrice", 
          oc."premiumPrice", 
          oc."expiryDate", 
          oc."lotSize",
          s.id as "stockId", 
          s.symbol, 
          s.name, 
          s."currentPrice"
        FROM "OptionsContract" oc
        JOIN "Stock" s ON oc."stockId" = s.id
        WHERE oc."stockId" = ${stockId as string}
        AND oc.type = ${type as string}
        AND oc."expiryDate" > ${currentDate}
        ORDER BY oc."expiryDate" ASC, oc."strikePrice" ASC
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
            strikePrices.push(roundCurrency(basePrice * (1 + i * 0.05)));
          }
        } 
        // For PUT options
        else {
          // 5 strike prices above current price
          for (let i = -5; i <= 5; i++) {
            strikePrices.push(roundCurrency(basePrice * (1 + i * 0.05)));
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
            premiumPrice: roundCurrency(premium),
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
            premiumPrice: roundCurrency(premium),
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
      // Get user from auth
      const supabase = createClient(req, res);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { optionsContractId, quantity, type } = req.body;

      if (!optionsContractId) {
        return res.status(400).json({ error: 'Options contract ID is required' });
      }

      if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
        return res.status(400).json({ error: 'Valid quantity (positive integer) is required' });
      }

      if (!type || !['BUY', 'SELL'].includes(type)) {
        return res.status(400).json({ error: 'Valid order type (BUY/SELL) is required' });
      }
      
      // Get options contract details
      const optionsContract = await prisma.optionsContract.findUnique({
        where: { id: optionsContractId },
        include: { stock: true }
      });
      
      if (!optionsContract) {
        return res.status(404).json({ error: 'Options contract not found' });
      }
      
      // Get user's current balance
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      });

      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Calculate total premium cost using accounting utility
      const totalPremium = calculateOptionsPremium(
        optionsContract.premiumPrice, 
        optionsContract.lotSize, 
        quantity
      );
      
      // Check if user has an existing position for this contract
      const existingPosition = await prisma.optionsPosition.findFirst({
        where: {
          userId: user.id,
          optionsContractId: optionsContractId
        }
      });
      
      // Process trade based on type
      if (type === 'BUY') {
        // Check if user has enough balance for premium using accounting utility
        if (!hasSufficientBalance(userData.balance, totalPremium)) {
          return res.status(400).json({ error: 'Insufficient balance for options premium' });
        }
        
        // Update user's balance (deduct premium)
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: roundCurrency(userData.balance - totalPremium) },
        });
        
        // Create or update options position
        if (existingPosition) {
          // Update existing position
          const newQuantity = existingPosition.quantity + quantity;
          const newEntryPrice = roundCurrency(
            ((existingPosition.entryPrice * existingPosition.quantity) + 
            (optionsContract.premiumPrice * quantity)) / newQuantity
          );
          
          await prisma.optionsPosition.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQuantity,
              entryPrice: newEntryPrice,
              currentPrice: optionsContract.premiumPrice,
              pnl: calculateOptionsPnL(
                newEntryPrice, 
                optionsContract.premiumPrice, 
                optionsContract.lotSize, 
                newQuantity
              ),
              updatedAt: new Date()
            }
          });
        } else {
          // Create new position
          await prisma.optionsPosition.create({
            data: {
              userId: user.id,
              optionsContractId: optionsContractId,
              quantity: quantity,
              entryPrice: optionsContract.premiumPrice,
              currentPrice: optionsContract.premiumPrice,
              pnl: 0, // No PnL at entry
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      } 
      else if (type === 'SELL') {
        // Check if user has the position to sell
        if (!existingPosition) {
          return res.status(400).json({ error: 'No existing options position to sell' });
        }
        
        // Check if user has enough quantity using accounting utility
        if (!hasSufficientShares(existingPosition.quantity, quantity)) {
          return res.status(400).json({ error: 'Not enough options contracts to sell' });
        }
        
        // Calculate PnL for the sold portion using accounting utility
        const totalPnl = calculateOptionsPnL(
          existingPosition.entryPrice, 
          optionsContract.premiumPrice, 
          optionsContract.lotSize, 
          quantity
        );
        
        // Calculate premium to be received
        const premiumToReceive = calculateOptionsPremium(
          optionsContract.premiumPrice, 
          optionsContract.lotSize, 
          quantity
        );
        
        // Update user's balance (add premium + PnL)
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: roundCurrency(userData.balance + premiumToReceive) },
        });
        
        // Update options position
        const newQuantity = existingPosition.quantity - quantity;
        
        if (newQuantity === 0) {
          // Close position completely
          await prisma.optionsPosition.delete({
            where: { id: existingPosition.id }
          });
        } else {
          // Reduce position size
          await prisma.optionsPosition.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQuantity,
              pnl: calculateOptionsPnL(
                existingPosition.entryPrice, 
                optionsContract.premiumPrice, 
                optionsContract.lotSize, 
                newQuantity
              ),
              updatedAt: new Date()
            }
          });
        }
      }
      
      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          stockId: optionsContract.stockId,
          type: type === 'BUY' ? 'BUY_OPTIONS' : 'SELL_OPTIONS',
          quantity: quantity,
          price: optionsContract.premiumPrice,
          total: totalPremium,
          orderType: 'MARKET',
          status: 'COMPLETED',
        }
      });
      
      // Log the transaction in system logs
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          source: 'OPTIONS_TRADE',
          message: `User ${user.id} ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} lots of ${optionsContract.stock.symbol} ${optionsContract.type} options at ₹${optionsContract.premiumPrice}`,
          details: JSON.stringify({
            userId: user.id,
            optionsContractId: optionsContractId,
            stockId: optionsContract.stockId,
            type: type,
            optionType: optionsContract.type,
            strikePrice: optionsContract.strikePrice,
            quantity: quantity,
            price: optionsContract.premiumPrice,
            total: totalPremium,
            pnl: type === 'SELL' ? totalPnl : 0,
            timestamp: new Date(),
          }),
        },
      });

      return res.status(200).json({
        success: true,
        message: `Successfully ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} lots of options contract`,
        transaction: transaction
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