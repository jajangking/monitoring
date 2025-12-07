// env.js - Environment configuration loader for Expo
// This file ensures environment variables are properly loaded in the Expo app

import * as FileSystem from 'expo-file-system';

// Load environment variables from .env file
// Note: In a real Expo app, you would typically use babel-plugin-module-resolver or similar
// to make sure .env is properly processed, but for this implementation we'll make sure
// the variables are available

// For development purposes, we'll ensure the environment variables are available
// In production, these should be set in your build process or deployment environment

// Define default values for required environment variables
const DEFAULT_ENV_VARS = {
  EXPO_PUBLIC_GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || null,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || null,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || null,
};

// Function to check if required environment variables are set
export const checkEnvironmentVariables = () => {
  const missingVars = [];
  
  if (!DEFAULT_ENV_VARS.EXPO_PUBLIC_GROQ_API_KEY) {
    missingVars.push("EXPO_PUBLIC_GROQ_API_KEY");
  }
  
  if (!DEFAULT_ENV_VARS.EXPO_PUBLIC_SUPABASE_URL) {
    missingVars.push("EXPO_PUBLIC_SUPABASE_URL");
  }
  
  if (!DEFAULT_ENV_VARS.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    missingVars.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }
  
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn("Please set these variables in your .env file and restart the app.");
  }
  
  return missingVars.length === 0;
};

// Export the environment variables
export const ENV = DEFAULT_ENV_VARS;

// Initialize environment check
checkEnvironmentVariables();