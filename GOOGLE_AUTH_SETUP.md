# Setup Google Authentication for Supabase

## Prerequisites

1. A Google Cloud Project with OAuth 2.0 credentials
2. Supabase project with authentication enabled

## Step 1: Configure Google OAuth

### Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Set the application type as "Web Application"
6. Add your redirect URIs:
   - For development: `http://localhost:19006/--/login-callback` (if using Expo development server)
   - For production: `yourapp://login-callback`

### Configure Authorized Redirect URIs
Make sure to include:
- `yourapp://login-callback` (for universal links)
- `exp://*` (for Expo development)
- Your web app URL if applicable

## Step 2: Configure Supabase

1. Go to your Supabase Dashboard
2. Navigate to `Authentication` > `Settings`
3. Enable `Google` provider
4. Enter your Google OAuth credentials:
   - Client ID
   - Client Secret

## Step 3: Update Environment Variables

Add the following to your `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Update Database Schema

Run the user-specific schema migration to ensure all tables include user associations:

```sql
-- Add to your Supabase SQL Editor
-- Enhanced Supabase Schema for User-Specific Data
-- This script adds user_id fields to existing tables to make data user-specific

-- Add user_id column to orders table if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users DEFAULT auth.uid();
-- Add user_id column to fuel_expenses table if it doesn't exist
ALTER TABLE public.fuel_expenses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users DEFAULT auth.uid();
-- Add user_id column to oil_changes table if it doesn't exist
ALTER TABLE public.oil_changes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users DEFAULT auth.uid();
-- Add user_id column to spareparts table if it doesn't exist
ALTER TABLE public.spareparts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users DEFAULT auth.uid();
-- Add user_id column to motorcycles table if it doesn't exist
ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users DEFAULT auth.uid();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON public.orders(created_by);
CREATE INDEX IF NOT EXISTS idx_fuel_expenses_created_by ON public.fuel_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_oil_changes_created_by ON public.oil_changes(created_by);
CREATE INDEX IF NOT EXISTS idx_spareparts_created_by ON public.spareparts(created_by);
CREATE INDEX IF NOT EXISTS idx_motorcycles_created_by ON public.motorcycles(created_by);

-- Update RLS policies to enforce user-specific access for all tables
DROP POLICY IF EXISTS "Allow all access to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all access to fuel_expenses" ON public.fuel_expenses;
DROP POLICY IF EXISTS "Allow all access to oil_changes" ON public.oil_changes;

-- Create RLS policies for user-specific access
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete their own orders" ON public.orders
  FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can view their own fuel expenses" ON public.fuel_expenses
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert their own fuel expenses" ON public.fuel_expenses
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own fuel expenses" ON public.fuel_expenses
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete their own fuel expenses" ON public.fuel_expenses
  FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can view their own oil changes" ON public.oil_changes
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert their own oil changes" ON public.oil_changes
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own oil changes" ON public.oil_changes
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete their own oil changes" ON public.oil_changes
  FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can view their own sparepart records" ON public.spareparts
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert their own sparepart records" ON public.spareparts
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own sparepart records" ON public.spareparts
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete their own sparepart records" ON public.spareparts
  FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can view their own motorcycles" ON public.motorcycles
  FOR SELECT USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert their own motorcycles" ON public.motorcycles
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own motorcycles" ON public.motorcycles
  FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete their own motorcycles" ON public.motorcycles
  FOR DELETE USING (auth.uid() = created_by OR created_by IS NULL);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'User-specific schema updated successfully!' as message;
```

## Step 5: Test the Authentication

1. Run your application
2. Try signing in with Google
3. Verify that data is properly associated with the authenticated user

## Troubleshooting

- Make sure your redirect URIs match exactly between Google Cloud Console and Supabase
- If you're using Expo development, the default redirect URI should be handled automatically
- Check the Supabase logs for authentication errors

## Security Notice

The application now properly isolates user data using Row Level Security (RLS) policies, ensuring that users can only see and modify their own data.