/**
 * Database Connection Check Script
 * 
 * This script verifies that the Prisma client can connect to the database
 * using the current configuration.
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function checkConnection() {
  console.log('Checking database connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Try to execute a simple query
    const result = await prisma.$queryRaw`SELECT 1 as check`;
    
    if (result && result[0] && result[0].check === 1) {
      console.log('✅ Database connection successful!');
      
      // Get database information
      const dbInfo = await prisma.$queryRaw`SELECT current_database() as database, current_schema() as schema`;
      console.log(`Connected to database: ${dbInfo[0].database}`);
      console.log(`Using schema: ${dbInfo[0].schema}`);
      
      // Check if tables exist
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      if (tables.length > 0) {
        console.log(`\nFound ${tables.length} tables in the database:`);
        tables.forEach(table => {
          console.log(`- ${table.table_name}`);
        });
      } else {
        console.log('\nNo tables found in the database.');
      }
    } else {
      console.error('❌ Database connection check failed: Unexpected result');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });