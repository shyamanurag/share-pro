import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';

// This API endpoint triggers the stock replacement process
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

    // Call the replace-with-indian endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/stocks/replace-with-indian`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || ''
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to replace stocks');
    }

    const data = await response.json();
    
    return res.status(200).json({ 
      message: 'Stocks replaced successfully',
      data
    });
  } catch (error: any) {
    console.error('Error replacing stocks:', error);
    return res.status(500).json({ error: error.message || 'Failed to replace stocks' });
  }
}