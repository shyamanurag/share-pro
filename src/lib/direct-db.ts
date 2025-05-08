/**
 * Direct database access utility
 * This module provides direct access to the database without relying on Prisma's schema validation
 * It's used as a fallback when Prisma's ORM features are not working properly
 */

import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  max: 5, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection from the pool
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Log pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute a SQL query
 * @param text SQL query text
 * @param params Query parameters
 * @returns Query result
 */
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Get a user by ID
 * @param userId User ID
 * @returns User object or null if not found
 */
export async function getUserById(userId: string) {
  try {
    const result = await query('SELECT * FROM "User" WHERE id = $1', [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Get a user by email
 * @param email User email
 * @returns User object or null if not found
 */
export async function getUserByEmail(email: string) {
  try {
    const result = await query('SELECT * FROM "User" WHERE email = $1', [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Get all stocks
 * @returns Array of stock objects
 */
export async function getAllStocks() {
  try {
    const result = await query('SELECT * FROM "Stock" ORDER BY symbol ASC');
    return result.rows;
  } catch (error) {
    console.error('Error getting all stocks:', error);
    return [];
  }
}

/**
 * Create a system log entry
 * @param level Log level
 * @param source Log source
 * @param message Log message
 * @param details Optional details
 * @returns Created log entry or null if failed
 */
export async function createSystemLog(level: string, source: string, message: string, details?: string) {
  try {
    const result = await query(
      'INSERT INTO "SystemLog" (id, level, source, message, details, timestamp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [crypto.randomUUID(), level, source, message, details, new Date()]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating system log:', error);
    return null;
  }
}

/**
 * Check database connection
 * @returns True if connected, false otherwise
 */
export async function checkConnection() {
  try {
    const result = await query('SELECT 1 as check');
    return result.rows[0]?.check === 1;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// Export the pool for direct access if needed
export default pool;