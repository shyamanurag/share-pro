// This script generates the Prisma client from the schema
// without attempting any database migrations or validations

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating Prisma client without migrations...');

try {
  // Generate the client with the --no-engine flag to skip any database operations
  execSync('npx prisma generate --schema=prisma/schema.prisma --no-engine', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_SKIP_MIGRATIONS: 'true',
      PRISMA_SCHEMA_DISABLE_MIGRATIONS: 'true'
    }
  });
  
  console.log('✅ Prisma client generated successfully without migrations!');
  
  // Verify the client was generated
  const clientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
  if (fs.existsSync(clientPath)) {
    console.log('✅ Prisma client files exist at expected location');
  } else {
    console.warn('⚠️ Prisma client files not found at expected location');
  }
  
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}