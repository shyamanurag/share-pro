import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get all stocks
    const stocks = await prisma.stock.findMany();
    
    // Update each stock with a small random price change
    const updatedStocks = await Promise.all(
      stocks.map(async (stock) => {
        // Generate random price change (between -1% and +1% of current price)
        const randomChange = (Math.random() * 2 - 1) * (stock.currentPrice * 0.01);
        const newPrice = stock.currentPrice + randomChange;
        const newChange = newPrice - stock.previousClose;
        const newChangePercent = (newChange / stock.previousClose) * 100;
        
        // Update stock in database
        return prisma.stock.update({
          where: { id: stock.id },
          data: {
            currentPrice: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(newChange.toFixed(2)),
            changePercent: parseFloat(newChangePercent.toFixed(2)),
            updatedAt: new Date(),
          }
        });
      })
    );

    return res.status(200).json({ stocks: updatedStocks });
  } catch (error) {
    console.error('Error refreshing stocks:', error);
    return res.status(500).json({ error: 'Failed to refresh stocks' });
  }
}