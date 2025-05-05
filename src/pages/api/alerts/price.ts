import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(req, res);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'POST':
      return createAlert(req, res, user.id);
    case 'GET':
      return getAlerts(req, res, user.id);
    case 'DELETE':
      return deleteAlert(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Create a new price alert
async function createAlert(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { stockId, type, targetValue } = req.body;

    // Validate required fields
    if (!stockId || !type || targetValue === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate alert type
    if (!['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE'].includes(type)) {
      return res.status(400).json({ error: 'Invalid alert type' });
    }

    // Get the stock to make sure it exists
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Create the alert
    const alert = await prisma.orderAlert.create({
      data: {
        userId,
        stockId,
        type,
        targetValue,
        triggered: false,
      },
    });

    return res.status(201).json({ 
      success: true, 
      alert,
      message: 'Price alert created successfully' 
    });
  } catch (error) {
    console.error('Error creating price alert:', error);
    return res.status(500).json({ error: 'Failed to create price alert' });
  }
}

// Get all price alerts for a user
async function getAlerts(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const alerts = await prisma.orderAlert.findMany({
      where: { userId },
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
            currentPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({ alerts });
  } catch (error) {
    console.error('Error fetching price alerts:', error);
    return res.status(500).json({ error: 'Failed to fetch price alerts' });
  }
}

// Delete a price alert
async function deleteAlert(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { alertId } = req.query;

    if (!alertId || typeof alertId !== 'string') {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    // Check if the alert exists and belongs to the user
    const alert = await prisma.orderAlert.findFirst({
      where: {
        id: alertId,
        userId,
      },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found or does not belong to user' });
    }

    // Delete the alert
    await prisma.orderAlert.delete({
      where: { id: alertId },
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Price alert deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting price alert:', error);
    return res.status(500).json({ error: 'Failed to delete price alert' });
  }
}