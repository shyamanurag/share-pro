import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    // Try to sign in with admin credentials first
    console.log('Attempting to sign in admin user');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    
    if (signInError) {
      console.log('Admin sign in failed:', signInError.message);
    } else {
      console.log('Admin sign in successful');
    }
    
    let adminUser = signInData?.user;
    let adminId = adminUser?.id;
    
    // If sign in fails, try to create the admin user
    if (signInError || !adminUser) {
      console.log('Attempting to create admin user');
      
      // Try to create the admin user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin`,
        }
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
        signInError: signInError ? signInError.message : null
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