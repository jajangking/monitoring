# Supabase Setup Instructions

## Environment Variables

To use Supabase with this application, you need to set up the following environment variables:

1. Create a `.env` file in the root directory of the project
2. Add the following content:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or select an existing one
3. Go to Project Settings → API
4. Copy the "Project URL" and "anon public" key
5. Replace the placeholders in the `.env` file with your actual credentials

## Database Schema

The application expects the following tables to be created in your Supabase database:

First, run the SQL migration script provided in `supabase_migrations.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor (Database → SQL Editor)
3. Copy and paste the contents of `supabase_migrations.sql` file
4. Click "Run" to execute the migration

The migration script creates all required tables automatically:

- `orders` - for storing order information
- `fuel_expenses` - for storing fuel expense information
- `oil_changes` - for storing oil change information

## Fallback Behavior

If the Supabase environment variables are not set or if there are connection issues, the application will automatically fall back to using AsyncStorage for data storage. This ensures that the app continues to function even without a Supabase connection.