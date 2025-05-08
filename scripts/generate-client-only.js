// This script generates the Prisma client from the empty schema
// without attempting any database migrations or validations

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating Prisma client without migrations...');

try {
  // Generate the client with the --skip-generate flag to avoid migrations
  execSync('npx prisma generate --schema=prisma/schema.prisma', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_SKIP_MIGRATIONS: 'true'
    }
  });
  
  console.log('✅ Prisma client generated successfully without migrations!');
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}