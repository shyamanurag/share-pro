// This script checks the database connection before deployment
// It's useful to verify that the database is accessible

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking database connection...');
    
    // Try a simple query to check connection
    const result = await prisma.$queryRaw`SELECT 1 as check`;
    
    if (result && result[0] && result[0].check === 1) {
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
    await prisma.$disconnect();
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
    console.error('Error in connection check script:', error);
    process.exit(1); // Failure
  });