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
    
    // First check if admin user exists in Supabase Auth
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    
    let adminUser = users?.find(user => user.email === adminEmail);
    
    if (!adminUser) {
      // Admin doesn't exist in Supabase Auth, try to create
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin`,
        }
      });
      
      if (signUpError && signUpError.message !== 'User already registered') {
        console.error('Error creating admin user in Supabase Auth:', signUpError);
        return res.status(500).json({ error: 'Failed to create admin user' });
      }
      
      adminUser = authData.user;
    }
    
    // If we still don't have an admin user, try to sign in to get the user
    if (!adminUser) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });
      
      if (signInError) {
        console.error('Error signing in as admin:', signInError);
        return res.status(500).json({ error: 'Failed to authenticate admin user' });
      }
      
      adminUser = signInData.user;
    }
    
    // Now ensure the admin user exists in our database with the correct role
    if (adminUser) {
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
    } else {
      return res.status(500).json({ error: 'Failed to create or retrieve admin user' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in create-admin-user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}