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
    const adminEmail = 'admin@tradepaper.com';
    const adminPassword = 'demo1234';
    
    // First, check if the admin user exists in the database
    const existingDbUser = await prisma.user.findFirst({
      where: {
        email: adminEmail,
        role: 'ADMIN'
      }
    });
    
    console.log('Existing admin in database:', existingDbUser ? 'Found' : 'Not found');
    
    // First, try to get the user by email from Supabase
    console.log('Checking if admin user exists in Supabase');
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Get all users to ensure we find the admin
    });
    
    if (getUserError) {
      console.error('Error listing users:', getUserError);
      return res.status(500).json({ error: 'Failed to check if admin user exists', details: getUserError.message });
    }
    
    console.log(`Found ${users?.length || 0} users in Supabase`);
    const existingUser = users?.find(u => u.email === adminEmail);
    console.log('Existing admin user in Supabase:', existingUser ? 'Found' : 'Not found');
    
    let adminUser = existingUser;
    let adminId = existingUser?.id;
    
    // If user doesn't exist in Supabase, create them
    if (!existingUser) {
      console.log('No admin user found in Supabase. Creating new admin user...');
      
      // Try to create the admin user with admin API to bypass email confirmation
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
        console.log('Admin sign up error:', signUpError.message);
        
        // If sign up fails with "User already registered" but sign in also failed,
        // there might be an issue with the password
        if (signUpError.message === 'User already registered') {
          console.log('Admin user exists but sign in failed. Attempting to retrieve user');
          
          // Try to get the user by email
          const { data: userData } = await supabase.auth.admin.listUsers();
          const existingUser = userData?.users?.find(u => u.email === adminEmail);
          
          if (existingUser) {
            console.log('Found existing admin user, attempting password reset');
            adminId = existingUser.id;
            
            // Reset the password
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { password: adminPassword }
            );
            
            if (updateError) {
              console.error('Failed to update admin password:', updateError);
            } else {
              console.log('Admin password updated successfully');
              
              // Try signing in again after password update
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: adminEmail,
                password: adminPassword,
              });
              
              if (retryError) {
                console.error('Retry sign in failed:', retryError);
              } else {
                console.log('Retry sign in successful');
                adminUser = retryData?.user;
              }
            }
          } else {
            console.log('Could not find admin user in Supabase');
          }
        }
      } else {
        // Sign up succeeded
        console.log('Admin sign up successful');
        adminUser = signUpData?.user;
        adminId = adminUser?.id;
      }
    } else {
      console.log('Admin user found in Supabase. Ensuring password is correct...');
      
      // User exists, but let's make sure the password is correct
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: adminPassword }
      );
      
      if (updateError) {
        console.error('Failed to update admin password:', updateError);
      } else {
        console.log('Admin password updated/verified successfully');
        adminId = existingUser.id;
      }
    }
    
    // If we have an admin ID (either from sign in, sign up, or user lookup),
    // ensure they exist in our database with the correct role
    if (adminId) {
      try {
        console.log('Upserting admin user in database with ID:', adminId);
        
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
        
        // If this is a new user, create default portfolio and watchlist
        if (!existingDbUser) {
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
        }
        
        // Force delete any existing sessions for this user to ensure clean login
        try {
          await supabase.auth.admin.deleteUser(adminId);
          console.log('Deleted existing sessions for admin user');
          
          // Recreate the user with the same ID
          const { error: recreateError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            user_metadata: {
              full_name: 'Admin User',
              role: 'ADMIN'
            },
            email_confirm: true
          });
          
          if (recreateError) {
            console.error('Error recreating admin user:', recreateError);
          } else {
            console.log('Admin user recreated successfully');
          }
        } catch (sessionError) {
          console.error('Error managing admin sessions:', sessionError);
          // Continue anyway
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
    } else {
      console.error('Failed to create or retrieve admin user from Supabase Auth');
      return res.status(500).json({ 
        error: 'Failed to create or retrieve admin user',
        signInError: 'Unknown error during admin user creation'
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