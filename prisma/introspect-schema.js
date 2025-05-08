// This script introspects the database and generates a Prisma schema
// that matches the existing database structure exactly

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
    
    if (fs.existsSync(schemaPath)) {
      fs.copyFileSync(schemaPath, backupPath);
      console.log(`Backed up schema to ${backupPath}`);
    }
    
    // Introspect the database to generate a schema that matches the existing structure
    console.log('Introspecting database...');
    await executeCommand('npx prisma db pull');
    
    console.log('Database introspection complete!');
    
    // Generate Prisma client from the introspected schema
    console.log('Generating Prisma client...');
    await executeCommand('npx prisma generate');
    
    console.log('Prisma client generated successfully!');
    
    // Create a marker file to indicate that we're using the introspected schema
    fs.writeFileSync(
      path.join(__dirname, '.introspected-schema'),
      `This file indicates that we're using a Prisma schema introspected from the existing database.
Do not modify the schema.prisma file directly unless you know what you're doing.
Created at: ${new Date().toISOString()}`
    );
    
    console.log('Introspection marker created.');
  } catch (error) {
    console.error('Failed to introspect database:', error);
    process.exit(1);
  }
}

main();