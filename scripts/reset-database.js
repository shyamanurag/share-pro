/**
 * Database Reset Script
 * 
 * This script performs a complete database reset and creates a new database
 * with the schema defined in prisma/schema.prisma.
 * 
 * WARNING: This will delete all existing data in the database.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Starting database reset process...');
console.log('WARNING: This will delete all existing data in the database.');
console.log('');

try {
  // Step 1: Reset the database (drop all tables and recreate them)
  console.log('Step 1: Resetting database...');
  execSync('npx prisma migrate reset --force', {
    stdio: 'inherit',
  });
  console.log('✅ Database reset completed successfully!');
  
  // Step 2: Generate Prisma client
  console.log('\nStep 2: Generating Prisma client...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
  });
  console.log('✅ Prisma client generated successfully!');
  
  // Step 3: Verify database connection
  console.log('\nStep 3: Verifying database connection...');
  execSync('node prisma/check-connection.js', {
    stdio: 'inherit',
  });
  console.log('✅ Database connection verified successfully!');
  
  // Step 4: Seed the database with initial data
  console.log('\nStep 4: Seeding database with initial data...');
  execSync('node prisma/seed.js', {
    stdio: 'inherit',
  });
  console.log('✅ Database seeding completed successfully!');
  
  console.log('\n✅ Database reset and setup completed successfully!');
  console.log('You can now start the application with a fresh database.');
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Database reset failed:', error.message);
  process.exit(1);
}