import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    const adminEmail = 'admin@tradepaper.com';
    const adminPassword = 'demo1234';
    
    // Try to sign in with admin credentials first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    
    let adminUser = signInData?.user;
    
    // If sign in fails, try to create the admin user
    if (signInError || !adminUser) {
      console.log('Admin sign in failed, attempting to create admin user');
      
      // Try to create the admin user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin`,
        }
      });
      
      // If sign up fails with "User already registered" but sign in also failed,
      // there might be an issue with the password
      if (signUpError && signUpError.message === 'User already registered') {
        console.log('Admin user exists but sign in failed. Attempting admin password reset');
        
        // For demo purposes, we'll try to update the user's password directly
        // In a real app, you'd use a proper password reset flow
        try {
          // This is a workaround for demo purposes only
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            signUpData?.user?.id || 'unknown',
            { password: adminPassword }
          );
          
          if (updateError) {
            console.error('Failed to update admin password:', updateError);
          } else {
            // Try signing in again after password update
            const { data: retryData } = await supabase.auth.signInWithPassword({
              email: adminEmail,
              password: adminPassword,
            });
            
            adminUser = retryData?.user;
          }
        } catch (updateError) {
          console.error('Error updating admin password:', updateError);
        }
      } else if (!signUpError) {
        // Sign up succeeded
        adminUser = signUpData?.user;
      }
    }
    
    // If we have an admin user, ensure they exist in our database with the correct role
    if (adminUser) {
      try {
        await prisma.user.upsert({
          where: { id: adminUser.id },
          update: {
            name: 'Admin User',
            balance: 1000000,
            role: 'ADMIN',
            isActive: true,
            lastLogin: new Date(),
          },
          create: {
            id: adminUser.id,
            email: adminUser.email!,
            name: 'Admin User',
            balance: 1000000,
            role: 'ADMIN',
            isActive: true,
            lastLogin: new Date(),
          },
        });
        
        console.log('Admin user created/updated in database successfully');
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in create-admin-user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}