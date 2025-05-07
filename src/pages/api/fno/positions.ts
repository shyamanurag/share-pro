import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user from Supabase auth
  const { supabase, user } = await createClient(req, res);
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET request to fetch user's F&O positions
  if (req.method === 'GET') {
    try {
      const { type } = req.query;
      
      if (!type || !['futures', 'options', 'all'].includes(type as string)) {
        return res.status(400).json({ error: 'Valid position type (futures/options/all) is required' });
      }
      
      // Fetch futures positions
      let futuresPositions = [];
      if (type === 'futures' || type === 'all') {
        futuresPositions = await prisma.futuresPosition.findMany({
          where: {
            userId: user.id,
          },
          include: {
            futuresContract: {
              include: {
                stock: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });
      }
      
      // Fetch options positions
      let optionsPositions = [];
      if (type === 'options' || type === 'all') {
        optionsPositions = await prisma.optionsPosition.findMany({
          where: {
            userId: user.id,
          },
          include: {
            optionsContract: {
              include: {
                stock: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });
      }
      
      // If no positions found, return empty arrays
      if (
        (type === 'futures' && futuresPositions.length === 0) ||
        (type === 'options' && optionsPositions.length === 0) ||
        (type === 'all' && futuresPositions.length === 0 && optionsPositions.length === 0)
      ) {
        // For demo purposes, generate mock positions
        if (type === 'futures' || type === 'all') {
          // Get some stocks to use for mock data
          const stocks = await prisma.stock.findMany({
            take: 3,
            orderBy: {
              volume: 'desc',
            },
          });
          
          if (stocks.length > 0) {
            // Generate mock futures contracts
            const mockFuturesContracts = stocks.map((stock, index) => {
              // Current month expiry (last Thursday of current month)
              const expiryDate = new Date();
              expiryDate.setDate(1);
              expiryDate.setMonth(expiryDate.getMonth() + 1);
              expiryDate.setDate(0);
              while (expiryDate.getDay() !== 4) { // 4 is Thursday
                expiryDate.setDate(expiryDate.getDate() - 1);
              }
              
              return {
                id: `mock-future-${index}`,
                stockId: stock.id,
                expiryDate,
                contractPrice: stock.currentPrice * (1 + 0.01 * (index + 1)), // Add premium
                lotSize: 50,
                marginRequired: stock.currentPrice * 50 * 0.2, // 20% margin
                openInterest: 10000 * (index + 1),
                stock,
              };
            });
            
            // Generate mock futures positions
            futuresPositions = mockFuturesContracts.map((contract, index) => {
              const entryPrice = contract.contractPrice * 0.98; // Slightly lower entry price
              const currentPrice = contract.contractPrice;
              const quantity = index + 1;
              const pnl = (currentPrice - entryPrice) * contract.lotSize * quantity;
              
              return {
                id: `mock-future-pos-${index}`,
                userId: user.id,
                futuresContractId: contract.id,
                quantity,
                entryPrice,
                currentPrice,
                margin: contract.marginRequired * quantity,
                pnl,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                updatedAt: new Date(),
                futuresContract: contract,
              };
            });
          }
        }
        
        if (type === 'options' || type === 'all') {
          // Get some stocks to use for mock data
          const stocks = await prisma.stock.findMany({
            take: 3,
            orderBy: {
              volume: 'desc',
            },
          });
          
          if (stocks.length > 0) {
            // Generate mock options contracts
            const mockOptionsContracts = [];
            
            // Generate CALL and PUT options for each stock
            stocks.forEach((stock, stockIndex) => {
              // Current month expiry (last Thursday of current month)
              const expiryDate = new Date();
              expiryDate.setDate(1);
              expiryDate.setMonth(expiryDate.getMonth() + 1);
              expiryDate.setDate(0);
              while (expiryDate.getDay() !== 4) { // 4 is Thursday
                expiryDate.setDate(expiryDate.getDate() - 1);
              }
              
              // CALL option (slightly OTM)
              const callStrikePrice = Math.round(stock.currentPrice * 1.05);
              const callPremium = stock.currentPrice * 0.03; // 3% premium
              
              mockOptionsContracts.push({
                id: `mock-call-${stockIndex}`,
                stockId: stock.id,
                type: 'CALL',
                strikePrice: callStrikePrice,
                expiryDate,
                premiumPrice: callPremium,
                lotSize: 50,
                impliedVolatility: 30 + stockIndex * 5,
                delta: 0.6,
                gamma: 0.05,
                theta: -0.1,
                vega: 0.2,
                stock,
              });
              
              // PUT option (slightly OTM)
              const putStrikePrice = Math.round(stock.currentPrice * 0.95);
              const putPremium = stock.currentPrice * 0.025; // 2.5% premium
              
              mockOptionsContracts.push({
                id: `mock-put-${stockIndex}`,
                stockId: stock.id,
                type: 'PUT',
                strikePrice: putStrikePrice,
                expiryDate,
                premiumPrice: putPremium,
                lotSize: 50,
                impliedVolatility: 35 + stockIndex * 5,
                delta: -0.4,
                gamma: 0.04,
                theta: -0.12,
                vega: 0.18,
                stock,
              });
            });
            
            // Generate mock options positions (only for first few contracts)
            optionsPositions = mockOptionsContracts.slice(0, 3).map((contract, index) => {
              const entryPrice = contract.premiumPrice * 0.9; // Slightly lower entry price
              const currentPrice = contract.premiumPrice;
              const quantity = 1;
              const pnl = (currentPrice - entryPrice) * contract.lotSize * quantity;
              
              return {
                id: `mock-option-pos-${index}`,
                userId: user.id,
                optionsContractId: contract.id,
                quantity,
                entryPrice,
                currentPrice,
                pnl,
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                updatedAt: new Date(),
                optionsContract: contract,
              };
            });
          }
        }
      }
      
      // Return the positions
      return res.status(200).json({
        futuresPositions: type === 'futures' || type === 'all' ? futuresPositions : [],
        optionsPositions: type === 'options' || type === 'all' ? optionsPositions : [],
      });
      
    } catch (error) {
      console.error('Error fetching F&O positions:', error);
      return res.status(500).json({ error: 'Failed to fetch F&O positions' });
    }
  }
  
  // Method not allowed
  else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}