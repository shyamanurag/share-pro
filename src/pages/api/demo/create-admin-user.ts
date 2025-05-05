import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    
    // Check if admin user already exists in our database
    const existingUser = await prisma.user.findFirst({
      where: { email: 'admin@tradepaper.com' }
    });
    
    if (!existingUser) {
      // Create admin user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: 'admin@tradepaper.com',
        password: 'demo1234',
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin`,
        }
      });

      if (authError) {
        console.error('Error creating admin user in Supabase Auth:', authError);
        return res.status(500).json({ error: 'Failed to create admin user' });
      }

      // Create user record in database with ADMIN role
      if (authUser.user) {
        await prisma.user.upsert({
          where: { id: authUser.user.id },
          update: {
            name: 'Admin User',
            balance: 1000000,
            role: 'ADMIN',
          },
          create: {
            id: authUser.user.id,
            email: authUser.user.email!,
            name: 'Admin User',
            balance: 1000000,
            role: 'ADMIN',
          },
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in create-admin-user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}