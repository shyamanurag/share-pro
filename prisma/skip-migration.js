// This script is used to generate Prisma client without running migrations
// It's useful when you want to use Prisma with an existing database
// without modifying the database schema

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute shell commands
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function main() {
  try {
    // Generate Prisma client without running migrations
    console.log('Generating Prisma client without migrations...');
    await executeCommand('npx prisma generate');
    
    console.log('Prisma client generated successfully!');
    
    // Create a marker file to indicate that we're using the existing schema
    fs.writeFileSync(
      path.join(__dirname, '.skip-migration'),
      `This file indicates that we're using Prisma with an existing database schema.
Do not delete this file unless you want to run migrations.
Created at: ${new Date().toISOString()}`
    );
    
    console.log('Skip migration marker created.');
  } catch (error) {
    console.error('Failed to generate Prisma client:', error);
    process.exit(1);
  }
}

main();