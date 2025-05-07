import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';
import { 
  roundCurrency, 
  calculateFuturesMargin, 
  calculateFuturesPnL,
  hasSufficientBalance,
  hasSufficientShares
} from '@/lib/accounting';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      // Using proper column names with quotes for Prisma raw queries
      const futuresContracts = await prisma.$queryRaw`
        SELECT 
          fc.id, 
          fc."contractPrice", 
          fc."expiryDate", 
          fc."lotSize", 
          fc."marginRequired",
          s.id as "stockId", 
          s.symbol, 
          s.name, 
          s."currentPrice"
        FROM "FuturesContract" fc
        JOIN "Stock" s ON fc."stockId" = s.id
        WHERE fc."stockId" = ${stockId as string}
        AND fc."expiryDate" > ${currentDate}
        ORDER BY fc."expiryDate" ASC
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

        // Calculate margin using accounting utility
        const currentMargin = calculateFuturesMargin(
          stock.currentPrice + currentPremium, 
          50, 
          0.2
        );
        
        const nextMargin = calculateFuturesMargin(
          stock.currentPrice + nextPremium, 
          50, 
          0.2
        );
        
        const farMargin = calculateFuturesMargin(
          stock.currentPrice + farPremium, 
          50, 
          0.2
        );

        mockContracts.push({
          id: `future-${stock.id}-1`,
          contractPrice: roundCurrency(stock.currentPrice + currentPremium),
          expiryDate: currentMonth,
          lotSize: 50,
          marginRequired: currentMargin,
          stock: {
            id: stock.id,
            symbol: stock.symbol,
            name: stock.name,
            currentPrice: stock.currentPrice
          }
        });

        mockContracts.push({
          id: `future-${stock.id}-2`,
          contractPrice: roundCurrency(stock.currentPrice + nextPremium),
          expiryDate: nextMonth,
          lotSize: 50,
          marginRequired: nextMargin,
          stock: {
            id: stock.id,
            symbol: stock.symbol,
            name: stock.name,
            currentPrice: stock.currentPrice
          }
        });

        mockContracts.push({
          id: `future-${stock.id}-3`,
          contractPrice: roundCurrency(stock.currentPrice + farPremium),
          expiryDate: farMonth,
          lotSize: 50,
          marginRequired: farMargin,
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
      // Get user from auth
      const supabase = createClient(req, res);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { futuresContractId, quantity, type } = req.body;

      if (!futuresContractId) {
        return res.status(400).json({ error: 'Futures contract ID is required' });
      }

      if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
        return res.status(400).json({ error: 'Valid quantity (positive integer) is required' });
      }

      if (!type || !['BUY', 'SELL'].includes(type)) {
        return res.status(400).json({ error: 'Valid order type (BUY/SELL) is required' });
      }
      
      // Get futures contract details
      const futuresContract = await prisma.futuresContract.findUnique({
        where: { id: futuresContractId },
        include: { stock: true }
      });
      
      if (!futuresContract) {
        return res.status(404).json({ error: 'Futures contract not found' });
      }
      
      // Get user's current balance
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      });

      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Calculate required margin using accounting utility
      const requiredMargin = roundCurrency(futuresContract.marginRequired * quantity);
      
      // Check if user has an existing position for this contract
      const existingPosition = await prisma.futuresPosition.findFirst({
        where: {
          userId: user.id,
          futuresContractId: futuresContractId
        }
      });
      
      // Process trade based on type
      if (type === 'BUY') {
        // Check if user has enough balance for margin using accounting utility
        if (!hasSufficientBalance(userData.balance, requiredMargin)) {
          return res.status(400).json({ error: 'Insufficient balance for margin requirement' });
        }
        
        // Update user's balance (deduct margin)
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: roundCurrency(userData.balance - requiredMargin) },
        });
        
        // Create or update futures position
        if (existingPosition) {
          // Update existing position
          const newQuantity = existingPosition.quantity + quantity;
          const newEntryPrice = roundCurrency(
            ((existingPosition.entryPrice * existingPosition.quantity) + 
            (futuresContract.contractPrice * quantity)) / newQuantity
          );
          
          await prisma.futuresPosition.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQuantity,
              entryPrice: newEntryPrice,
              currentPrice: futuresContract.contractPrice,
              margin: roundCurrency(existingPosition.margin + requiredMargin),
              pnl: calculateFuturesPnL(
                newEntryPrice, 
                futuresContract.contractPrice, 
                futuresContract.lotSize, 
                newQuantity
              ),
              updatedAt: new Date()
            }
          });
        } else {
          // Create new position
          await prisma.futuresPosition.create({
            data: {
              userId: user.id,
              futuresContractId: futuresContractId,
              quantity: quantity,
              entryPrice: futuresContract.contractPrice,
              currentPrice: futuresContract.contractPrice,
              margin: requiredMargin,
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
          return res.status(400).json({ error: 'No existing futures position to sell' });
        }
        
        // Check if user has enough quantity
        if (!hasSufficientShares(existingPosition.quantity, quantity)) {
          return res.status(400).json({ error: 'Not enough futures contracts to sell' });
        }
        
        // Calculate PnL for the sold portion using accounting utility
        const totalPnl = calculateFuturesPnL(
          existingPosition.entryPrice, 
          futuresContract.contractPrice, 
          futuresContract.lotSize, 
          quantity
        );
        
        // Calculate margin to be released
        const marginToRelease = roundCurrency((existingPosition.margin / existingPosition.quantity) * quantity);
        
        // Update user's balance (add margin + PnL)
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: roundCurrency(userData.balance + marginToRelease + totalPnl) },
        });
        
        // Update futures position
        const newQuantity = existingPosition.quantity - quantity;
        
        if (newQuantity === 0) {
          // Close position completely
          await prisma.futuresPosition.delete({
            where: { id: existingPosition.id }
          });
        } else {
          // Reduce position size
          await prisma.futuresPosition.update({
            where: { id: existingPosition.id },
            data: {
              quantity: newQuantity,
              margin: roundCurrency(existingPosition.margin - marginToRelease),
              pnl: calculateFuturesPnL(
                existingPosition.entryPrice, 
                futuresContract.contractPrice, 
                futuresContract.lotSize, 
                newQuantity
              ),
              updatedAt: new Date()
            }
          });
        }
      }
      
      // Calculate total transaction value
      const transactionTotal = type === 'BUY' 
        ? requiredMargin 
        : roundCurrency(futuresContract.contractPrice * futuresContract.lotSize * quantity);
      
      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          stockId: futuresContract.stockId,
          type: type === 'BUY' ? 'BUY_FUTURES' : 'SELL_FUTURES',
          quantity: quantity,
          price: futuresContract.contractPrice,
          total: transactionTotal,
          orderType: 'MARKET',
          status: 'COMPLETED',
        }
      });
      
      // Log the transaction in system logs
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          source: 'FUTURES_TRADE',
          message: `User ${user.id} ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} lots of ${futuresContract.stock.symbol} futures at ₹${futuresContract.contractPrice}`,
          details: JSON.stringify({
            userId: user.id,
            futuresContractId: futuresContractId,
            stockId: futuresContract.stockId,
            type: type,
            quantity: quantity,
            price: futuresContract.contractPrice,
            margin: requiredMargin,
            pnl: type === 'SELL' ? totalPnl : 0,
            timestamp: new Date(),
          }),
        },
      });

      return res.status(200).json({
        success: true,
        message: `Successfully ${type === 'BUY' ? 'bought' : 'sold'} ${quantity} lots of futures contract`,
        transaction: transaction
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