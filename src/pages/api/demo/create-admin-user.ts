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
    
    // First, try to delete the admin user if it exists to ensure a clean state
    try {
      // Find the user by email
      const { data: { users } } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });
      
      const existingUser = users?.find(u => u.email === adminEmail);
      
      if (existingUser) {
        console.log('Found existing admin user, deleting to ensure clean state');
        await supabase.auth.admin.deleteUser(existingUser.id);
        console.log('Deleted existing admin user');
      }
    } catch (deleteError) {
      console.error('Error during admin user cleanup:', deleteError);
      // Continue with creation even if deletion fails
    }
    
    // Create a new admin user with a clean state
    console.log('Creating new admin user...');
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
    
    // Ensure admin user exists in our database
    try {
      console.log('Upserting admin user in database');
      const upsertedUser = await prisma.user.upsert({
        where: { id: adminId },
        update: {
          name: 'Admin User',
          balance: 1000000,
          role: 'ADMIN',
          isActive: true,
          lastLogin: new Date(),
        },
        create: {
          id: adminId,
          email: adminEmail,
          name: 'Admin User',
          balance: 1000000,
          role: 'ADMIN',
          isActive: true,
          lastLogin: new Date(),
        },
      });
      
      console.log('Admin user created/updated in database successfully:', upsertedUser.id);
      
      // Create default portfolio and watchlist
      try {
        // Check if portfolio already exists
        const existingPortfolio = await prisma.portfolio.findFirst({
          where: { userId: adminId }
        });
        
        if (!existingPortfolio) {
          // Create default portfolio
          await prisma.portfolio.create({
            data: {
              id: randomUUID(),
              name: 'Default Portfolio',
              userId: adminId,
            }
          });
          console.log('Created default portfolio for admin user');
        }
        
        // Check if watchlist already exists
        const existingWatchlist = await prisma.watchlist.findFirst({
          where: { userId: adminId }
        });
        
        if (!existingWatchlist) {
          // Create default watchlist
          await prisma.watchlist.create({
            data: {
              id: randomUUID(),
              name: 'Default Watchlist',
              userId: adminId,
            }
          });
          console.log('Created default watchlist for admin user');
        }
      } catch (err) {
        console.error('Error creating default portfolio/watchlist:', err);
        // Continue anyway as the user was created
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Admin user created/verified successfully',
        userId: upsertedUser.id
      });
    } catch (prismaError) {
      console.error('Error upserting admin user in database:', prismaError);
      return res.status(500).json({ 
        error: 'Failed to create admin user in database',
        details: prismaError instanceof Error ? prismaError.message : 'Unknown error'
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