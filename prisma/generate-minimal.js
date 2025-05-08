// This script generates a Prisma client from a minimal schema
// without attempting any database migrations or validations

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
    // Backup the current schema
    const schemaPath = path.join(__dirname, 'schema.prisma');
    const backupPath = path.join(__dirname, 'schema.prisma.backup');
    const minimalPath = path.join(__dirname, 'schema.minimal.prisma');
    
    if (fs.existsSync(schemaPath)) {
      fs.copyFileSync(schemaPath, backupPath);
      console.log(`Backed up schema to ${backupPath}`);
    }
    
    // Copy the minimal schema to the main schema location
    fs.copyFileSync(minimalPath, schemaPath);
    console.log('Using minimal schema for client generation');
    
    // Generate Prisma client from the minimal schema
    console.log('Generating Prisma client...');
    await executeCommand('npx prisma generate');
    
    console.log('Prisma client generated successfully!');
    
    // Create a marker file to indicate that we're using a minimal schema
    fs.writeFileSync(
      path.join(__dirname, '.minimal-schema'),
      `This file indicates that we're using a minimal Prisma schema to avoid migrations.
Do not modify the schema.prisma file directly unless you know what you're doing.
Created at: ${new Date().toISOString()}`
    );
    
    console.log('Minimal schema marker created.');
  } catch (error) {
    console.error('Failed to generate Prisma client:', error);
    process.exit(1);
  }
}

main();