import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the Supabase client
  const supabase = createClient({ req, res });
  
  // Get the user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // Check if the user is authenticated
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get the stock ID from the request
  const { stockId } = req.query;
  
  if (!stockId || typeof stockId !== 'string') {
    return res.status(400).json({ error: 'Stock ID is required' });
  }
  
  try {
    // Find the user's default portfolio
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        userId: user.id,
      },
    });
    
    if (!portfolio) {
      return res.status(200).json({ item: null });
    }
    
    // Find the portfolio item for the specified stock
    const portfolioItem = await prisma.portfolioItem.findUnique({
      where: {
        portfolioId_stockId: {
          portfolioId: portfolio.id,
          stockId: stockId,
        },
      },
      include: {
        stock: true,
      },
    });
    
    return res.status(200).json({ item: portfolioItem });
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio item' });
  }
}