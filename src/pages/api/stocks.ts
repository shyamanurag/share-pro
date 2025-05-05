import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

// This API returns Indian NSE stock data
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get stocks from database or seed with Indian NSE stocks if none exist
    let stocks = await prisma.stock.findMany({
      orderBy: { symbol: 'asc' }
    });

    // If no stocks in database, seed with Indian NSE stocks
    if (stocks.length === 0) {
      // Define Indian NSE stocks
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
        { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd.", currentPrice: 1865.30, previousClose: 1850.45, change: 14.85, changePercent: 0.80, volume: 1234567, marketCap: 3700000000000, sector: "Banking" },
        { symbol: "HCLTECH", name: "HCL Technologies Ltd.", currentPrice: 1320.45, previousClose: 1310.20, change: 10.25, changePercent: 0.78, volume: 987654, marketCap: 3580000000000, sector: "IT" },
        { symbol: "ADANIENT", name: "Adani Enterprises Ltd.", currentPrice: 2850.65, previousClose: 2820.30, change: 30.35, changePercent: 1.08, volume: 3456789, marketCap: 3250000000000, sector: "Diversified" },
        { symbol: "MARUTI", name: "Maruti Suzuki India Ltd.", currentPrice: 10450.80, previousClose: 10380.45, change: 70.35, changePercent: 0.68, volume: 234567, marketCap: 3150000000000, sector: "Automobile" },
        { symbol: "TATAMOTORS", name: "Tata Motors Ltd.", currentPrice: 875.40, previousClose: 865.25, change: 10.15, changePercent: 1.17, volume: 4567890, marketCap: 2920000000000, sector: "Automobile" },
        { symbol: "WIPRO", name: "Wipro Ltd.", currentPrice: 480.65, previousClose: 475.30, change: 5.35, changePercent: 1.13, volume: 2345678, marketCap: 2630000000000, sector: "IT" },
        { symbol: "AXISBANK", name: "Axis Bank Ltd.", currentPrice: 1120.35, previousClose: 1125.80, change: -5.45, changePercent: -0.48, volume: 3456789, marketCap: 3450000000000, sector: "Banking" },
        { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd.", currentPrice: 1380.25, previousClose: 1365.40, change: 14.85, changePercent: 1.09, volume: 876543, marketCap: 3310000000000, sector: "Pharma" },
        { symbol: "TATASTEEL", name: "Tata Steel Ltd.", currentPrice: 145.80, previousClose: 143.25, change: 2.55, changePercent: 1.78, volume: 7654321, marketCap: 1780000000000, sector: "Metal" },
        { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd.", currentPrice: 9850.45, previousClose: 9780.30, change: 70.15, changePercent: 0.72, volume: 345678, marketCap: 2840000000000, sector: "Cement" },
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
          sector: stock.sector,
          exchange: "NSE",
          isF_O_Available: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "TATAMOTORS", "ADANIENT"].includes(stock.symbol),
          lotSize: stock.currentPrice > 1000 ? 25 : 50
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