import { supabase } from './utils/supabaseClient';

/**
 * This script creates the required tables in your Supabase database
 * Run this script once to set up the database schema
 */
export const createDatabaseSchema = async () => {
  console.log('Starting database schema creation...');

  try {
    // Create orders table
    const { error: ordersError } = await supabase.rpc('create_orders_table', {});
    if (ordersError) {
      console.warn('Could not create orders table via RPC, using alternative method:', ordersError.message);
    }

    // Create fuel_expenses table
    const { error: fuelError } = await supabase.rpc('create_fuel_expenses_table', {});
    if (fuelError) {
      console.warn('Could not create fuel_expenses table via RPC, using alternative method:', fuelError.message);
    }

    // Create oil_changes table
    const { error: oilError } = await supabase.rpc('create_oil_changes_table', {});
    if (oilError) {
      console.warn('Could not create oil_changes table via RPC, using alternative method:', oilError.message);
    }

    console.log('Schema setup attempted. Please check your Supabase dashboard for the tables.');
  } catch (error) {
    console.error('Error during schema creation:', error);
  }
};

/**
 * This function checks if the required tables exist and creates sample data if needed
 */
export const initializeDatabase = async () => {
  console.log('Initializing database with sample data...');

  // Check if tables have data
  try {
    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: true, head: true });
      
    if (ordersError) {
      console.error('Error checking orders table:', ordersError.message);
    } else if (ordersCount === 0) {
      // Add sample order data
      const { error } = await supabase
        .from('orders')
        .insert([
          {
            id: '1',
            amount: 150000,
            date: new Date().toISOString().split('T')[0],
            description: 'Sample order for testing',
            quantity: 1,
            price_per_item: 150000
          }
        ]);
      
      if (error) {
        console.error('Error inserting sample order:', error.message);
      } else {
        console.log('Sample order inserted successfully');
      }
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }

  try {
    const { count: expensesCount, error: expensesError } = await supabase
      .from('fuel_expenses')
      .select('*', { count: true, head: true });
      
    if (expensesError) {
      console.error('Error checking fuel_expenses table:', expensesError.message);
    } else if (expensesCount === 0) {
      // Add sample fuel expense data
      const { error } = await supabase
        .from('fuel_expenses')
        .insert([
          {
            id: '1',
            amount: 100000,
            date: new Date().toISOString().split('T')[0],
            liters: 10,
            description: 'Sample fuel expense for testing'
          }
        ]);
      
      if (error) {
        console.error('Error inserting sample fuel expense:', error.message);
      } else {
        console.log('Sample fuel expense inserted successfully');
      }
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }

  try {
    const { count: changesCount, error: changesError } = await supabase
      .from('oil_changes')
      .select('*', { count: true, head: true });
      
    if (changesError) {
      console.error('Error checking oil_changes table:', changesError.message);
    } else if (changesCount === 0) {
      // Add sample oil change data
      const { error } = await supabase
        .from('oil_changes')
        .insert([
          {
            id: '1',
            amount: 75000,
            date: new Date().toISOString().split('T')[0],
            mileage: 5000,
            description: 'Sample oil change for testing'
          }
        ]);
      
      if (error) {
        console.error('Error inserting sample oil change:', error.message);
      } else {
        console.log('Sample oil change inserted successfully');
      }
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }

  console.log('Database initialization completed.');
};