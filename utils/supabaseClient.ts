import { createClient, type User } from '@supabase/supabase-js';

// Environment variables for Supabase
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.warn('EXPO_PUBLIC_SUPABASE_URL is not set in environment variables');
}
if (!SUPABASE_ANON_KEY) {
  console.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables');
}

// Create Supabase client only if environment variables are present
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  if (!supabase) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Initialize Supabase with default values if environment variables are not set
// This allows the app to work with a mock implementation when Supabase is not configured
export const initializeSupabase = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables are not set. App will use local storage only.');
    return null;
  }
  return supabase;
};

export default supabase;