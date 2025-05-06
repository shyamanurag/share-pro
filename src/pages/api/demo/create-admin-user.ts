import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    console.log('Starting admin user creation/verification process');
    const adminEmail = 'admin@papertrader.app';
    const adminPassword = 'admin1234'; // This is only used for the response, not for auth
    
    // Check if admin user already exists in our database
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: adminEmail,
        role: 'ADMIN'
      }
    });
    
    if (existingUser) {
      console.log('Found existing admin user with ID:', existingUser.id);
      
      // Update the existing user
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: 'Admin User',
          balance: 1000000,
          role: 'ADMIN',
          isActive: true,
          lastLogin: new Date(),
        }
      });
      
      // Ensure portfolio and watchlist exist
      await ensurePortfolioAndWatchlist(existingUser.id);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Admin user verified and updated successfully',
        userId: updatedUser.id,
        credentials: {
          email: adminEmail,
          password: adminPassword
        }
      });
    } else {
      // Create a new admin user directly in the database
      console.log('No existing admin user found, creating new one...');
      
      const adminId = randomUUID();
      const createdUser = await prisma.user.create({
        data: {
          id: adminId,
          email: adminEmail,
          name: 'Admin User',
          balance: 1000000,
          role: 'ADMIN',
          isActive: true,
          lastLogin: new Date(),
        },
      });
      
      // Create portfolio and watchlist
      await ensurePortfolioAndWatchlist(adminId);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Admin user created successfully',
        userId: createdUser.id,
        credentials: {
          email: adminEmail,
          password: adminPassword
        }
      });
    }
  } catch (error) {
    console.error('Error in create-admin-user:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to ensure portfolio and watchlist exist
async function ensurePortfolioAndWatchlist(userId: string) {
  try {
    // Check if portfolio already exists
    const existingPortfolio = await prisma.portfolio.findFirst({
      where: { userId }
    });
    
    if (!existingPortfolio) {
      // Create default portfolio
      await prisma.portfolio.create({
        data: {
          id: randomUUID(),
          name: 'Default Portfolio',
          userId,
        }
      });
      console.log('Created default portfolio for admin user');
    }
    
    // Check if watchlist already exists
    const existingWatchlist = await prisma.watchlist.findFirst({
      where: { userId }
    });
    
    if (!existingWatchlist) {
      // Create default watchlist
      await prisma.watchlist.create({
        data: {
          id: randomUUID(),
          name: 'Default Watchlist',
          userId,
        }
      });
      console.log('Created default watchlist for admin user');
    }
  } catch (err) {
    console.error('Error creating default portfolio/watchlist:', err);
    // Continue anyway as the user was created
  }
}