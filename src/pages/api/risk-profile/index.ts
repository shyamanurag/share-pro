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
    case 'GET':
      return getRiskProfile(req, res, user.id);
    case 'POST':
    case 'PUT':
      return updateRiskProfile(req, res, user.id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get the user's risk profile
async function getRiskProfile(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    // Find the user's risk profile
    const riskProfile = await prisma.riskProfile.findUnique({
      where: { userId },
    });

    // If no risk profile exists, return default values
    if (!riskProfile) {
      return res.status(200).json({
        riskProfile: {
          maxPositionSize: 5, // Default 5% of portfolio per position
          maxDrawdown: 20,    // Default 20% max drawdown
          riskPerTrade: 1,    // Default 1% risk per trade
          stopLossDefault: 5, // Default 5% stop loss
          takeProfitDefault: 10, // Default 10% take profit
        },
        isDefault: true,
      });
    }

    return res.status(200).json({ riskProfile, isDefault: false });
  } catch (error) {
    console.error('Error fetching risk profile:', error);
    return res.status(500).json({ error: 'Failed to fetch risk profile' });
  }
}

// Create or update the user's risk profile
async function updateRiskProfile(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const {
      maxPositionSize,
      maxDrawdown,
      riskPerTrade,
      stopLossDefault,
      takeProfitDefault,
    } = req.body;

    // Validate inputs
    if (maxPositionSize !== undefined && (maxPositionSize < 0 || maxPositionSize > 100)) {
      return res.status(400).json({ error: 'Max position size must be between 0 and 100 percent' });
    }

    if (maxDrawdown !== undefined && (maxDrawdown < 0 || maxDrawdown > 100)) {
      return res.status(400).json({ error: 'Max drawdown must be between 0 and 100 percent' });
    }

    if (riskPerTrade !== undefined && (riskPerTrade < 0 || riskPerTrade > 100)) {
      return res.status(400).json({ error: 'Risk per trade must be between 0 and 100 percent' });
    }

    if (stopLossDefault !== undefined && (stopLossDefault < 0 || stopLossDefault > 100)) {
      return res.status(400).json({ error: 'Default stop loss must be between 0 and 100 percent' });
    }

    if (takeProfitDefault !== undefined && (takeProfitDefault < 0 || takeProfitDefault > 100)) {
      return res.status(400).json({ error: 'Default take profit must be between 0 and 100 percent' });
    }

    // Check if the user already has a risk profile
    const existingProfile = await prisma.riskProfile.findUnique({
      where: { userId },
    });

    let riskProfile;

    if (existingProfile) {
      // Update existing profile
      riskProfile = await prisma.riskProfile.update({
        where: { userId },
        data: {
          maxPositionSize: maxPositionSize !== undefined ? maxPositionSize : existingProfile.maxPositionSize,
          maxDrawdown: maxDrawdown !== undefined ? maxDrawdown : existingProfile.maxDrawdown,
          riskPerTrade: riskPerTrade !== undefined ? riskPerTrade : existingProfile.riskPerTrade,
          stopLossDefault: stopLossDefault !== undefined ? stopLossDefault : existingProfile.stopLossDefault,
          takeProfitDefault: takeProfitDefault !== undefined ? takeProfitDefault : existingProfile.takeProfitDefault,
        },
      });
    } else {
      // Create new profile
      riskProfile = await prisma.riskProfile.create({
        data: {
          userId,
          maxPositionSize: maxPositionSize !== undefined ? maxPositionSize : 5,
          maxDrawdown: maxDrawdown !== undefined ? maxDrawdown : 20,
          riskPerTrade: riskPerTrade !== undefined ? riskPerTrade : 1,
          stopLossDefault: stopLossDefault !== undefined ? stopLossDefault : 5,
          takeProfitDefault: takeProfitDefault !== undefined ? takeProfitDefault : 10,
        },
      });
    }

    return res.status(200).json({ 
      success: true, 
      riskProfile,
      message: 'Risk profile updated successfully' 
    });
  } catch (error) {
    console.error('Error updating risk profile:', error);
    return res.status(500).json({ error: 'Failed to update risk profile' });
  }
}