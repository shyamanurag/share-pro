import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
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
    const supabase = createClient(req, res);
    const adminEmail = 'admin@papertrader.app';
    const adminPassword = 'admin1234';
    
    // First check if the admin user already exists in Supabase
    try {
      const { data: { users } } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });
      
      const existingUser = users?.find(u => u.email === adminEmail);
      
      if (existingUser) {
        console.log('Found existing admin user with ID:', existingUser.id);
        
        // Update the existing user's metadata to ensure admin role
        await supabase.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            full_name: 'Admin User',
            role: 'ADMIN'
          },
          email: adminEmail,
          password: adminPassword,
          email_confirm: true
        });
        
        console.log('Updated existing admin user metadata');
        
        // Ensure admin user exists in our database
        try {
          console.log('Upserting admin user in database');
          const upsertedUser = await prisma.user.upsert({
            where: { id: existingUser.id },
            update: {
              name: 'Admin User',
              balance: 1000000,
              role: 'ADMIN',
              isActive: true,
              lastLogin: new Date(),
            },
            create: {
              id: existingUser.id,
              email: adminEmail,
              name: 'Admin User',
              balance: 1000000,
              role: 'ADMIN',
              isActive: true,
              lastLogin: new Date(),
            },
          });
          
          // Ensure portfolio and watchlist exist
          await ensurePortfolioAndWatchlist(existingUser.id);
          
          return res.status(200).json({ 
            success: true, 
            message: 'Admin user verified and updated successfully',
            userId: upsertedUser.id
          });
        } catch (prismaError) {
          console.error('Error upserting existing admin user in database:', prismaError);
          return res.status(500).json({ 
            error: 'Failed to update admin user in database',
            details: prismaError instanceof Error ? prismaError.message : 'Unknown error'
          });
        }
      } else {
        // Create a new admin user
        console.log('No existing admin user found, creating new one...');
        const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          user_metadata: {
            full_name: 'Admin User',
            role: 'ADMIN'
          },
          email_confirm: true
        });
        
        if (signUpError) {
          console.error('Admin sign up error:', signUpError);
          return res.status(500).json({ 
            error: 'Failed to create admin user', 
            details: signUpError.message 
          });
        }
        
        if (!signUpData.user) {
          console.error('Admin user creation returned no user data');
          return res.status(500).json({ 
            error: 'Failed to create admin user', 
            details: 'No user data returned' 
          });
        }
        
        const adminId = signUpData.user.id;
        console.log('Admin user created successfully with ID:', adminId);
        
        // Create admin user in our database
        try {
          console.log('Creating admin user in database');
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
            userId: createdUser.id
          });
        } catch (prismaError) {
          console.error('Error creating admin user in database:', prismaError);
          return res.status(500).json({ 
            error: 'Failed to create admin user in database',
            details: prismaError instanceof Error ? prismaError.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      console.error('Error checking/creating admin user:', error);
      return res.status(500).json({ 
        error: 'Failed to check/create admin user',
        details: error instanceof Error ? error.message : 'Unknown error'
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