import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log(`Admin auth API: Attempting login for ${email}`);

    // Create a fresh Supabase client for this request
    const supabase = createClient(req, res);

    // First ensure the admin user exists
    try {
      console.log('Admin auth API: Creating/verifying admin user');
      // Use absolute URL for server-side API calls
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXT_PUBLIC_CO_DEV_ENV === "preview"
          ? "https://papertrader.preview.co.dev"
          : "http://localhost:3000";
          
      const adminResponse = await fetch(`${baseUrl}/api/demo/create-admin-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      if (!adminResponse.ok) {
        const errorData = await adminResponse.json();
        console.error('Admin auth API: Error setting up admin user:', errorData);
        throw new Error(errorData.error || 'Failed to set up admin user');
      }
    } catch (adminError) {
      console.error('Admin auth API: Error in admin user setup:', adminError);
      // Continue anyway, as the user might already exist
    }

    // Sign out any existing session
    await supabase.auth.signOut();

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Admin auth API: Sign in error:', error);
      return res.status(401).json({ error: error.message });
    }

    if (!data.user) {
      console.error('Admin auth API: No user data returned');
      return res.status(401).json({ error: 'Authentication failed' });
    }

    console.log('Admin auth API: Sign in successful for user ID:', data.user.id);

    // Set admin metadata
    try {
      await supabase.auth.updateUser({
        data: { role: 'ADMIN' }
      });
      console.log('Admin auth API: Updated user metadata with admin role');
    } catch (updateError) {
      console.error('Admin auth API: Error updating user metadata:', updateError);
      // Continue anyway
    }

    // Return success with session data
    return res.status(200).json({
      success: true,
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Admin auth API: Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}