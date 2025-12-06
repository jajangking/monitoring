// setup.mjs
// This is a Node.js script that you can run to set up your Supabase database tables
// Usage: node setup.mjs

import { createClient } from '@supabase/supabase-js';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

// Read Supabase credentials from environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Supabase environment variables not found.');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Note: This client setup is for demonstration only.
// For actual table creation, you need to run the SQL in the Supabase SQL Editor
// because table creation requires database privileges not available through the client library
console.log('Supabase client initialized successfully!');
console.log('URL:', SUPABASE_URL);

console.log('\nTo create the required tables:');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to SQL Editor (Database → SQL Editor)');
console.log('3. Copy and paste the following SQL:');
console.log('\n--- SQL to copy ---');
console.log(`CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  quantity INTEGER,
  price_per_item REAL
);

CREATE TABLE IF NOT EXISTS fuel_expenses (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  liters REAL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS oil_changes (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  mileage REAL,
  description TEXT
);

CREATE INDEX IF NOT EXISTS orders_date_idx ON orders (date);
CREATE INDEX IF NOT EXISTS fuel_expenses_date_idx ON fuel_expenses (date);
CREATE INDEX IF NOT EXISTS oil_changes_date_idx ON oil_changes (date);`);
console.log('--- End of SQL ---');
console.log('\n4. Click "Run" to execute the migration');