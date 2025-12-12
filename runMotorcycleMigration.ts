// Migration script to update the database schema for motorcycle functionality
// This script handles both the database schema update and data migration

import { supabase } from './utils/supabaseClient';

async function runMotorcycleMigration() {
  console.log('Starting motorcycle migration...');

  try {
    // First, check if the motorcycles table exists
    const { data: tables, error: tableError } = await supabase.rpc('information_schema.tables');
    if (tableError) {
      console.log('Could not check tables, proceeding anyway:', tableError.message);
    }

    // Create the motorcycles table if it doesn't exist
    const createMotorcyclesTableQuery = `
      CREATE TABLE IF NOT EXISTS motorcycles (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        year INTEGER,
        license_plate TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Note: The above CREATE TABLE approach may not work with Supabase's restricted permissions
    // The actual SQL needs to be run in the Supabase SQL editor
    console.log('Please run the following SQL in your Supabase SQL editor:');
    console.log(`
-- Add motorcycle_id column to oil_changes table
ALTER TABLE oil_changes ADD COLUMN IF NOT EXISTS motorcycle_id UUID;

-- Add motorcycle_id column to spareparts table
ALTER TABLE spareparts ADD COLUMN IF NOT EXISTS motorcycle_id UUID;

-- Create motorcycles table if it doesn't exist
CREATE TABLE IF NOT EXISTS motorcycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    year INTEGER,
    license_plate TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_oil_changes_motorcycle_id ON oil_changes(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_spareparts_motorcycle_id ON spareparts(motorcycle_id);
CREATE INDEX IF NOT EXISTS idx_motorcycles_created_at ON motorcycles(created_at);
    `);

    // After schema is updated, you might want to run data migration
    // For example, if you want to assign existing records to a default motorcycle
    console.log('Schema update commands have been displayed above.');
    console.log('After running these commands in your Supabase SQL editor:');
    console.log('1. The application will be able to store motorcycle-specific data');
    console.log('2. Existing data will need to be associated with specific motorcycles as needed');

  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Run the migration setup instructions
runMotorcycleMigration().catch(console.error);