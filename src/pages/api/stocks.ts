import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

// This is a simplified API that returns stock data
// In a production app, you would connect to a real stock API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get stocks from database or use mock data if none exist
    let stocks = await prisma.stock.findMany({
      orderBy: { symbol: 'asc' }
    });

    // If no stocks in database, use mock data
    if (stocks.length === 0) {
      const mockStocks = [
        { symbol: "AAPL", name: "Apple Inc.", currentPrice: 182.52, previousClose: 178.72, change: 3.8, changePercent: 2.13, volume: 64829541, marketCap: 2850000000000, sector: "Technology" },
        { symbol: "MSFT", name: "Microsoft Corporation", currentPrice: 417.88, previousClose: 415.32, change: 2.56, changePercent: 0.62, volume: 22331456, marketCap: 3100000000000, sector: "Technology" },
        { symbol: "GOOGL", name: "Alphabet Inc.", currentPrice: 172.95, previousClose: 171.48, change: 1.47, changePercent: 0.86, volume: 18234567, marketCap: 2160000000000, sector: "Technology" },
        { symbol: "AMZN", name: "Amazon.com Inc.", currentPrice: 178.75, previousClose: 180.95, change: -2.2, changePercent: -1.22, volume: 32567890, marketCap: 1850000000000, sector: "Consumer Cyclical" },
        { symbol: "TSLA", name: "Tesla, Inc.", currentPrice: 172.63, previousClose: 177.29, change: -4.66, changePercent: -2.63, volume: 87654321, marketCap: 548000000000, sector: "Automotive" },
        { symbol: "META", name: "Meta Platforms, Inc.", currentPrice: 474.36, previousClose: 468.06, change: 6.3, changePercent: 1.35, volume: 15678901, marketCap: 1210000000000, sector: "Technology" },
        { symbol: "NFLX", name: "Netflix, Inc.", currentPrice: 628.78, previousClose: 622.83, change: 5.95, changePercent: 0.96, volume: 5432109, marketCap: 273000000000, sector: "Entertainment" },
        { symbol: "NVDA", name: "NVIDIA Corporation", currentPrice: 950.02, previousClose: 938.88, change: 11.14, changePercent: 1.19, volume: 43210987, marketCap: 2340000000000, sector: "Technology" },
      ];

      // Insert mock stocks into database
      await prisma.stock.createMany({
        data: mockStocks.map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          currentPrice: stock.currentPrice,
          previousClose: stock.previousClose,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume,
          marketCap: stock.marketCap,
          sector: stock.sector
        })),
        skipDuplicates: true,
      });

      // Fetch the stocks again with their IDs
      stocks = await prisma.stock.findMany({
        orderBy: { symbol: 'asc' }
      });
    }

    return res.status(200).json({ stocks });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return res.status(500).json({ error: 'Failed to fetch stocks' });
  }
}