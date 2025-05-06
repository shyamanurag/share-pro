import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests for authentication
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if this is the admin user
    if (email !== 'admin@papertrader.app') {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // For admin authentication, we'll check against the hardcoded password
    // In a production environment, this should be replaced with proper password hashing
    if (password !== 'admin1234') {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Find the admin user in the database
    const adminUser = await prisma.user.findFirst({
      where: {
        email: email,
        role: 'ADMIN'
      }
    });

    if (!adminUser) {
      return res.status(401).json({ error: 'Admin user not found in database' });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { lastLogin: new Date() }
    });

    // Log the login
    await prisma.loginHistory.create({
      data: {
        userId: adminUser.id,
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        status: 'SUCCESS',
      }
    });

    // Return success with user ID
    return res.status(200).json({
      success: true,
      userId: adminUser.id,
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}