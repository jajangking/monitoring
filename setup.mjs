// setup.mjs
// This is a Node.js script that you can run to set up your Supabase database tables
// Usage: node setup.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Read Supabase credentials from environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Supabase environment variables not found.');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Function to read SQL files from the sql directory
async function readSQLFiles() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sqlDir = path.join(__dirname, 'sql');

  if (!fs.existsSync(sqlDir)) {
    console.error('SQL directory not found:', sqlDir);
    return [];
  }

  const files = fs.readdirSync(sqlDir);
  const sqlFiles = files.filter(file => path.extname(file) === '.sql');
  const migrations = [];

  for (const file of sqlFiles) {
    const filePath = path.join(sqlDir, file);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    migrations.push({
      filename: file,
      content: sqlContent
    });
  }

  return migrations.sort((a, b) => a.filename.localeCompare(b.filename));
}

// Function to output SQL to console for easy copying
async function outputSQLForMigration() {
  console.log('Starting database migration preparation...');

  const migrations = await readSQLFiles();

  if (migrations.length === 0) {
    console.log('No SQL files found in the sql directory.');
    return;
  }

  console.log(`Found ${migrations.length} migration files:`);
  migrations.forEach(m => console.log(`- ${m.filename}`));

  let fullSQL = '';

  for (const migration of migrations) {
    console.log(`\nProcessing migration: ${migration.filename}`);
    fullSQL += `\n-- Migration from ${migration.filename}\n`;
    fullSQL += migration.content;
    fullSQL += '\n\n';
  }

  console.log('\n' + '='.repeat(50));
  console.log('Complete SQL for migration:');
  console.log('=' .repeat(50));
  console.log(fullSQL);
  console.log('=' .repeat(50));
  console.log('\nTo apply this migration:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor (Database → SQL Editor)');
  console.log('3. Copy the SQL above and paste it into the editor');
  console.log('4. Click "Run" to execute the migration');
  console.log('\nNote: This script cannot execute DDL commands (CREATE TABLE, etc.)');
  console.log('automatically due to Supabase security restrictions.');
  console.log('DDL operations must be performed manually in the SQL Editor.');
}

async function main() {
  console.log('Supabase database migration tool');
  console.log('URL:', SUPABASE_URL);
  console.log('Reading migration files...\n');

  await outputSQLForMigration();
}

main();