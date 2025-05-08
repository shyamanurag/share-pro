// This script checks the database connection directly using pg
// without relying on Prisma's schema validation

const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    max: 1, // Only need one connection for this check
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  let client;
  try {
    console.log('Checking database connection directly...');
    
    // Get a client from the pool
    client = await pool.connect();
    
    // Try a simple query
    const result = await client.query('SELECT 1 as check');
    
    if (result && result.rows && result.rows[0] && result.rows[0].check === 1) {
      console.log('✅ Database connection successful!');
      return true;
    } else {
      console.error('❌ Database connection check failed: Unexpected response');
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection check failed:', error);
    return false;
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
    
    // End the pool
    await pool.end();
  }
}

// Run the check and exit with appropriate code
main()
  .then(success => {
    if (success) {
      process.exit(0); // Success
    } else {
      process.exit(1); // Failure
    }
  })
  .catch(error => {
    console.error('Error in direct connection check script:', error);
    process.exit(1); // Failure
  });