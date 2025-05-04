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

    // If no stocks in database, use Indian NSE stocks
    if (stocks.length === 0) {
      const indianStocks = [
        { symbol: "RELIANCE", name: "Reliance Industries Ltd.", currentPrice: 2950.75, previousClose: 2935.20, change: 15.55, changePercent: 0.53, volume: 5432109, marketCap: 19950000000000, sector: "Energy" },
        { symbol: "TCS", name: "Tata Consultancy Services Ltd.", currentPrice: 3680.45, previousClose: 3650.30, change: 30.15, changePercent: 0.83, volume: 1234567, marketCap: 13450000000000, sector: "IT" },
        { symbol: "HDFCBANK", name: "HDFC Bank Ltd.", currentPrice: 1675.80, previousClose: 1690.25, change: -14.45, changePercent: -0.85, volume: 3456789, marketCap: 9350000000000, sector: "Banking" },
        { symbol: "INFY", name: "Infosys Ltd.", currentPrice: 1520.65, previousClose: 1510.40, change: 10.25, changePercent: 0.68, volume: 2345678, marketCap: 6320000000000, sector: "IT" },
        { symbol: "ICICIBANK", name: "ICICI Bank Ltd.", currentPrice: 1045.30, previousClose: 1050.75, change: -5.45, changePercent: -0.52, volume: 4567890, marketCap: 7290000000000, sector: "Banking" },
        { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd.", currentPrice: 2480.55, previousClose: 2465.30, change: 15.25, changePercent: 0.62, volume: 876543, marketCap: 5830000000000, sector: "FMCG" },
        { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd.", currentPrice: 7250.40, previousClose: 7180.65, change: 69.75, changePercent: 0.97, volume: 654321, marketCap: 4380000000000, sector: "Finance" },
        { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd.", currentPrice: 1185.25, previousClose: 1175.80, change: 9.45, changePercent: 0.80, volume: 2345678, marketCap: 6620000000000, sector: "Telecom" },
        { symbol: "SBIN", name: "State Bank of India", currentPrice: 745.60, previousClose: 752.35, change: -6.75, changePercent: -0.90, volume: 5678901, marketCap: 6650000000000, sector: "Banking" },
        { symbol: "ASIANPAINT", name: "Asian Paints Ltd.", currentPrice: 3120.75, previousClose: 3140.50, change: -19.75, changePercent: -0.63, volume: 432109, marketCap: 2990000000000, sector: "Consumer Durables" },
      ];

      // Insert Indian stocks into database
      await prisma.stock.createMany({
        data: indianStocks.map(stock => ({
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