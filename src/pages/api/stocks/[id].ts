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
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Stock ID is required' });
  }
  
  try {
    // Fetch the stock
    const stock = await prisma.stock.findUnique({
      where: {
        id: id,
      },
    });
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    return res.status(200).json({ stock });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return res.status(500).json({ error: 'Failed to fetch stock' });
  }
}