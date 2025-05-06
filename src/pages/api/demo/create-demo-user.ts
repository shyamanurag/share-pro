import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    console.log('Starting demo user creation/verification process');
    const supabase = createClient(req, res);
    const demoEmail = 'demo@papertrader.app';
    const demoPassword = 'demo1234';
    
    // First check if the demo user already exists in Supabase Auth
    try {
      // Try to sign in with demo credentials to check if user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });
      
      if (!signInError && signInData.user) {
        console.log('Demo user exists in Supabase Auth, ID:', signInData.user.id);
        
        // Ensure user exists in our database
        try {
          console.log('Upserting demo user in database');
          const upsertedUser = await prisma.user.upsert({
            where: { id: signInData.user.id },
            update: {
              name: 'Demo User',
              balance: 10000,
              isActive: true,
              lastLogin: new Date(),
            },
            create: {
              id: signInData.user.id,
              email: demoEmail,
              name: 'Demo User',
              balance: 10000,
              isActive: true,
              lastLogin: new Date(),
            },
          });
          
          // Ensure portfolio and watchlist exist
          await ensurePortfolioAndWatchlist(signInData.user.id);
          
          return res.status(200).json({ 
            success: true, 
            message: 'Demo user verified and updated successfully',
            userId: upsertedUser.id
          });
        } catch (prismaError) {
          console.error('Error upserting existing demo user in database:', prismaError);
          return res.status(500).json({ 
            error: 'Failed to update demo user in database',
            details: prismaError instanceof Error ? prismaError.message : 'Unknown error'
          });
        }
      } else {
        console.log('Demo user does not exist or credentials are invalid, creating new user');
        
        // Create a new demo user
        const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
          email: demoEmail,
          password: demoPassword,
          email_confirm: true
        });
        
        if (signUpError) {
          console.error('Demo user sign up error:', signUpError);
          
          // If error is about user already existing, try to update the user instead
          if (signUpError.message.includes('already exists')) {
            console.log('User already exists, trying to update password');
            
            // Try to find the user by email
            const { data: { users } } = await supabase.auth.admin.listUsers({
              page: 1,
              perPage: 100,
            });
            
            const existingUser = users?.find(u => u.email === demoEmail);
            
            if (existingUser) {
              console.log('Found existing user with ID:', existingUser.id);
              
              // Update the existing user's password
              await supabase.auth.admin.updateUserById(existingUser.id, {
                password: demoPassword,
                email_confirm: true
              });
              
              console.log('Updated existing user password');
              
              // Ensure user exists in our database
              const upsertedUser = await prisma.user.upsert({
                where: { id: existingUser.id },
                update: {
                  name: 'Demo User',
                  balance: 10000,
                  isActive: true,
                  lastLogin: new Date(),
                },
                create: {
                  id: existingUser.id,
                  email: demoEmail,
                  name: 'Demo User',
                  balance: 10000,
                  isActive: true,
                  lastLogin: new Date(),
                },
              });
              
              // Ensure portfolio and watchlist exist
              await ensurePortfolioAndWatchlist(existingUser.id);
              
              return res.status(200).json({ 
                success: true, 
                message: 'Demo user updated successfully',
                userId: upsertedUser.id
              });
            } else {
              return res.status(500).json({ 
                error: 'Failed to create or update demo user', 
                details: signUpError.message 
              });
            }
          } else {
            return res.status(500).json({ 
              error: 'Failed to create demo user', 
              details: signUpError.message 
            });
          }
        }
        
        if (!signUpData.user) {
          console.error('Demo user creation returned no user data');
          return res.status(500).json({ 
            error: 'Failed to create demo user', 
            details: 'No user data returned' 
          });
        }
        
        const userId = signUpData.user.id;
        console.log('Demo user created successfully with ID:', userId);
        
        // Create demo user in our database
        try {
          console.log('Creating demo user in database');
          const createdUser = await prisma.user.create({
            data: {
              id: userId,
              email: demoEmail,
              name: 'Demo User',
              balance: 10000,
              isActive: true,
              lastLogin: new Date(),
            },
          });
          
          // Create portfolio and watchlist
          await ensurePortfolioAndWatchlist(userId);
          
          return res.status(200).json({ 
            success: true, 
            message: 'Demo user created successfully',
            userId: createdUser.id
          });
        } catch (prismaError) {
          console.error('Error creating demo user in database:', prismaError);
          return res.status(500).json({ 
            error: 'Failed to create demo user in database',
            details: prismaError instanceof Error ? prismaError.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      console.error('Error checking/creating demo user:', error);
      return res.status(500).json({ 
        error: 'Failed to check/create demo user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error in create-demo-user:', error);
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
          name: 'Default',
          userId,
        }
      });
      console.log('Created default portfolio for demo user');
    }
    
    // Check if watchlist already exists
    const existingWatchlist = await prisma.watchlist.findFirst({
      where: { userId }
    });
    
    if (!existingWatchlist) {
      // Create default watchlist
      await prisma.watchlist.create({
        data: {
          name: 'Default',
          userId,
        }
      });
      console.log('Created default watchlist for demo user');
    }
    
    // Add sample data if needed
    const portfolioItems = await prisma.portfolioItem.count({
      where: { portfolio: { userId } }
    });
    
    if (portfolioItems === 0) {
      // Add sample transactions and portfolio items
      const stocks = await prisma.stock.findMany({ take: 3 });
      
      if (stocks.length > 0) {
        const portfolio = await prisma.portfolio.findFirst({
          where: { userId }
        });
        
        const watchlist = await prisma.watchlist.findFirst({
          where: { userId }
        });
        
        if (portfolio && watchlist) {
          // Add first stock to watchlist
          await prisma.watchlistItem.create({
            data: {
              watchlistId: watchlist.id,
              stockId: stocks[0].id,
            },
          });
          
          // Add sample transactions and portfolio items
          for (let i = 0; i < Math.min(2, stocks.length); i++) {
            const stock = stocks[i];
            const quantity = 10;
            const total = quantity * stock.currentPrice;
            
            // Create buy transaction
            await prisma.transaction.create({
              data: {
                userId,
                stockId: stock.id,
                type: 'BUY',
                quantity,
                price: stock.currentPrice,
                total,
                timestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Stagger dates
              },
            });
            
            // Add to portfolio
            await prisma.portfolioItem.create({
              data: {
                portfolioId: portfolio.id,
                stockId: stock.id,
                quantity,
                avgBuyPrice: stock.currentPrice,
              },
            });
          }
          
          // Update user balance to reflect purchases
          const totalSpent = await prisma.transaction.aggregate({
            where: { userId, type: 'BUY' },
            _sum: { total: true },
          });
          
          await prisma.user.update({
            where: { id: userId },
            data: { balance: 10000 - (totalSpent._sum.total || 0) },
          });
        }
      }
    }
  } catch (err) {
    console.error('Error creating default portfolio/watchlist:', err);
    // Continue anyway as the user was created
  }
}